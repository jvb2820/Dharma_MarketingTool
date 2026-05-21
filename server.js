import { createServer } from 'node:http'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import serverlessChromium from '@sparticuz/chromium'
import { chromium as playwrightChromium } from 'playwright'

const companies = ['lemme', 'gruns', 'bloomsups', 'obvi']
const country = 'US'
const env = { ...loadEnv(), ...process.env }
const port = Number(env.PORT || env.API_PORT || 8787)
const isVercel = Boolean(env.VERCEL)
const vercelRequestBudgetMs = 52000
const languageSettings = {
  acceptLanguage: 'en-US,en;q=0.9,es-ES;q=0.8,es;q=0.7,pt-BR;q=0.6,pt;q=0.5',
  claudeInstruction:
    'Write the final JSON string values in English. If the captured Meta page text is in Spanish or Portuguese, you may use that language instead. Do not use any other language.',
  locale: 'en_US',
}

function loadEnv() {
  const files = ['.env.local', '.env']
  const values = {}

  for (const file of files) {
    if (!existsSync(file)) continue

    const lines = readFileSync(file, 'utf8').split(/\r?\n/)
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue

      const [key, ...rest] = trimmed.split('=')
      values[key] = rest.join('=')
    }
  }

  return values
}

export function sendJson(response, status, body) {
  response.writeHead(status, {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  })
  response.end(JSON.stringify(body))
}

function readBody(request) {
  if (request.body !== undefined) {
    if (!request.body) return Promise.resolve({})

    if (typeof request.body === 'string') {
      try {
        return Promise.resolve(JSON.parse(request.body))
      } catch (error) {
        return Promise.reject(error)
      }
    }

    if (Buffer.isBuffer(request.body)) {
      try {
        return Promise.resolve(JSON.parse(request.body.toString('utf8')))
      } catch (error) {
        return Promise.reject(error)
      }
    }

    if (typeof request.body === 'object') {
      return Promise.resolve(request.body)
    }
  }

  return new Promise((resolve, reject) => {
    let body = ''

    request.on('data', (chunk) => {
      body += chunk
    })

    request.on('end', () => {
      if (!body) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(body))
      } catch (error) {
        reject(error)
      }
    })
  })
}

function metaLibraryUrl(company) {
  const params = new URLSearchParams({
    active_status: 'active',
    ad_type: 'all',
    country,
    is_targeted_country: 'false',
    locale: languageSettings.locale,
    media_type: 'all',
    q: company,
    search_type: 'keyword_unordered',
  })

  params.set('sort_data[mode]', 'total_impressions')
  params.set('sort_data[direction]', 'desc')

  return `https://www.facebook.com/ads/library/?${params.toString()}`
}

function extractPdfStrings(rawText) {
  return [...rawText.matchAll(/\(([^()]*)\)\s*Tj/g)]
    .map((match) => match[1])
    .join('\n')
    .replace(/Ã±/g, 'ñ')
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
}

function loadFaqProductContext() {
  const faqDir = 'FAQ'

  if (!existsSync(faqDir)) {
    return 'No FAQ folder found.'
  }

  return readdirSync(faqDir)
    .filter((file) => file.toLowerCase().endsWith('.pdf'))
    .map((file) => {
      const rawText = readFileSync(join(faqDir, file), 'utf8')
      return `File: ${file}\n${extractPdfStrings(rawText)}`
    })
    .join('\n\n')
}

async function dismissCookieDialog(page) {
  const labels = [
    'Allow all cookies',
    'Decline optional cookies',
    'Only allow essential cookies',
    'Accept all',
    'Reject all',
  ]

  for (const label of labels) {
    const button = page.getByRole('button', { name: label }).first()
    if (await button.isVisible().catch(() => false)) {
      await button.click().catch(() => undefined)
      await page.waitForTimeout(800)
      return
    }
  }
}

async function captureCompanyPage(browser, company) {
  const sourceUrl = metaLibraryUrl(company)
  let context

  try {
    context = await browser.newContext({
      extraHTTPHeaders: {
        'Accept-Language': languageSettings.acceptLanguage,
      },
      locale: 'en-US',
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      viewport: {
        height: 1600,
        width: 1365,
      },
    })
    const page = await context.newPage()

    await page.goto(sourceUrl, {
      timeout: isVercel ? 25000 : 45000,
      waitUntil: 'domcontentloaded',
    })
    await dismissCookieDialog(page)
    await page.waitForLoadState('networkidle', { timeout: isVercel ? 6000 : 15000 }).catch(
      () => undefined,
    )
    await page.waitForTimeout(isVercel ? 2500 : 5000)
    await page.mouse.wheel(0, 700)
    await page.waitForTimeout(isVercel ? 1200 : 2500)

    const visibleText = await page.locator('body').innerText({ timeout: isVercel ? 5000 : 10000 })
    let screenshotBase64 = ''

    if (!isVercel || env.CAPTURE_AD_SCREENSHOTS === 'true') {
      const screenshot = await page.screenshot({
        fullPage: false,
        quality: isVercel ? 35 : 62,
        type: 'jpeg',
      })
      screenshotBase64 = screenshot.toString('base64')
    }

    return {
      company,
      error: null,
      sourceUrl,
      status: 'captured',
      visibleText: visibleText.replace(/\s+\n/g, '\n').slice(0, isVercel ? 4000 : 8000),
      screenshotBase64,
    }
  } catch (error) {
    return {
      company,
      error:
        error instanceof Error
          ? error.message
          : 'Could not capture the public Meta Ads Library page.',
      sourceUrl,
      status: 'failed',
      visibleText: '',
      screenshotBase64: '',
    }
  } finally {
    await context?.close().catch(() => undefined)
  }
}

function failedCapture(company, error) {
  return {
    company,
    error:
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Could not capture the public Meta Ads Library page.',
    sourceUrl: metaLibraryUrl(company),
    status: 'failed',
    visibleText: '',
    screenshotBase64: '',
  }
}

async function captureCompany(company, sharedBrowser) {
  if (sharedBrowser) {
    return captureCompanyPage(sharedBrowser, company)
  }

  let browser

  try {
    browser = await launchBrowser()
    return await captureCompanyPage(browser, company)
  } catch (error) {
    return failedCapture(company, error)
  } finally {
    await browser?.close().catch(() => undefined)
  }
}

async function launchBrowser() {
  if (!isVercel) {
    return playwrightChromium.launch({ headless: true })
  }

  serverlessChromium.setGraphicsMode = false

  return playwrightChromium.launch({
    args: [
      ...serverlessChromium.args,
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--hide-scrollbars',
      '--mute-audio',
    ],
    executablePath: await serverlessChromium.executablePath(),
    headless: true,
  })
}

function makeClaudeContent(captures, brandContext) {
  const content = [
    {
      type: 'text',
      text: `You are analyzing public Meta Ads Library pages captured as screenshots and visible page text.

Task:
1. For each company, check whether the visible ads appear to be from, or clearly connected to, the target company.
2. Identify the longest-running visible active ad by reading visible "Started running on..." dates. If the page does not reveal enough ads to prove the absolute longest-running ad, say "longest visible ad" instead of pretending certainty.
3. Extract the visible ad wording as accurately as possible without inventing missing text.
4. Analyze competitor design as inspiration: layout, colors, product shot, person/UGC style, overlays, CTA, and offer angle.
5. Recommend how our brand can make a similar but original ad that is better. Do not copy brand assets or exact wording.
6. Use the product FAQ context for product-specific descriptions and claims. Stay careful with weight-loss claims: avoid guaranteed outcomes, diagnose/treat language, and unsafe medical promises.
7. The campaign date, day type, and event name are for OUR recommended ad only. Do not use them to filter or reinterpret competitor ads. If competitor ads are not seasonal, still use their general patterns as inspiration and adapt our recommendation to the selected event.
8. Focus recommendations only on the selected product. Do not mix Berberine Plus and GLP-1 details unless the selected product explicitly calls for it.
9. ${languageSettings.claudeInstruction} Keep JSON keys exactly as shown in the schema.

Brand context:
${JSON.stringify(brandContext, null, 2)}

Return only valid JSON. Do not wrap it in markdown. Keep every string concise, use at most 4 bullets per array, and make sure the JSON is complete with a final closing brace. Use this schema:
{
  "competitors": [
    {
      "company": "string",
      "connectionAssessment": "string",
      "longestVisibleAd": "string",
      "visibleWords": ["string"],
      "designAnalysis": "string",
      "whatToBorrow": ["string"],
      "whatToImprove": ["string"]
    }
  ],
  "recommendedDescription": {
    "primaryText": "string",
    "headline": "string",
    "description": "string",
    "cta": "string"
  },
  "recommendedDesign": {
    "concept": "string",
    "visualDirection": "string",
    "layout": "string",
    "colorAndStyle": "string",
    "shotList": ["string"]
  },
  "campaignAngle": {
    "dayContext": "string",
    "hook": "string",
    "offerAngle": "string",
    "audienceFit": "string"
  },
  "complianceNotes": ["string"],
  "nextTests": ["string"]
}`,
    },
  ]

  for (const capture of captures) {
    content.push({
      type: 'text',
      text: `Company: ${capture.company}
Source URL: ${capture.sourceUrl}
Capture status: ${capture.status}
Capture error: ${capture.error || 'none'}
Visible page text:
${capture.visibleText || '(no visible text captured)'}`,
    })

    if (capture.screenshotBase64) {
      content.push({
        source: {
          data: capture.screenshotBase64,
          media_type: 'image/jpeg',
          type: 'base64',
        },
        type: 'image',
      })
    }
  }

  return content
}

function parseClaudeJson(report) {
  const cleaned = report
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')

    if (start === -1 || end === -1 || end <= start) {
      return null
    }

    try {
      return JSON.parse(cleaned.slice(start, end + 1))
    } catch {
      return null
    }
  }
}

function firstCapturedText(captures) {
  return captures.find((capture) => capture.visibleText)?.visibleText || ''
}

function buildFallbackAnalysis(captures, brandContext, note) {
  const product = brandContext.campaignContext?.selectedProduct || brandContext.product || 'the selected product'
  const eventName = brandContext.campaignContext?.eventName?.trim()
  const dayType = brandContext.campaignContext?.dayType || 'Normal day'
  const capturedText = firstCapturedText(captures)
  const visibleSnippet = capturedText
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 28)
    .join(' ')

  return {
    campaignAngle: {
      audienceFit:
        'Use the competitor scan as directional inspiration for wellness shoppers, not as copy to duplicate.',
      dayContext: eventName ? `${dayType}: ${eventName}` : dayType,
      hook: `Make ${product} feel simple, credible, and easy to start today.`,
      offerAngle:
        'Lead with a clear routine benefit, then support it with product education and a low-friction CTA.',
    },
    competitors: captures.map((capture) => ({
      company: capture.company,
      connectionAssessment:
        capture.status === 'captured'
          ? 'A public Meta Ads Library page was captured for directional review.'
          : capture.error || 'This page was not captured in the deployed runtime.',
      designAnalysis:
        capture.status === 'captured'
          ? 'Use the visible page structure and ad library wording as a high-level reference; screenshots were skipped on Vercel for speed.'
          : 'No design read available from this deployment run.',
      longestVisibleAd:
        capture.status === 'captured'
          ? 'Longest visible ad not clear from the text-only deployment capture.'
          : 'Not captured',
      visibleWords:
        capture.status === 'captured' && visibleSnippet
          ? [visibleSnippet]
          : ['No visible ad wording captured.'],
      whatToBorrow:
        capture.status === 'captured'
          ? ['Simple benefit framing', 'Clear product naming', 'Direct path to learn more']
          : ['Retry locally or move capture to a longer-running backend'],
      whatToImprove:
        capture.status === 'captured'
          ? ['Make the recommendation more product-specific', 'Avoid copying competitor wording']
          : ['Capture this competitor before using it as inspiration'],
    })),
    complianceNotes: [
      'Avoid guaranteed weight-loss or medical outcome claims.',
      'Do not copy competitor brand assets, layouts, or exact wording.',
      note || 'Fallback analysis was generated because Claude did not return formatted JSON.',
    ],
    nextTests: [
      'Test a product education angle against a simple benefit angle.',
      'Test UGC-style copy against a cleaner clinical-style ad.',
      'Run the full screenshot workflow on a longer-running backend for richer creative reads.',
    ],
    recommendedDescription: {
      cta: 'Learn More',
      description: 'A simple daily wellness support option from Dharma.',
      headline: `${product} support, made simple`,
      primaryText: `Support your ${product} campaign with a clear, credible ad that explains the routine benefit without overpromising results.`,
    },
    recommendedDesign: {
      colorAndStyle:
        'Use clean clinic-forward styling with warm product accents, high contrast text, and restrained wellness imagery.',
      concept: `${product} routine reset`,
      layout:
        'Lead with the product and a short benefit statement, then add one proof or education point and a clear CTA.',
      shotList: [
        'Product or clinic-safe hero shot',
        'Simple routine moment',
        'Close-up of packaging or service detail',
      ],
      visualDirection:
        'Original Dharma-branded creative inspired by competitor clarity, not competitor assets.',
    },
  }
}

async function analyzeWithClaude(captures, brandContext) {
  const key = env.ANTHROPIC_API_KEY

  if (!key) {
    return {
      error: 'ANTHROPIC_API_KEY is missing.',
      report: null,
    }
  }

  const models = [
    'claude-3-5-haiku-20241022',
    'claude-sonnet-4-20250514',
    'claude-3-7-sonnet-20250219',
  ]
  let lastError = 'Claude analysis failed.'

  for (const model of models) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), isVercel ? 18000 : 90000)

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        body: JSON.stringify({
          max_tokens: isVercel ? 2600 : 7000,
          messages: [
            {
              content: makeClaudeContent(captures, brandContext),
              role: 'user',
            },
          ],
          model,
        }),
        headers: {
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'x-api-key': key,
        },
        method: 'POST',
        signal: controller.signal,
      })

      const payload = await response.json()

      if (response.ok) {
        const report = payload.content?.map((block) => block.text).filter(Boolean).join('\n\n') || ''
        const parsed = parseClaudeJson(report)

        return {
          error: parsed ? null : 'Claude returned unformatted text, so a structured fallback was generated.',
          model,
          parsed: parsed || buildFallbackAnalysis(captures, brandContext),
          report,
        }
      }

      lastError = payload.error?.message || `Claude analysis failed with ${model}.`
    } catch (error) {
      lastError =
        error instanceof Error && error.name === 'AbortError'
          ? `Claude analysis timed out with ${model}.`
          : error instanceof Error
            ? error.message
            : `Claude analysis failed with ${model}.`
    } finally {
      clearTimeout(timeout)
    }
  }

  return {
    error: lastError,
    model: null,
    parsed: buildFallbackAnalysis(captures, brandContext, lastError),
    report: null,
  }
}

export async function handleResearch(request, response) {
  let body

  try {
    body = await readBody(request)
  } catch {
    sendJson(response, 400, { error: 'Request body must be valid JSON.' })
    return
  }

  const campaignContext = body.campaignContext || {
    campaignDate: new Date().toISOString().slice(0, 10),
    dayType: 'Normal day',
    eventName: '',
    selectedProduct: 'Berberine Plus',
  }
  const brandContext = body.brandContext || {
    audience: 'wellness supplement shoppers',
    brandName: 'Our Brand',
    constraints: 'Create original ads inspired by patterns, not copied wording or designs.',
    product: campaignContext.selectedProduct || 'Berberine Plus',
    tone: 'clear, premium, benefit-led, compliant',
  }
  const enrichedBrandContext = {
    ...brandContext,
    campaignContext,
    productFaqContext: loadFaqProductContext(),
  }

  let browser
  const startedAt = Date.now()

  try {
    browser = isVercel ? null : await launchBrowser()
    const captures = []

    for (const company of companies) {
      if (isVercel && Date.now() - startedAt > 30000) {
        captures.push(failedCapture(company, 'Skipped to stay within the Vercel function timeout.'))
        continue
      }

      captures.push(await captureCompany(company, browser))
    }

    if (captures.every((capture) => capture.status === 'failed')) {
      sendJson(response, 500, {
        error: `Browser capture failed on Vercel: ${captures[0]?.error || 'No pages could be captured.'}`,
        companies,
        country,
        results: captures.map(({ screenshotBase64, ...capture }) => ({
          ...capture,
          screenshotCaptured: Boolean(screenshotBase64),
        })),
      })
      return
    }

    if (isVercel && Date.now() - startedAt > vercelRequestBudgetMs - 22000) {
      sendJson(response, 200, {
        analysis: {
          error: 'Captured competitor pages, but skipped Claude analysis to avoid the Vercel function timeout. Run locally for the full screenshot-based report or move this API to a long-running backend.',
          model: null,
          parsed: null,
          report: null,
        },
        companies,
        country,
        results: captures.map(({ screenshotBase64, ...capture }) => ({
          ...capture,
          screenshotCaptured: Boolean(screenshotBase64),
        })),
      })
      return
    }

    const analysis = await analyzeWithClaude(captures, enrichedBrandContext)

    sendJson(response, 200, {
      analysis,
      companies,
      country,
      results: captures.map(({ screenshotBase64, ...capture }) => ({
        ...capture,
        screenshotCaptured: Boolean(screenshotBase64),
      })),
    })
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : 'Research request failed.',
    })
  } finally {
    await browser?.close().catch(() => undefined)
  }
}

export function handleAdsResearchRequest(request, response) {
  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {})
    return
  }

  if (request.method === 'POST') {
    handleResearch(request, response)
    return
  }

  sendJson(response, 405, { error: 'Method not allowed.' })
}

export function handleRequest(request, response) {
  const pathname = request.url ? new URL(request.url, 'http://localhost').pathname : ''

  if (request.method === 'GET' && (pathname === '/' || pathname === '/api/health')) {
    sendJson(response, 200, {
      ok: true,
      service: 'Dharma ads research API',
    })
    return
  }

  if (pathname === '/api/ads/research') {
    handleAdsResearchRequest(request, response)
    return
  }

  sendJson(response, 404, { error: 'Not found.' })
}

function isMainModule() {
  return process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
}

if (isMainModule()) {
  createServer(handleRequest).listen(port, () => {
    console.log(`Ads research API running on http://localhost:${port}`)
  })
}
