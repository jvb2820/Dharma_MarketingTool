import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { createClient, type Session } from '@supabase/supabase-js'
import './App.css'

type MarketingRoute = {
  label: string
  path: string
  eyebrow: string
  title: string
  description: string
}

const marketingRoutes: MarketingRoute[] = [
  {
    label: 'Home',
    path: '/',
    eyebrow: 'Marketing Tool',
    title: 'Campaign Command Center',
    description: 'Plan, preview, and route every marketing asset from one warm, focused workspace.',
  },
  {
    label: 'Ads Injection',
    path: '/ads-dharma',
    eyebrow: 'Paid Media',
    title: 'Ads Injection',
    description: 'Track ad angles, offers, and variants for the injection campaign lane.',
  },
  {
    label: 'Ads Supplement',
    path: '/ads-berberine',
    eyebrow: 'Paid Media',
    title: 'Ads Supplement',
    description: 'Coordinate claims, creatives, and tests for the supplement campaign lane.',
  },
  {
    label: 'Banner',
    path: '/banner',
    eyebrow: 'Display',
    title: 'Banner Assets',
    description: 'Prepare static and responsive banner directions for quick deployment.',
  },
  {
    label: 'Communities',
    path: '/communities',
    eyebrow: 'Community',
    title: 'Communities',
    description: 'Track community placements, platform links, approvals, and notes in one shared board.',
  },
  {
    label: 'Email',
    path: '/email',
    eyebrow: 'Lifecycle',
    title: 'Email Campaigns',
    description: 'Build nurture sequences, launches, and patient-ready flows with clear handoffs.',
  },
  {
    label: 'Insta',
    path: '/insta',
    eyebrow: 'Social',
    title: 'Instagram Studio',
    description: 'Organize feed concepts, story prompts, and creator-friendly visual notes.',
  },
  {
    label: 'Mockup',
    path: '/mockup',
    eyebrow: 'Creative',
    title: 'Mockup Review',
    description: 'Keep visual drafts, feedback, and next actions together before production.',
  },
  {
    label: 'SMS',
    path: '/sms',
    eyebrow: 'Retention',
    title: 'SMS Broadcasts',
    description: 'Shape short-form reminders, promos, and follow-ups for quick approvals.',
  },
  {
    label: 'Tiktok',
    path: '/tiktok',
    eyebrow: 'Short Video',
    title: 'Tiktok Concepts',
    description: 'Draft hooks, angles, and testable video ideas for faster creative cycles.',
  },
]

type AdResult = {
  company: string
  error: string | null
  screenshotCaptured: boolean
  sourceUrl: string
  status: string
  visibleText: string
}

type ResearchResponse = {
  analysis: {
    error: string | null
    model?: string | null
    parsed?: StructuredAnalysis | null
    report: string | null
  }
  companies: string[]
  country: string
  results: AdResult[]
}

type StructuredAnalysis = {
  campaignAngle?: {
    audienceFit?: string
    dayContext?: string
    hook?: string
    offerAngle?: string
  }
  competitors?: {
    company: string
    connectionAssessment?: string
    designAnalysis?: string
    longestVisibleAd?: string
    visibleWords?: string[]
    whatToBorrow?: string[]
    whatToImprove?: string[]
  }[]
  complianceNotes?: string[]
  nextTests?: string[]
  recommendedDescription?: {
    cta?: string
    description?: string
    headline?: string
    primaryText?: string
  }
  recommendedDesign?: {
    colorAndStyle?: string
    concept?: string
    layout?: string
    shotList?: string[]
    visualDirection?: string
  }
}

const dayTypes = ['Normal day', "Mother's Day", "Valentine's Day", 'Holiday', 'Sale event']
const productOptions = ['Berberine Plus', 'GLP-1 Personalized Injections']
const approvalOptions = ['Pending Approval', 'Approved', 'Not Approved']
const adsApiBaseUrl = (import.meta.env.VITE_ADS_API_URL || '').replace(/\/+$/, '')
const adsResearchUrl = `${adsApiBaseUrl}/api/ads/research`
const researchProgressStages = [
  {
    detail: 'Opening the first Meta Ads Library search.',
    label: 'Starting browser capture',
    maxPercent: 18,
    minPercent: 8,
    startSecond: 0,
  },
  {
    detail: 'Reading visible ads and taking screenshots.',
    label: 'Capturing competitor pages',
    maxPercent: 52,
    minPercent: 18,
    startSecond: 18,
  },
  {
    detail: 'Preparing captured page text and screenshots for analysis.',
    label: 'Packaging ad evidence',
    maxPercent: 68,
    minPercent: 52,
    startSecond: 58,
  },
  {
    detail: 'Claude is comparing patterns and drafting recommendations.',
    label: 'Analyzing creative strategy',
    maxPercent: 86,
    minPercent: 68,
    startSecond: 78,
  },
  {
    detail: 'Longer runs usually mean Meta or Claude is responding slowly.',
    label: 'Finalizing the report',
    maxPercent: 94,
    minPercent: 86,
    startSecond: 125,
  },
]
const dharmaMapsUrl =
  'https://www.google.com/maps/place/Dharma+Nutrition+Clinic/@26.4075009,-80.1060574,17z/data=!3m1!4b1!4m6!3m5!1s0x88d91b054f59591f:0xcc16ab16176ca5ae!8m2!3d26.4074961!4d-80.1034825!16s%2Fg%2F11sfpydf9_?hl=en-US&entry=ttu&g_ep=EgoyMDI2MDUxMy4wIKXMDSoASAFQAw%3D%3D'
const emailQuickLinks = [
  {
    label: 'NAD+ - LP SP Link',
    url: 'https://dharmanutritionclinic.com/products/inyeccion-nad',
  },
  {
    label: 'NAD+ - WP SP Link',
    url: '',
  },
  {
    label: 'Weight Loss - WP SP Link',
    url: 'https://wa.link/iw4t1u',
  },
  {
    label: 'Weight Loss - LP SP Link',
    url: 'https://dharmanutritionclinic.com/products/inyecciones-glp-1-personalizadas-para-una-perdida-de-peso-duradera',
  },
  {
    label: 'Landing Lipo Mino Link',
    url: 'https://dharmanutritionclinic.com/products/super-mic-b12',
  },
  {
    label: 'Lipo - Mino Whatsapp Link',
    url: 'https://wa.link/g5p953',
  },
  {
    label: 'Link Berberine+',
    url: 'https://dharmanutritionclinic.com/es/products/berberine',
  },
]

type EmailRow = {
  id: string
  date: string
  time: string
  creativeLink: string
  headline: string
  linkUrl: string
  link2Url: string
  copyReady: boolean
  creativeReady: boolean
  approval: string
  obs: string
  scheduled: boolean
}

type EmailDbRow = {
  id: string
  row_order: number
  date: string
  time: string
  creative_link: string | null
  headline: string | null
  link_url: string | null
  link_2_url: string | null
  copy_ready: boolean
  creative_ready: boolean
  approval: string
  obs: string | null
  scheduled: boolean
}

type SmsRow = {
  id: string
  date: string
  time: string
  text: string
  artLink: string
  linkUrl: string
  textReady: boolean
  approval: string
  obs: string
  scheduled: boolean
}

type SmsDbRow = {
  id: string
  row_order: number
  date: string
  time: string
  text: string | null
  art_link: string | null
  link_url: string | null
  text_ready: boolean
  approval: string
  obs: string | null
  scheduled: boolean
}

type InstaRow = {
  id: string
  date: string
  time: string
  feed: string
  caption: string
  approval: string
  obs: string
  stories: string
  storyApproval: string
}

type InstaDbRow = {
  id: string
  row_order: number
  date: string
  time: string
  feed: string | null
  caption: string | null
  approval: string
  obs: string | null
  stories: string | null
  story_approval: string
}

type TiktokRow = {
  id: string
  date: string
  time: string
  videoLinks: string
  caption: string
  approval: string
  obs: string
}

type TiktokDbRow = {
  id: string
  row_order: number
  date: string
  time: string
  video_links: string | null
  caption: string | null
  approval: string
  obs: string | null
}

type MockupRow = {
  id: string
  date: string
  platform: string
  link: string
  mockupLink: string
  approval: string
  obs: string
}

type MockupDbRow = {
  id: string
  row_order: number
  date: string
  platform: string | null
  link: string | null
  mockup_link: string | null
  approval: string
  obs: string | null
}

type CommunityRow = {
  id: string
  date: string
  platform: string
  link: string
  approval: string
  obs: string
}

type CommunityDbRow = {
  id: string
  row_order: number
  date: string
  platform: string | null
  link: string | null
  approval: string
  obs: string | null
}

type AdsDharmaRow = {
  id: string
  date: string
  copy: string
  text: string
  artLink1: string
  artLink2: string
  artLink3: string
  linkLinks: string
  textReady: boolean
  approval: string
}

type AdsDharmaDbRow = {
  id: string
  row_order: number
  date: string
  copy: string | null
  text: string | null
  art_link_1: string | null
  art_link_2: string | null
  art_link_3: string | null
  link_links: string | null
  text_ready: boolean
  approval: string
}

type AdsBerberineRow = {
  id: string
  date: string
  copy: string
  text: string
  artLink1: string
  artLink2: string
  artLink3: string
  linkLinks: string
  textReady: boolean
  approval: string
  obs: string
  scheduled: boolean
}

type AdsBerberineDbRow = {
  id: string
  row_order: number
  date: string
  copy: string | null
  text: string | null
  art_link_1: string | null
  art_link_2: string | null
  art_link_3: string | null
  link_links: string | null
  text_ready: boolean
  approval: string
  obs: string | null
  scheduled: boolean
}

type BannerRow = {
  id: string
  startDate: string
  endDate: string
  text: string
  artLink: string
  copyReady: boolean
  artReady: boolean
  approval: string
  obs: string
}

type BannerDbRow = {
  id: string
  row_order: number
  start_date: string
  end_date: string
  text: string | null
  art_link: string | null
  copy_ready: boolean
  art_ready: boolean
  approval: string
  obs: string | null
}

type MasterCalendarEvent = {
  id: string
  date: string
  endDate: string
  title: string
  channel: string
  notes: string
  plan: MarketingMasterPlan
}

type MarketingMasterPlanDbRow = {
  campaign_id: string
  selected_date: string
  start_date: string
  end_date: string
  option_key: string
  option_label: string
  row_order: number
  injections: string | null
  supplements: string | null
}

type MarketingMasterPlan = {
  injections: Record<string, string>
  supplements: Record<string, string>
}

const marketingMasterPlanRows = [
  'Product',
  'Instagram Post',
  'Instagram Stories',
  'TikTok',
  'Email',
  'Email Schedule',
  'SMS',
  'SMS Schedule',
  'Video Reel',
  'Offer',
  'Website',
  'Website Banner Copy',
  'Ads',
  'Ads Quantity',
  'Notes',
  'Club',
  'Influencer Kit',
  'Influencer Kit Delivery Date',
  'Profile/Highlight Photo',
]

function createEmptyMarketingPlan(): MarketingMasterPlan {
  return {
    injections: Object.fromEntries(marketingMasterPlanRows.map((row) => [row, ''])),
    supplements: Object.fromEntries(marketingMasterPlanRows.map((row) => [row, ''])),
  }
}

function toMarketingMasterOptionKey(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

const initialEmailRows: EmailRow[] = [
  {
    id: 'email-1',
    approval: 'Approved',
    creativeLink: '',
    creativeReady: true,
    copyReady: true,
    date: '2026-05-13',
    headline: 'Weight loss injections',
    link2Url: '',
    linkUrl: '',
    obs: '',
    scheduled: true,
    time: '08:00',
  },
  {
    id: 'email-2',
    approval: 'Pending Approval',
    creativeLink: '',
    creativeReady: false,
    copyReady: true,
    date: '2026-05-21',
    headline: 'This week, celebrate feeling lighter',
    link2Url: '',
    linkUrl: '',
    obs: 'Add final offer link before scheduling.',
    scheduled: false,
    time: '11:00',
  },
]

const initialSmsRows: SmsRow[] = [
  {
    id: 'sms-1',
    approval: 'Approved',
    artLink: '',
    date: '2026-05-12',
    linkUrl: 'https://dharmanutritionclinic.com/',
    obs: '',
    scheduled: true,
    text: 'Help curb cravings and reduce bloating. Berberine+ is your natural support. Real wellness momentum starts now.',
    textReady: true,
    time: '17:30',
  },
]

const initialInstaRows: InstaRow[] = [
  {
    id: 'insta-1',
    approval: 'Approved',
    caption:
      'Support makes the difference. Comment NOW and start your plan.',
    date: '2026-05-18',
    feed: '',
    obs: '',
    stories: '',
    storyApproval: 'Not Approved',
    time: '17:15',
  },
]

const initialTiktokRows: TiktokRow[] = [
  {
    id: 'tiktok-1',
    approval: 'Approved',
    caption:
      'Dharma is here to guide and support you through every stage of the journey. Your wellness deserves consistency, patience, and the right support.',
    date: '2026-05-18',
    obs: '',
    time: '13:00',
    videoLinks: '05-18 TIKTOK DHARMA',
  },
]

const initialMockupRows: MockupRow[] = [
  {
    id: 'mockup-1',
    approval: 'Pending Approval',
    date: 'May 04 to 15',
    link: '',
    mockupLink: '',
    obs: '',
    platform: 'INSTAGRAM',
  },
]

const initialCommunityRows: CommunityRow[] = [
  {
    id: 'communities-1',
    approval: 'Pending Approval',
    date: 'May 04 to 15',
    link: '',
    obs: '',
    platform: 'INSTAGRAM',
  },
]

const initialAdsDharmaRows: AdsDharmaRow[] = [
  {
    id: 'ads-dharma-1',
    approval: 'Approved',
    artLink1: 'Injection Valentine campaign',
    artLink2: 'Injection Valentine campaign',
    artLink3: 'Injection Valentine campaign',
    copy: '',
    date: '',
    linkLinks: '',
    text:
      "Valentine's Day is for everyone ready to fall in love with their process.",
    textReady: true,
  },
  {
    id: 'ads-dharma-2',
    approval: 'Approved',
    artLink1: 'Injection Valentine campaign',
    artLink2: 'Injection Valentine campaign',
    artLink3: 'Injection Valentine campaign',
    copy: '',
    date: '',
    linkLinks: '',
    text:
      'Weight loss injections can help you reconnect with your energy, your confidence, and the version of yourself you have missed.',
    textReady: true,
  },
]

const initialAdsBerberineRows: AdsBerberineRow[] = [
  {
    id: 'ads-berberine-1',
    approval: 'Pending Approval',
    artLink1: '',
    artLink2: '',
    artLink3: '',
    copy: 'ADS BERBERINE',
    date: 'May 5',
    linkLinks: '',
    obs: '',
    scheduled: false,
    text: '',
    textReady: false,
  },
  {
    id: 'ads-berberine-2',
    approval: 'Pending Approval',
    artLink1: '',
    artLink2: '',
    artLink3: '',
    copy: 'ADS BERBERINE',
    date: "Mother's Day",
    linkLinks: '',
    obs: '',
    scheduled: false,
    text: '',
    textReady: false,
  },
]

const initialBannerRows: BannerRow[] = [
  {
    id: 'banner-1',
    approval: 'Pending Approval',
    artLink: '',
    artReady: false,
    copyReady: true,
    endDate: '2026-05-05',
    obs: '',
    startDate: '2026-05-01',
    text: 'MX May 5\nFire in the celebration. Control in your body.\nThe real revolution starts from within.',
  },
]

const supabaseProjectUrl = (
  import.meta.env.VITE_SUPABASE_URL || 'https://nrweevesdbicfgjzvfvj.supabase.co'
).replace(/\/rest\/v1\/?$/, '')
const supabaseRestUrl = `${supabaseProjectUrl}/rest/v1`
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const supabaseClient = createClient(supabaseProjectUrl, supabaseAnonKey || 'missing-anon-key')
let supabaseAccessToken = ''

function supabaseHeaders(prefer?: string) {
  return {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAccessToken || supabaseAnonKey}`,
    'Content-Type': 'application/json',
    ...(prefer ? { Prefer: prefer } : {}),
  }
}

function normalizeApproval(value?: string | null) {
  const normalizedValue = value?.trim().toLowerCase()

  if (
    normalizedValue === 'to be approved' ||
    normalizedValue === 'pending approval' ||
    normalizedValue === 'aprobacion' ||
    normalizedValue === 'aprobaci\u00f3n'
  ) {
    return 'Pending Approval'
  }

  if (normalizedValue === 'no approved' || normalizedValue === 'not approved') {
    return 'Not Approved'
  }

  if (normalizedValue === 'approved') {
    return 'Approved'
  }

  return 'Pending Approval'
}

function toStoredApproval(value: string) {
  if (value === 'Pending Approval') return 'To Be Approved'
  if (value === 'Not Approved') return 'No Approved'

  return value
}

function translateLegacyEnglish(value?: string | null) {
  const text = value || ''
  const legacyText: Record<string, string> = {
    '5 DE MAYO': 'May 5',
    'DIA DE LAS MADRES': "Mother's Day",
    'Dharma san valentin': 'Dharma Valentine campaign',
    'El acompanamiento hace la diferencia. Comenta AHORA y empieza tu plan.':
      'Support makes the difference. Comment NOW and start your plan.',
    'Esta semana, celebra sintiendote ligera': 'This week, celebrate feeling lighter',
    'Inyecciones para bajar de peso': 'Weight loss injections',
    'Bloquea antojos, reduce hinchazon. Berberine+ tu soporte natural. Resultados reales ya.':
      'Help curb cravings and reduce bloating. Berberine+ is your natural support. Real wellness momentum starts now.',
    'Dharma esta aqui para acompanarte, guiarte y apoyarte en cada etapa del camino. Tu bienestar merece constancia, paciencia y el acompanamiento correcto.':
      'Dharma is here to guide and support you through every stage of the journey. Your wellness deserves consistency, patience, and the right support.',
    'Las inyecciones de perdida de peso son para recuperar tu energia, tu confianza y esa version de ti que extranabas.':
      'Weight loss injections can help you reconnect with your energy, your confidence, and the version of yourself you have missed.',
    'San Valentin es para todas las personas que estan listas para enamorarse de su proceso.':
      "Valentine's Day is for everyone ready to fall in love with their process.",
    'mx 5 DE MAYO\nFuego en la celebracion. Control en tu cuerpo.\nLa verdadera revolucion empieza desde adentro.':
      'MX May 5\nFire in the celebration. Control in your body.\nThe real revolution starts from within.',
  }

  return legacyText[text] || text
}

function toEmailRow(row: EmailDbRow): EmailRow {
  return {
    id: row.id,
    approval: normalizeApproval(row.approval),
    creativeLink: row.creative_link || '',
    creativeReady: row.creative_ready,
    copyReady: row.copy_ready,
    date: row.date,
    headline: translateLegacyEnglish(row.headline),
    link2Url: row.link_2_url || '',
    linkUrl: row.link_url || '',
    obs: row.obs || '',
    scheduled: row.scheduled,
    time: row.time?.slice(0, 5) || '09:00',
  }
}

function toEmailDbPayload(row: EmailRow, rowOrder: number) {
  return {
    id: row.id,
    row_order: rowOrder,
    date: row.date,
    time: row.time,
    creative_link: row.creativeLink,
    headline: row.headline,
    link_2_url: row.link2Url,
    link_url: row.linkUrl,
    copy_ready: row.copyReady,
    creative_ready: row.creativeReady,
    approval: toStoredApproval(row.approval),
    obs: row.obs,
    scheduled: row.scheduled,
  }
}

function toSmsRow(row: SmsDbRow): SmsRow {
  return {
    id: row.id,
    approval: normalizeApproval(row.approval),
    artLink: row.art_link || '',
    date: row.date,
    linkUrl: row.link_url || '',
    obs: row.obs || '',
    scheduled: row.scheduled,
    text: translateLegacyEnglish(row.text),
    textReady: row.text_ready,
    time: row.time?.slice(0, 5) || '09:00',
  }
}

function toSmsDbPayload(row: SmsRow, rowOrder: number) {
  return {
    id: row.id,
    row_order: rowOrder,
    date: row.date,
    time: row.time,
    text: row.text,
    art_link: row.artLink,
    link_url: row.linkUrl,
    text_ready: row.textReady,
    approval: toStoredApproval(row.approval),
    obs: row.obs,
    scheduled: row.scheduled,
  }
}

function toInstaRow(row: InstaDbRow): InstaRow {
  return {
    id: row.id,
    approval: normalizeApproval(row.approval),
    caption: translateLegacyEnglish(row.caption),
    date: row.date,
    feed: row.feed || '',
    obs: row.obs || '',
    stories: row.stories || '',
    storyApproval: normalizeApproval(row.story_approval),
    time: row.time?.slice(0, 5) || '09:00',
  }
}

function toInstaDbPayload(row: InstaRow, rowOrder: number) {
  return {
    id: row.id,
    row_order: rowOrder,
    date: row.date,
    time: row.time,
    feed: row.feed,
    caption: row.caption,
    approval: toStoredApproval(row.approval),
    obs: row.obs,
    stories: row.stories,
    story_approval: toStoredApproval(row.storyApproval),
  }
}

function toTiktokRow(row: TiktokDbRow): TiktokRow {
  return {
    id: row.id,
    approval: normalizeApproval(row.approval),
    caption: translateLegacyEnglish(row.caption),
    date: row.date,
    obs: row.obs || '',
    time: row.time?.slice(0, 5) || '09:00',
    videoLinks: row.video_links || '',
  }
}

function toTiktokDbPayload(row: TiktokRow, rowOrder: number) {
  return {
    id: row.id,
    row_order: rowOrder,
    date: row.date,
    time: row.time,
    video_links: row.videoLinks,
    caption: row.caption,
    approval: toStoredApproval(row.approval),
    obs: row.obs,
  }
}

function toMockupRow(row: MockupDbRow): MockupRow {
  return {
    id: row.id,
    approval: normalizeApproval(row.approval),
    date: row.date,
    link: row.link || '',
    mockupLink: row.mockup_link || '',
    obs: row.obs || '',
    platform: translateLegacyEnglish(row.platform),
  }
}

function toMockupDbPayload(row: MockupRow, rowOrder: number) {
  return {
    id: row.id,
    row_order: rowOrder,
    date: row.date,
    platform: row.platform,
    link: row.link,
    mockup_link: row.mockupLink,
    approval: toStoredApproval(row.approval),
    obs: row.obs,
  }
}

function toCommunityRow(row: CommunityDbRow): CommunityRow {
  return {
    id: row.id,
    approval: normalizeApproval(row.approval),
    date: row.date,
    link: row.link || '',
    obs: row.obs || '',
    platform: translateLegacyEnglish(row.platform),
  }
}

function toCommunityDbPayload(row: CommunityRow, rowOrder: number) {
  return {
    id: row.id,
    row_order: rowOrder,
    date: row.date,
    platform: row.platform,
    link: row.link,
    approval: toStoredApproval(row.approval),
    obs: row.obs,
  }
}

function toAdsDharmaRow(row: AdsDharmaDbRow): AdsDharmaRow {
  return {
    id: row.id,
    approval: normalizeApproval(row.approval),
    artLink1: translateLegacyEnglish(row.art_link_1),
    artLink2: translateLegacyEnglish(row.art_link_2),
    artLink3: translateLegacyEnglish(row.art_link_3),
    copy: row.copy || '',
    date: translateLegacyEnglish(row.date),
    linkLinks: row.link_links || '',
    text: translateLegacyEnglish(row.text),
    textReady: row.text_ready,
  }
}

function toAdsDharmaDbPayload(row: AdsDharmaRow, rowOrder: number) {
  return {
    id: row.id,
    row_order: rowOrder,
    date: row.date,
    copy: row.copy,
    text: row.text,
    art_link_1: row.artLink1,
    art_link_2: row.artLink2,
    art_link_3: row.artLink3,
    link_links: row.linkLinks,
    text_ready: row.textReady,
    approval: toStoredApproval(row.approval),
  }
}

function toAdsBerberineRow(row: AdsBerberineDbRow): AdsBerberineRow {
  return {
    id: row.id,
    approval: normalizeApproval(row.approval),
    artLink1: row.art_link_1 || '',
    artLink2: row.art_link_2 || '',
    artLink3: row.art_link_3 || '',
    copy: row.copy || '',
    date: translateLegacyEnglish(row.date),
    linkLinks: row.link_links || '',
    obs: row.obs || '',
    scheduled: row.scheduled,
    text: translateLegacyEnglish(row.text),
    textReady: row.text_ready,
  }
}

function toAdsBerberineDbPayload(row: AdsBerberineRow, rowOrder: number) {
  return {
    id: row.id,
    row_order: rowOrder,
    date: row.date,
    copy: row.copy,
    text: row.text,
    art_link_1: row.artLink1,
    art_link_2: row.artLink2,
    art_link_3: row.artLink3,
    link_links: row.linkLinks,
    text_ready: row.textReady,
    approval: toStoredApproval(row.approval),
    obs: row.obs,
    scheduled: row.scheduled,
  }
}

function toBannerRow(row: BannerDbRow): BannerRow {
  return {
    id: row.id,
    approval: normalizeApproval(row.approval),
    artLink: row.art_link || '',
    artReady: row.art_ready,
    copyReady: row.copy_ready,
    endDate: row.end_date,
    obs: row.obs || '',
    startDate: row.start_date,
    text: translateLegacyEnglish(row.text),
  }
}

function toBannerDbPayload(row: BannerRow, rowOrder: number) {
  return {
    id: row.id,
    row_order: rowOrder,
    start_date: row.startDate,
    end_date: row.endDate,
    text: row.text,
    art_link: row.artLink,
    copy_ready: row.copyReady,
    art_ready: row.artReady,
    approval: toStoredApproval(row.approval),
    obs: row.obs,
  }
}

function downloadTextFile(filename: string, content: string, type = 'text/plain') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function csvEscape(value: string | boolean) {
  return `"${String(value).replace(/"/g, '""')}"`
}

function sortRowsByDateValue<T>(
  rows: T[],
  getDate: (row: T) => string,
  getTime: (row: T) => string = () => '',
) {
  return rows
    .map((row, index) => ({ index, row }))
    .sort((a, b) => {
      const aDate = getDate(a.row)
      const bDate = getDate(b.row)

      if (!aDate && !bDate) return a.index - b.index
      if (!aDate) return 1
      if (!bDate) return -1

      const dateComparison = aDate.localeCompare(bDate)
      if (dateComparison !== 0) return dateComparison

      const timeComparison = getTime(a.row).localeCompare(getTime(b.row))
      if (timeComparison !== 0) return timeComparison

      return a.index - b.index
    })
    .map(({ row }) => row)
}

function sortRowsByDate<T extends { date: string; time?: string }>(rows: T[]) {
  return sortRowsByDateValue(rows, (row) => row.date, (row) => row.time || '')
}

function sortBannerRowsByDate(rows: BannerRow[]) {
  return sortRowsByDateValue(rows, (row) => row.startDate)
}

const tableRowsPerPage = 10

function useTablePagination(totalRows: number) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(totalRows / tableRowsPerPage))
  const currentPage = Math.min(page, totalPages)

  const startIndex = (currentPage - 1) * tableRowsPerPage
  const endIndex = Math.min(startIndex + tableRowsPerPage, totalRows)

  return {
    endIndex,
    page: currentPage,
    setPage,
    startIndex,
    totalPages,
  }
}

function TableScroller({ children }: { children: ReactNode }) {
  const topScrollRef = useRef<HTMLDivElement>(null)
  const tableScrollRef = useRef<HTMLDivElement>(null)
  const isSyncingRef = useRef(false)
  const [scrollWidth, setScrollWidth] = useState(0)

  useEffect(() => {
    const tableScroll = tableScrollRef.current
    if (!tableScroll) return

    const updateScrollWidth = () => setScrollWidth(tableScroll.scrollWidth)
    updateScrollWidth()

    const resizeObserver = new ResizeObserver(updateScrollWidth)
    resizeObserver.observe(tableScroll)

    const table = tableScroll.querySelector('table')
    if (table) resizeObserver.observe(table)

    return () => resizeObserver.disconnect()
  }, [children])

  function syncScroll(source: HTMLDivElement, target: HTMLDivElement | null) {
    if (!target || isSyncingRef.current) return

    isSyncingRef.current = true
    target.scrollLeft = source.scrollLeft
    window.requestAnimationFrame(() => {
      isSyncingRef.current = false
    })
  }

  function nudgeTableScroll(direction: -1 | 1) {
    tableScrollRef.current?.scrollBy({
      behavior: 'smooth',
      left: direction * 360,
    })
  }

  return (
    <div className="table-shell">
      <div className="table-scroll-controls" aria-label="Horizontal table controls">
        <button
          aria-label="Scroll table left"
          className="table-scroll-button"
          onClick={() => nudgeTableScroll(-1)}
          type="button"
        >
          &larr;
        </button>
        <div
          aria-label="Top horizontal table scrollbar"
          className="table-top-scroll"
          onScroll={(event) =>
            syncScroll(event.currentTarget, tableScrollRef.current)
          }
          ref={topScrollRef}
          role="presentation"
        >
          <div style={{ width: scrollWidth }} />
        </div>
        <button
          aria-label="Scroll table right"
          className="table-scroll-button"
          onClick={() => nudgeTableScroll(1)}
          type="button"
        >
          &rarr;
        </button>
      </div>

      <div
        className="email-table-wrap"
        onScroll={(event) => syncScroll(event.currentTarget, topScrollRef.current)}
        ref={tableScrollRef}
      >
        {children}
      </div>
    </div>
  )
}

function TablePagination({
  endIndex,
  onPageChange,
  page,
  startIndex,
  totalPages,
  totalRows,
}: {
  endIndex: number
  onPageChange: (page: number) => void
  page: number
  startIndex: number
  totalPages: number
  totalRows: number
}) {
  if (totalRows === 0) return null

  return (
    <div className="table-pagination" aria-label="Table pagination">
      <span>
        Rows {startIndex + 1}-{endIndex} of {totalRows}
      </span>
      <div className="table-pagination-actions">
        <button
          disabled={page === 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          type="button"
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  )
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getMonthLabel(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

function isDateInRange(dateValue: string, startDate: string, endDate?: string) {
  const rangeStart = startDate
  const rangeEnd = endDate && endDate >= startDate ? endDate : startDate

  return dateValue >= rangeStart && dateValue <= rangeEnd
}

function getMonthFromDateInput(dateValue: string) {
  const [year, month] = dateValue.split('-').map(Number)

  return new Date(year, (month || 1) - 1, 1)
}

function toMarketingMasterEvents(rows: MarketingMasterPlanDbRow[]) {
  const groupedRows = new Map<string, MarketingMasterPlanDbRow[]>()

  for (const row of rows) {
    const group = groupedRows.get(row.campaign_id) || []
    group.push(row)
    groupedRows.set(row.campaign_id, group)
  }

  return [...groupedRows.entries()].map(([campaignId, group]) => {
    const firstRow = group[0]
    const plan = createEmptyMarketingPlan()

    for (const row of group) {
      const label =
        marketingMasterPlanRows.find(
          (planRow) => toMarketingMasterOptionKey(planRow) === row.option_key,
        ) || row.option_label

      plan.injections[label] = row.injections || ''
      plan.supplements[label] = row.supplements || ''
    }

    return {
      id: campaignId,
      channel: 'Marketing Master',
      date: firstRow.start_date,
      endDate: firstRow.end_date,
      notes: '',
      plan,
      title: 'Campaign Plan',
    }
  })
}

function emailRowsToCsv(rows: EmailRow[]) {
  const headers = [
    'Date',
    'Time',
    'Creative',
    'Headline',
    'Link',
    'Link 2',
    'Approval',
    'Notes',
    'Copy',
    'Creative Ready',
    'Scheduled',
  ]
  const body = rows.map((row) =>
    [
      row.date,
      row.time,
      row.creativeLink,
      row.headline,
      row.linkUrl,
      row.link2Url,
      row.approval,
      row.obs,
      row.copyReady,
      row.creativeReady,
      row.scheduled,
    ]
      .map(csvEscape)
      .join(','),
  )

  return [headers.map(csvEscape).join(','), ...body].join('\n')
}

function parseAnalysisReport(report?: string | null): StructuredAnalysis | null {
  if (!report) return null

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

    if (start < 0 || end <= start) return null

    try {
      return JSON.parse(cleaned.slice(start, end + 1))
    } catch {
      return null
    }
  }
}

async function readJsonResponse(response: Response) {
  const text = await response.text()

  if (!text.trim()) {
    return {}
  }

  try {
    return JSON.parse(text)
  } catch {
    return {
      error: text,
    }
  }
}

function getClickableUrls(value: string) {
  const matches = value.match(/(?:https?:\/\/|www\.)[^\s,;]+/gi) || []

  return [...new Set(matches.map((url) => url.replace(/[.)\]}]+$/, '')))]
}

function toClickableHref(url: string) {
  return url.toLowerCase().startsWith('www.') ? `https://${url}` : url
}

function ExternalLinkIcon() {
  return (
    <svg aria-hidden="true" className="field-action-icon" viewBox="0 0 24 24">
      <path d="M14 5h5v5" />
      <path d="m10 14 9-9" />
      <path d="M19 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg aria-hidden="true" className="field-action-icon" viewBox="0 0 24 24">
      <rect height="14" rx="2" ry="2" width="14" x="8" y="8" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  )
}

async function copyToClipboard(value: string) {
  if (!value) return

  try {
    await navigator.clipboard.writeText(value)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
}

function LinkField({
  'aria-label': ariaLabel,
  onChange,
  placeholder = 'https://',
  type = 'url',
  value,
}: {
  'aria-label': string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'url'
  value: string
}) {
  const links = getClickableUrls(value)
  const firstLink = links[0]
  const [isCopied, setIsCopied] = useState(false)
  const copiedTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)

  useEffect(() => {
    setIsCopied(false)
  }, [value])

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        window.clearTimeout(copiedTimeoutRef.current)
      }
    }
  }, [])

  async function handleCopy() {
    await copyToClipboard(value)
    setIsCopied(true)

    if (copiedTimeoutRef.current) {
      window.clearTimeout(copiedTimeoutRef.current)
    }

    copiedTimeoutRef.current = window.setTimeout(() => {
      setIsCopied(false)
      copiedTimeoutRef.current = null
    }, 1800)
  }

  return (
    <div className="link-field">
      <input
        aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {value.trim() ? (
        <div className="field-actions">
          {firstLink ? (
            <a
              aria-label={`Open ${ariaLabel}`}
              className="field-action-link"
              href={toClickableHref(firstLink)}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLinkIcon />
            </a>
          ) : null}
          <button
            aria-label={isCopied ? `${ariaLabel} copied` : `Copy ${ariaLabel}`}
            className={`field-action-button ${isCopied ? 'is-copied' : ''}`}
            onClick={handleCopy}
            type="button"
          >
            <CopyIcon />
          </button>
          <span className={`copy-status ${isCopied ? 'is-visible' : ''}`} role="status">
            Copied
          </span>
        </div>
      ) : null}
    </div>
  )
}

function CopyableTextarea({
  'aria-label': ariaLabel,
  copyLabel = 'Copy',
  onChange,
  placeholder,
  value,
}: {
  'aria-label': string
  copyLabel?: string
  onChange: (value: string) => void
  placeholder: string
  value: string
}) {
  return (
    <div className="copyable-field">
      <textarea
        aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
      {value.trim() ? (
        <div className="field-actions">
          <button
            aria-label={`Copy ${ariaLabel}`}
            className="field-action-button"
            onClick={() => copyToClipboard(value)}
            type="button"
          >
            <CopyIcon />
            <span className="sr-only">{copyLabel}</span>
          </button>
        </div>
      ) : null}
    </div>
  )
}

function FieldValue({ label, value }: { label: string; value?: string }) {
  return (
    <div className="field-value">
      <span>{label}</span>
      <p>{value || 'Not provided'}</p>
    </div>
  )
}

function BulletList({ items }: { items?: string[] }) {
  if (!items?.length) return <p className="muted-copy">No items returned.</p>

  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

function AnalysisResults({ analysis }: { analysis: StructuredAnalysis }) {
  return (
    <div className="analysis-results">
      <section className="analysis-section">
        <div className="section-heading">
          <p className="panel-label">Competitor Analysis</p>
          <h3>What the visible competitor ads are doing</h3>
        </div>

        <div className="competitor-analysis-grid">
          {(analysis.competitors || []).map((competitor) => (
            <article className="analysis-card" key={competitor.company}>
              <p className="panel-label">{competitor.company}</p>
              <h4>{competitor.longestVisibleAd || 'Longest visible ad not clear'}</h4>
              <p>{competitor.connectionAssessment}</p>
              <FieldValue label="Design read" value={competitor.designAnalysis} />
              <FieldValue
                label="Visible wording"
                value={competitor.visibleWords?.join(' / ')}
              />
              <div className="split-list">
                <div>
                  <span>Borrow</span>
                  <BulletList items={competitor.whatToBorrow} />
                </div>
                <div>
                  <span>Improve</span>
                  <BulletList items={competitor.whatToImprove} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="analysis-section">
        <div className="section-heading">
          <p className="panel-label">What We Should Do</p>
          <h3>Recommended ad direction for our campaign</h3>
        </div>

        <div className="recommendation-grid">
          <article className="analysis-card">
            <p className="panel-label">Recommended Description</p>
            <h3>Ad copy to use</h3>
            <FieldValue label="Primary text" value={analysis.recommendedDescription?.primaryText} />
            <FieldValue label="Headline" value={analysis.recommendedDescription?.headline} />
            <FieldValue label="Description" value={analysis.recommendedDescription?.description} />
            <FieldValue label="CTA" value={analysis.recommendedDescription?.cta} />
          </article>

          <article className="analysis-card">
            <p className="panel-label">Recommended Design</p>
            <h3>Creative direction</h3>
            <FieldValue label="Concept" value={analysis.recommendedDesign?.concept} />
            <FieldValue
              label="Visual direction"
              value={analysis.recommendedDesign?.visualDirection}
            />
            <FieldValue label="Layout" value={analysis.recommendedDesign?.layout} />
            <FieldValue label="Color and style" value={analysis.recommendedDesign?.colorAndStyle} />
            <div className="field-value">
              <span>Shot list</span>
              <BulletList items={analysis.recommendedDesign?.shotList} />
            </div>
          </article>

          <article className="analysis-card">
            <p className="panel-label">Campaign Angle</p>
            <h3>Why this angle fits</h3>
            <FieldValue label="Day context" value={analysis.campaignAngle?.dayContext} />
            <FieldValue label="Hook" value={analysis.campaignAngle?.hook} />
            <FieldValue label="Offer angle" value={analysis.campaignAngle?.offerAngle} />
            <FieldValue label="Audience fit" value={analysis.campaignAngle?.audienceFit} />
          </article>

          <article className="analysis-card">
            <p className="panel-label">Guardrails & Tests</p>
            <h3>Launch notes</h3>
            <div className="field-value">
              <span>Compliance notes</span>
              <BulletList items={analysis.complianceNotes} />
            </div>
            <div className="field-value">
              <span>Next tests</span>
              <BulletList items={analysis.nextTests} />
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}

function EmailDashboard() {
  const [rows, setRows] = useState<EmailRow[]>([])
  const [isLoadingRows, setIsLoadingRows] = useState(true)
  const [emailStatus, setEmailStatus] = useState('')
  const [emailError, setEmailError] = useState('')
  const pagination = useTablePagination(rows.length)
  const visibleRows = rows.slice(pagination.startIndex, pagination.endIndex)

  useEffect(() => {
    let isMounted = true

    async function loadRows() {
      setIsLoadingRows(true)
      setEmailError('')

      try {
        const response = await fetch(
          `${supabaseRestUrl}/email_dashboard_rows?select=*&order=row_order.asc,created_at.asc`,
          {
            headers: supabaseHeaders(),
          },
        )
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Could not load email dashboard rows.')
        }

        if (isMounted) {
          setRows(sortRowsByDate((data as EmailDbRow[]).map(toEmailRow)))
          setEmailStatus(data.length ? 'Loaded from Supabase.' : 'No saved rows yet.')
        }
      } catch (error) {
        if (isMounted) {
          setRows(sortRowsByDate(initialEmailRows))
          setEmailError(
            error instanceof Error
              ? error.message
              : 'Could not load email dashboard rows.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoadingRows(false)
        }
      }
    }

    loadRows()

    return () => {
      isMounted = false
    }
  }, [])

  function updateRow(id: string, changes: Partial<EmailRow>) {
    let updatedRow: EmailRow | null = null
    let rowOrder = 0

    setRows((currentRows) => {
      const nextRows = sortRowsByDate(
        currentRows.map((row) => {
        if (row.id !== id) return row

        updatedRow = { ...row, ...changes }
        return updatedRow
        }),
      )
      rowOrder = nextRows.findIndex((row) => row.id === id)
      return nextRows
    })

    window.setTimeout(() => {
      if (updatedRow) {
        saveRow(updatedRow, rowOrder)
      }
    }, 0)
  }

  async function saveRow(row: EmailRow, rowOrder: number) {
    if (!supabaseAnonKey) {
      setEmailError('Missing VITE_SUPABASE_ANON_KEY.')
      return
    }

    setEmailStatus('Saving...')
    setEmailError('')

    try {
      const response = await fetch(`${supabaseRestUrl}/email_dashboard_rows?id=eq.${row.id}`, {
        body: JSON.stringify(toEmailDbPayload(row, rowOrder)),
        headers: supabaseHeaders(),
        method: 'PATCH',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Could not save row.')
      }

      setEmailStatus('Saved to Supabase.')
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Could not save row.')
    }
  }

  async function addRow() {
    const nextRow: EmailRow = {
      id: crypto.randomUUID(),
      approval: 'Pending Approval',
      creativeLink: '',
      creativeReady: false,
      copyReady: false,
      date: new Date().toISOString().slice(0, 10),
      headline: '',
      link2Url: '',
      linkUrl: '',
      obs: '',
      scheduled: false,
      time: '09:00',
    }

    const nextRows = sortRowsByDate([...rows, nextRow])
    const rowOrder = nextRows.findIndex((row) => row.id === nextRow.id)

    setRows(nextRows)
    setEmailStatus('Saving new row...')
    setEmailError('')

    try {
      const response = await fetch(`${supabaseRestUrl}/email_dashboard_rows`, {
        body: JSON.stringify(toEmailDbPayload(nextRow, rowOrder)),
        headers: supabaseHeaders('return=representation'),
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Could not create row.')
      }

      setEmailStatus('New row saved.')
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Could not create row.')
    }
  }

  async function removeRow(id: string) {
    setRows((currentRows) => currentRows.filter((row) => row.id !== id))
    setEmailStatus('Deleting row...')
    setEmailError('')

    try {
      const response = await fetch(`${supabaseRestUrl}/email_dashboard_rows?id=eq.${id}`, {
        headers: supabaseHeaders(),
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Could not delete row.')
      }

      setEmailStatus('Row deleted.')
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Could not delete row.')
    }
  }

  function exportCsv() {
    downloadTextFile('email-dashboard.csv', emailRowsToCsv(rows), 'text/csv')
  }

  function exportJson() {
    downloadTextFile(
      'email-dashboard.json',
      JSON.stringify(rows, null, 2),
      'application/json',
    )
  }

  return (
    <section className="email-dashboard" aria-labelledby="email-dashboard-title">
      <div className="email-toolbar">
        <div>
          <p className="eyebrow">Email Schedule</p>
          <h2 id="email-dashboard-title">Campaign Production Table</h2>
          <p>
            Plan send dates, headlines, creative links, approvals, and scheduling status in
            one editable table.
          </p>
        </div>

        <div className="toolbar-actions">
          <button onClick={addRow} type="button">
            Add row
          </button>
          <button onClick={exportCsv} type="button">
            Export CSV
          </button>
          <button onClick={exportJson} type="button">
            Export JSON
          </button>
        </div>
      </div>

      <div className="email-sync-status" aria-live="polite">
        <span>{isLoadingRows ? 'Loading rows from Supabase...' : emailStatus}</span>
        {emailError ? <strong>{emailError}</strong> : null}
      </div>

      <TableScroller>
        <table className="email-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Creative</th>
              <th>Headline</th>
              <th>Link</th>
              <th>Link 2</th>
              <th>Approval</th>
              <th>Notes</th>
              <th>Copy</th>
              <th>Creative</th>
              <th>Scheduled</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoadingRows ? (
              <tr>
                <td className="empty-table-message" colSpan={12}>
                  Loading saved email rows...
                </td>
              </tr>
            ) : null}

            {!isLoadingRows && rows.length === 0 ? (
              <tr>
                <td className="empty-table-message" colSpan={12}>
                  No saved rows yet. Add a row to start planning.
                </td>
              </tr>
            ) : null}

            {!isLoadingRows && visibleRows.map((row) => (
              <tr className={row.scheduled ? 'is-scheduled' : undefined} key={row.id}>
                <td>
                  <input
                    aria-label="Email date"
                    onChange={(event) => updateRow(row.id, { date: event.target.value })}
                    type="date"
                    value={row.date}
                  />
                </td>
                <td>
                  <input
                    aria-label="Email time"
                    onChange={(event) => updateRow(row.id, { time: event.target.value })}
                    type="time"
                    value={row.time}
                  />
                </td>
                <td>
                  <LinkField
                    aria-label="Email creative link"
                    onChange={(value) => updateRow(row.id, { creativeLink: value })}
                    placeholder="https://"
                    value={row.creativeLink}
                  />
                </td>
                <td>
                  <CopyableTextarea
                    aria-label="Headline"
                    copyLabel="Copy"
                    onChange={(value) => updateRow(row.id, { headline: value })}
                    placeholder="Email headline"
                    value={row.headline}
                  />
                </td>
                <td>
                  <LinkField
                    aria-label="Email link"
                    onChange={(value) => updateRow(row.id, { linkUrl: value })}
                    placeholder="https://"
                    value={row.linkUrl}
                  />
                </td>
                <td>
                  <LinkField
                    aria-label="Email link 2"
                    onChange={(value) => updateRow(row.id, { link2Url: value })}
                    placeholder="https://"
                    value={row.link2Url}
                  />
                </td>
                <td>
                  <select
                    aria-label="Approval status"
                    className={`approval-select ${row.approval
                      .toLowerCase()
                      .replaceAll(' ', '-')}`}
                    onChange={(event) => updateRow(row.id, { approval: event.target.value })}
                    value={row.approval}
                  >
                    {approvalOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <textarea
                    aria-label="Observations"
                    onChange={(event) => updateRow(row.id, { obs: event.target.value })}
                    placeholder="Notes"
                    value={row.obs}
                  />
                </td>
                <td className="check-cell">
                  <input
                    aria-label="Copy ready"
                    checked={row.copyReady}
                    onChange={(event) =>
                      updateRow(row.id, { copyReady: event.target.checked })
                    }
                    type="checkbox"
                  />
                </td>
                <td className="check-cell">
                  <input
                    aria-label="Creative ready"
                    checked={row.creativeReady}
                    onChange={(event) =>
                      updateRow(row.id, { creativeReady: event.target.checked })
                    }
                    type="checkbox"
                  />
                </td>
                <td className="check-cell">
                  <input
                    aria-label="Scheduled"
                    checked={row.scheduled}
                    onChange={(event) =>
                      updateRow(row.id, { scheduled: event.target.checked })
                    }
                    type="checkbox"
                  />
                </td>
                <td>
                  <button
                    className="delete-row"
                    onClick={() => removeRow(row.id)}
                    type="button"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroller>

      <TablePagination
        endIndex={pagination.endIndex}
        onPageChange={pagination.setPage}
        page={pagination.page}
        startIndex={pagination.startIndex}
        totalPages={pagination.totalPages}
        totalRows={rows.length}
      />
    </section>
  )
}

function AdsResearchDashboard() {
  const [research, setResearch] = useState<ResearchResponse | null>(null)
  const [campaignDate, setCampaignDate] = useState(new Date().toISOString().slice(0, 10))
  const [dayType, setDayType] = useState('Normal day')
  const [eventName, setEventName] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('Berberine Plus')
  const [isMarketingMasterOpen, setIsMarketingMasterOpen] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  )
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() =>
    toDateInputValue(new Date()),
  )
  const [calendarEvents, setCalendarEvents] = useState<MasterCalendarEvent[]>([])
  const [isCampaignPlanOpen, setIsCampaignPlanOpen] = useState(false)
  const [editingCalendarEventId, setEditingCalendarEventId] = useState('')
  const [calendarDraft, setCalendarDraft] = useState({
    channel: 'Marketing Master',
    endDate: toDateInputValue(new Date()),
    notes: '',
    plan: createEmptyMarketingPlan(),
    startDate: toDateInputValue(new Date()),
    title: 'Campaign Plan',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMarketingMaster, setIsLoadingMarketingMaster] = useState(false)
  const [marketingMasterError, setMarketingMasterError] = useState('')
  const [marketingMasterStatus, setMarketingMasterStatus] = useState('')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1)
    const day = new Date(firstDay)
    day.setDate(1 - firstDay.getDay() + index)
    return day
  })
  const currentProgressStage =
    researchProgressStages.findLast((stage) => elapsedSeconds >= stage.startSecond) ||
    researchProgressStages[0]
  const nextProgressStage = researchProgressStages.find(
    (stage) => stage.startSecond > currentProgressStage.startSecond,
  )
  const stageDuration = Math.max(
    1,
    (nextProgressStage?.startSecond || currentProgressStage.startSecond + 70) -
      currentProgressStage.startSecond,
  )
  const stageElapsed = Math.max(0, elapsedSeconds - currentProgressStage.startSecond)
  const stageProgress = Math.min(1, stageElapsed / stageDuration)
  const progressPercent = Math.round(
    currentProgressStage.minPercent +
      (currentProgressStage.maxPercent - currentProgressStage.minPercent) * stageProgress,
  )
  const elapsedLabel = `${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(
    2,
    '0',
  )}`

  useEffect(() => {
    if (!isLoading) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [isLoading])

  useEffect(() => {
    let isMounted = true

    async function loadMarketingMasterEvents() {
      if (!supabaseAnonKey) {
        setMarketingMasterError('Missing VITE_SUPABASE_ANON_KEY.')
        return
      }

      setIsLoadingMarketingMaster(true)
      setMarketingMasterError('')

      try {
        const response = await fetch(
          `${supabaseRestUrl}/marketing_master_plan_rows?select=*&order=start_date.asc,row_order.asc`,
          {
            headers: supabaseHeaders(),
          },
        )
        const data = await readJsonResponse(response)

        if (!response.ok) {
          throw new Error(data.message || data.error || 'Could not load Marketing Master.')
        }

        if (isMounted) {
          const events = toMarketingMasterEvents(data as MarketingMasterPlanDbRow[])
          setCalendarEvents(events)
          setMarketingMasterStatus(
            events.length ? 'Loaded Marketing Master from Supabase.' : 'No saved plans yet.',
          )
        }
      } catch (loadError) {
        if (isMounted) {
          setMarketingMasterError(
            loadError instanceof Error
              ? loadError.message
              : 'Could not load Marketing Master.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoadingMarketingMaster(false)
        }
      }
    }

    loadMarketingMasterEvents()

    return () => {
      isMounted = false
    }
  }, [])

  function moveCalendarMonth(direction: number) {
    setCalendarMonth(
      (currentMonth) =>
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1),
    )
  }

  function selectCalendarDay(date: Date) {
    const dateValue = toDateInputValue(date)
    const existingEvent = calendarEvents.find((calendarEvent) =>
      isDateInRange(dateValue, calendarEvent.date, calendarEvent.endDate),
    )

    setSelectedCalendarDate(dateValue)
    setCalendarMonth(getMonthFromDateInput(dateValue))
    setEditingCalendarEventId(existingEvent?.id || '')
    setCalendarDraft({
      channel: existingEvent?.channel || 'Marketing Master',
      endDate: existingEvent?.endDate || dateValue,
      notes: existingEvent?.notes || '',
      plan: existingEvent?.plan || createEmptyMarketingPlan(),
      startDate: existingEvent?.date || dateValue,
      title: existingEvent?.title || 'Campaign Plan',
    })
    setIsCampaignPlanOpen(true)
  }

  function updateCalendarPlan(
    lane: keyof MarketingMasterPlan,
    rowLabel: string,
    value: string,
  ) {
    setCalendarDraft((draft) => ({
      ...draft,
      plan: {
        ...draft.plan,
        [lane]: {
          ...draft.plan[lane],
          [rowLabel]: value,
        },
      },
    }))
  }

  async function saveCampaignPlanEvent() {
    if (!supabaseAnonKey) {
      setMarketingMasterError('Missing VITE_SUPABASE_ANON_KEY.')
      return
    }

    const normalizedEvent: MasterCalendarEvent = {
      id: editingCalendarEventId || crypto.randomUUID(),
      channel: 'Marketing Master',
      date: calendarDraft.startDate,
      endDate:
        calendarDraft.endDate >= calendarDraft.startDate
          ? calendarDraft.endDate
          : calendarDraft.startDate,
      notes: '',
      plan: calendarDraft.plan,
      title: 'Campaign Plan',
    }
    const payload = marketingMasterPlanRows.map((rowLabel, rowOrder) => ({
      campaign_id: normalizedEvent.id,
      selected_date: selectedCalendarDate,
      start_date: normalizedEvent.date,
      end_date: normalizedEvent.endDate,
      option_key: toMarketingMasterOptionKey(rowLabel),
      option_label: rowLabel,
      row_order: rowOrder,
      injections: normalizedEvent.plan.injections[rowLabel] || '',
      supplements: normalizedEvent.plan.supplements[rowLabel] || '',
    }))

    setMarketingMasterStatus('Saving Marketing Master plan...')
    setMarketingMasterError('')

    try {
      const response = await fetch(
        `${supabaseRestUrl}/marketing_master_plan_rows?on_conflict=campaign_id,option_key`,
        {
          body: JSON.stringify(payload),
          headers: supabaseHeaders('resolution=merge-duplicates,return=minimal'),
          method: 'POST',
        },
      )
      const data = await readJsonResponse(response)

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Could not save Marketing Master plan.')
      }
    } catch (saveError) {
      setMarketingMasterError(
        saveError instanceof Error
          ? saveError.message
          : 'Could not save Marketing Master plan.',
      )
      return
    }

    setCalendarEvents((events) => {
      if (!editingCalendarEventId) {
        return [...events, normalizedEvent]
      }

      return events.map((event) =>
        event.id === editingCalendarEventId ? normalizedEvent : event,
      )
    })
    setEditingCalendarEventId(normalizedEvent.id)
    setMarketingMasterStatus('Marketing Master plan saved to Supabase.')
    setIsCampaignPlanOpen(false)
  }

  async function runResearch() {
    setError('')
    setIsLoading(true)
    setElapsedSeconds(0)

    try {
      const response = await fetch(adsResearchUrl, {
        body: JSON.stringify({
          brandContext: {
            audience: 'wellness supplement shoppers',
            brandName: 'Our Brand',
            constraints:
              'Use competitor ads as inspiration only. Do not copy exact wording, designs, medical claims, or brand assets.',
            product: selectedProduct,
            tone: 'premium, simple, benefit-led, credible',
          },
          campaignContext: {
            campaignDate,
            dayType,
            eventName,
            selectedProduct,
          },
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const data = await readJsonResponse(response)

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Ad research API is unavailable. Make sure the local API server is running.',
        )
      }

      setResearch(data as ResearchResponse)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Ad research failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <section className="marketing-master-dashboard" aria-labelledby="marketing-master-card-title">
        <div className="marketing-master-strip">
          <div>
            <p className="panel-label">Marketing Calendar</p>
            <h2 id="marketing-master-card-title">Marketing Master</h2>
            <p>
              Open the master calendar to plan launches, promos, content, and campaign moments.
            </p>
          </div>

          <div className="moving-calendar-graphic" aria-hidden="true">
            <span className="calendar-graphic-card card-back">
              <span />
              <span />
              <span />
            </span>
            <span className="calendar-graphic-card card-front">
              <span className="calendar-graphic-rings" />
              <span className="calendar-graphic-header" />
              <span className="calendar-graphic-grid">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </span>
              <span className="calendar-graphic-marker" />
            </span>
            <span className="calendar-graphic-orbit orbit-one" />
            <span className="calendar-graphic-orbit orbit-two" />
          </div>

          <button
            aria-haspopup="dialog"
            className="calendar-launch-button"
            onClick={() => setIsMarketingMasterOpen(true)}
            type="button"
          >
            <span className="calendar-button-icon" aria-hidden="true">
              <span />
            </span>
            <span>Marketing Master</span>
          </button>
        </div>
      </section>

      {isMarketingMasterOpen ? (
        <div
          className="calendar-modal-backdrop"
          onClick={() => {
            setIsMarketingMasterOpen(false)
            setIsCampaignPlanOpen(false)
          }}
          role="presentation"
        >
          <section
            aria-labelledby="marketing-master-title"
            aria-modal="true"
            className="calendar-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="calendar-modal-header">
              <div>
                <p className="panel-label">Marketing Master</p>
                <h2 id="marketing-master-title">{getMonthLabel(calendarMonth)}</h2>
                <p className="calendar-sync-status" aria-live="polite">
                  {isLoadingMarketingMaster ? 'Loading Marketing Master from Supabase...' : marketingMasterStatus}
                </p>
                {marketingMasterError ? (
                  <p className="calendar-sync-error">{marketingMasterError}</p>
                ) : null}
              </div>

              <div className="calendar-modal-actions">
                <button onClick={() => moveCalendarMonth(-1)} type="button">
                  Previous
                </button>
                <button
                  onClick={() => {
                    const today = new Date()
                    const todayValue = toDateInputValue(today)
                    setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1))
                    setSelectedCalendarDate(todayValue)
                    setEditingCalendarEventId('')
                    setCalendarDraft({
                      channel: 'Marketing Master',
                      endDate: todayValue,
                      notes: '',
                      plan: createEmptyMarketingPlan(),
                      startDate: todayValue,
                      title: 'Campaign Plan',
                    })
                    setIsCampaignPlanOpen(true)
                  }}
                  type="button"
                >
                  Today
                </button>
                <button onClick={() => moveCalendarMonth(1)} type="button">
                  Next
                </button>
                <button
                  aria-label="Close Marketing Master calendar"
                  className="calendar-close-button"
                  onClick={() => {
                    setIsMarketingMasterOpen(false)
                    setIsCampaignPlanOpen(false)
                  }}
                  type="button"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="calendar-modal-body">
              <div className="calendar-grid-panel">
                <div className="calendar-weekdays">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName) => (
                    <span key={dayName}>{dayName}</span>
                  ))}
                </div>

                <div className="calendar-grid">
                  {calendarDays.map((day) => {
                    const dateValue = toDateInputValue(day)
                    const dayEvents = calendarEvents.filter(
                      (calendarEvent) =>
                        isDateInRange(dateValue, calendarEvent.date, calendarEvent.endDate),
                    )
                    const isOutsideMonth = day.getMonth() !== calendarMonth.getMonth()
                    const isSelected = dateValue === selectedCalendarDate

                    return (
                      <button
                        className={`calendar-day ${isOutsideMonth ? 'outside-month' : ''} ${
                          isSelected ? 'selected' : ''
                        }`}
                        key={dateValue}
                        onClick={() => selectCalendarDay(day)}
                        type="button"
                      >
                        <span>{day.getDate()}</span>
                        {dayEvents.slice(0, 2).map((calendarEvent) => (
                          <em key={calendarEvent.id}>{calendarEvent.title}</em>
                        ))}
                        {dayEvents.length > 2 ? (
                          <strong>+{dayEvents.length - 2} more</strong>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>

          {isCampaignPlanOpen ? (
            <div
              className="campaign-plan-popover-backdrop"
              onClick={(event) => {
                event.stopPropagation()
                setIsCampaignPlanOpen(false)
              }}
              role="presentation"
            >
              <section
                aria-labelledby="campaign-plan-popover-title"
                aria-modal="true"
                className="calendar-plan-panel campaign-plan-popover"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
              >
                <div className="calendar-plan-heading">
                  <div>
                    <p className="panel-label">Campaign Plan</p>
                    <h3 id="campaign-plan-popover-title">Injections & Supplements</h3>
                  </div>
                  <p>
                    Fill the campaign details for the selected date or range.
                  </p>
                  <button
                    className="calendar-plan-back-button"
                    onClick={() => setIsCampaignPlanOpen(false)}
                    type="button"
                  >
                    Back
                  </button>
                  <button
                    className="calendar-plan-done-button"
                    onClick={saveCampaignPlanEvent}
                    type="button"
                  >
                    Save Event
                  </button>
                </div>

                <div className="calendar-plan-range-fields">
                  <label>
                    Start date
                    <input
                      onChange={(event) => {
                        const startDate = event.target.value
                        setSelectedCalendarDate(startDate)
                        setCalendarMonth(getMonthFromDateInput(startDate))
                        setCalendarDraft((draft) => ({
                          ...draft,
                          endDate: draft.endDate < startDate ? startDate : draft.endDate,
                          startDate,
                        }))
                      }}
                      type="date"
                      value={calendarDraft.startDate}
                    />
                  </label>

                  <label>
                    End date
                    <input
                      min={calendarDraft.startDate}
                      onChange={(event) =>
                        setCalendarDraft((draft) => ({
                          ...draft,
                          endDate: event.target.value,
                        }))
                      }
                      type="date"
                      value={calendarDraft.endDate}
                    />
                  </label>
                </div>

                <div className="calendar-plan-table-wrap">
                  <table className="calendar-plan-table">
                    <thead>
                      <tr>
                        <th>Option</th>
                        <th>Injections</th>
                        <th>Supplements</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marketingMasterPlanRows.map((rowLabel) => (
                        <tr key={rowLabel}>
                          <th>{rowLabel}</th>
                          <td>
                            <textarea
                              aria-label={`Injections ${rowLabel}`}
                              onChange={(event) =>
                                updateCalendarPlan('injections', rowLabel, event.target.value)
                              }
                              placeholder="Add details"
                              value={calendarDraft.plan.injections[rowLabel] || ''}
                            />
                          </td>
                          <td>
                            <textarea
                              aria-label={`Supplements ${rowLabel}`}
                              onChange={(event) =>
                                updateCalendarPlan('supplements', rowLabel, event.target.value)
                              }
                              placeholder="Add details"
                              value={calendarDraft.plan.supplements[rowLabel] || ''}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          ) : null}
        </div>
      ) : null}

      <section className="ads-dashboard" aria-labelledby="ads-dashboard-title">
        <div className="ads-dashboard-heading">
          <div>
            <p className="eyebrow">Competitor Ads</p>
            <h2 id="ads-dashboard-title">Meta Ad Inspiration Finder</h2>
            <p>
              Opens public Meta Ads Library pages for Limmelive, Gruns, Bloom Nutrition, and
              Obvi Health, then sends visible page text and screenshots to Claude for strategy.
            </p>
          </div>

          <button disabled={isLoading} onClick={runResearch} type="button">
            {isLoading ? 'Analyzing...' : 'Analyze Ads'}
          </button>
        </div>

      <div className="research-form">
        <label>
          Campaign date
          <input
            onChange={(event) => setCampaignDate(event.target.value)}
            type="date"
            value={campaignDate}
          />
        </label>

        <label>
          Day type
          <select onChange={(event) => setDayType(event.target.value)} value={dayType}>
            {dayTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label>
          Event name
          <input
            onChange={(event) => setEventName(event.target.value)}
            placeholder="Black Friday, wedding season, summer reset..."
            type="text"
            value={eventName}
          />
        </label>

        <label>
          Product for this ad
          <select
            onChange={(event) => setSelectedProduct(event.target.value)}
            value={selectedProduct}
          >
            {productOptions.map((product) => (
              <option key={product} value={product}>
                {product}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading ? (
        <div
          aria-label={`Ad analysis progress: ${progressPercent}%`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={progressPercent}
          className="research-progress"
          role="progressbar"
        >
          <div className="research-progress-header">
            <div>
              <strong>{currentProgressStage.label}</strong>
              <span>{currentProgressStage.detail}</span>
            </div>
            <span>{elapsedLabel}</span>
          </div>
          <div className="research-progress-track">
            <span style={{ width: `${progressPercent}%` }} />
          </div>
          <p>Most runs finish in about 1 to 3 minutes.</p>
        </div>
      ) : null}

      {error ? <p className="dashboard-alert">{error}</p> : null}

      <div className="competitor-grid">
        {(research?.results || [
          {
            company: 'limmelive',
            error: null,
            screenshotCaptured: false,
            sourceUrl: '',
            status: 'ready',
            visibleText: '',
          },
          {
            company: 'gruns',
            error: null,
            screenshotCaptured: false,
            sourceUrl: '',
            status: 'ready',
            visibleText: '',
          },
          {
            company: 'bloom nutrition',
            error: null,
            screenshotCaptured: false,
            sourceUrl: '',
            status: 'ready',
            visibleText: '',
          },
          {
            company: 'obvi health',
            error: null,
            screenshotCaptured: false,
            sourceUrl: '',
            status: 'ready',
            visibleText: '',
          },
        ]).map((result) => (
          <article className="competitor-card" key={result.company}>
            <p className="panel-label">{result.company}</p>
            <h3>{result.status === 'captured' ? 'Page captured' : 'Ready to search'}</h3>
            {result.status === 'captured' ? (
              <>
                <p>
                  Screenshot {result.screenshotCaptured ? 'captured' : 'not captured'}.
                  Claude will choose the longest visible active ad from the page.
                </p>
                <p>{result.visibleText.slice(0, 180) || 'No visible text captured.'}</p>
                <a href={result.sourceUrl} rel="noreferrer" target="_blank">
                  Open Meta search
                </a>
              </>
            ) : (
              <>
                <p>{result.error || 'Click Search Ads to capture public Meta pages.'}</p>
                {result.sourceUrl ? (
                  <a href={result.sourceUrl} rel="noreferrer" target="_blank">
                    Open Meta search
                  </a>
                ) : null}
              </>
            )}
          </article>
        ))}
      </div>

      {research?.analysis.report || research?.analysis.error ? (
        <div className="analysis-panel">
          <p className="panel-label">Claude Analysis</p>
          {research.analysis.parsed || parseAnalysisReport(research.analysis.report) ? (
            <AnalysisResults
              analysis={
                research.analysis.parsed || parseAnalysisReport(research.analysis.report)!
              }
            />
          ) : (
            <div className="debug-panel">
              <h3>Analysis could not be formatted</h3>
              <p>{research.analysis.error || 'Claude returned text that could not be parsed.'}</p>
              {research.analysis.report ? <pre>{research.analysis.report}</pre> : null}
            </div>
          )}
        </div>
      ) : null}
      </section>
    </>
  )
}

function SmsDashboard() {
  const [rows, setRows] = useState<SmsRow[]>([])
  const [isLoadingRows, setIsLoadingRows] = useState(true)
  const [smsStatus, setSmsStatus] = useState('')
  const [smsError, setSmsError] = useState('')
  const pagination = useTablePagination(rows.length)
  const visibleRows = rows.slice(pagination.startIndex, pagination.endIndex)

  useEffect(() => {
    let isMounted = true

    async function loadRows() {
      setIsLoadingRows(true)
      setSmsError('')

      try {
        const response = await fetch(
          `${supabaseRestUrl}/sms_dashboard_rows?select=*&order=row_order.asc,created_at.asc`,
          {
            headers: supabaseHeaders(),
          },
        )
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Could not load SMS dashboard rows.')
        }

        if (isMounted) {
          setRows(sortRowsByDate((data as SmsDbRow[]).map(toSmsRow)))
          setSmsStatus(data.length ? 'Loaded from Supabase.' : 'No saved SMS rows yet.')
        }
      } catch (error) {
        if (isMounted) {
          setRows(sortRowsByDate(initialSmsRows))
          setSmsError(
            error instanceof Error ? error.message : 'Could not load SMS dashboard rows.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoadingRows(false)
        }
      }
    }

    loadRows()

    return () => {
      isMounted = false
    }
  }, [])

  function updateRow(id: string, changes: Partial<SmsRow>) {
    let updatedRow: SmsRow | null = null
    let rowOrder = 0

    setRows((currentRows) => {
      const nextRows = sortRowsByDate(
        currentRows.map((row) => {
        if (row.id !== id) return row

        updatedRow = { ...row, ...changes }
        return updatedRow
        }),
      )
      rowOrder = nextRows.findIndex((row) => row.id === id)
      return nextRows
    })

    window.setTimeout(() => {
      if (updatedRow) {
        saveRow(updatedRow, rowOrder)
      }
    }, 0)
  }

  async function saveRow(row: SmsRow, rowOrder: number) {
    if (!supabaseAnonKey) {
      setSmsError('Missing VITE_SUPABASE_ANON_KEY.')
      return
    }

    setSmsStatus('Saving...')
    setSmsError('')

    try {
      const response = await fetch(`${supabaseRestUrl}/sms_dashboard_rows?id=eq.${row.id}`, {
        body: JSON.stringify(toSmsDbPayload(row, rowOrder)),
        headers: supabaseHeaders(),
        method: 'PATCH',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Could not save SMS row.')
      }

      setSmsStatus('Saved to Supabase.')
    } catch (error) {
      setSmsError(error instanceof Error ? error.message : 'Could not save SMS row.')
    }
  }

  async function addRow() {
    const nextRow: SmsRow = {
      id: crypto.randomUUID(),
      approval: 'Pending Approval',
      artLink: '',
      date: new Date().toISOString().slice(0, 10),
      linkUrl: '',
      obs: '',
      scheduled: false,
      text: '',
      textReady: false,
      time: '09:00',
    }

    const nextRows = sortRowsByDate([...rows, nextRow])
    const rowOrder = nextRows.findIndex((row) => row.id === nextRow.id)

    setRows(nextRows)
    setSmsStatus('Saving new SMS row...')
    setSmsError('')

    try {
      const response = await fetch(`${supabaseRestUrl}/sms_dashboard_rows`, {
        body: JSON.stringify(toSmsDbPayload(nextRow, rowOrder)),
        headers: supabaseHeaders('return=representation'),
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Could not create SMS row.')
      }

      setSmsStatus('New SMS row saved.')
    } catch (error) {
      setSmsError(error instanceof Error ? error.message : 'Could not create SMS row.')
    }
  }

  async function removeRow(id: string) {
    setRows((currentRows) => currentRows.filter((row) => row.id !== id))
    setSmsStatus('Deleting SMS row...')
    setSmsError('')

    try {
      const response = await fetch(`${supabaseRestUrl}/sms_dashboard_rows?id=eq.${id}`, {
        headers: supabaseHeaders(),
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Could not delete SMS row.')
      }

      setSmsStatus('SMS row deleted.')
    } catch (error) {
      setSmsError(error instanceof Error ? error.message : 'Could not delete SMS row.')
    }
  }

  function exportCsv() {
    const headers = [
      'Date',
      'Time',
      'Text',
      'Art Link',
      'Link',
      'Text Ready',
      'Approval',
      'Notes',
      'Schedule',
    ]
    const body = rows.map((row) =>
      [
        row.date,
        row.time,
        row.text,
        row.artLink,
        row.linkUrl,
        row.textReady,
        row.approval,
        row.obs,
        row.scheduled,
      ]
        .map(csvEscape)
        .join(','),
    )

    downloadTextFile('sms-dashboard.csv', [headers.map(csvEscape).join(','), ...body].join('\n'), 'text/csv')
  }

  return (
    <section className="email-dashboard sms-dashboard" aria-labelledby="sms-dashboard-title">
      <div className="email-toolbar">
        <div>
          <p className="eyebrow">SMS Schedule</p>
          <h2 id="sms-dashboard-title">Broadcast Production Table</h2>
          <p>
            Plan short-form campaign texts, supporting art links, approval notes, and send
            timing in one lightweight schedule.
          </p>
        </div>

        <div className="toolbar-actions">
          <button onClick={addRow} type="button">
            Add row
          </button>
          <button onClick={exportCsv} type="button">
            Export CSV
          </button>
          <button
            onClick={() =>
              downloadTextFile(
                'sms-dashboard.json',
                JSON.stringify(rows, null, 2),
                'application/json',
              )
            }
            type="button"
          >
            Export JSON
          </button>
        </div>
      </div>

      <div className="email-sync-status" aria-live="polite">
        <span>{isLoadingRows ? 'Loading SMS rows from Supabase...' : smsStatus}</span>
        {smsError ? <strong>{smsError}</strong> : null}
      </div>

      <TableScroller>
        <table className="email-table sms-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Text</th>
              <th>Art Link</th>
              <th>Link</th>
              <th>Text</th>
              <th>Approval</th>
              <th>Notes</th>
              <th>Schedule</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoadingRows ? (
              <tr>
                <td className="empty-table-message" colSpan={10}>
                  Loading saved SMS rows...
                </td>
              </tr>
            ) : null}

            {!isLoadingRows && rows.length === 0 ? (
              <tr>
                <td className="empty-table-message" colSpan={10}>
                  No saved SMS rows yet. Add a row to start planning.
                </td>
              </tr>
            ) : null}

            {!isLoadingRows &&
              visibleRows.map((row) => (
                <tr className={row.scheduled ? 'is-scheduled' : undefined} key={row.id}>
                  <td>
                    <input
                      aria-label="SMS date"
                      onChange={(event) => updateRow(row.id, { date: event.target.value })}
                      type="date"
                      value={row.date}
                    />
                  </td>
                  <td>
                    <input
                      aria-label="SMS time"
                      onChange={(event) => updateRow(row.id, { time: event.target.value })}
                      type="time"
                      value={row.time}
                    />
                  </td>
                  <td>
                    <CopyableTextarea
                      aria-label="SMS text"
                      copyLabel="Copy"
                      onChange={(value) => updateRow(row.id, { text: value })}
                      placeholder="Write SMS copy"
                      value={row.text}
                    />
                  </td>
                  <td>
                    <LinkField
                      aria-label="SMS art link"
                      onChange={(value) => updateRow(row.id, { artLink: value })}
                      placeholder="https://"
                      value={row.artLink}
                    />
                  </td>
                  <td>
                    <LinkField
                      aria-label="SMS link"
                      onChange={(value) => updateRow(row.id, { linkUrl: value })}
                      placeholder="https://"
                      value={row.linkUrl}
                    />
                  </td>
                  <td className="check-cell">
                    <input
                      aria-label="SMS text ready"
                      checked={row.textReady}
                      onChange={(event) =>
                        updateRow(row.id, { textReady: event.target.checked })
                      }
                      type="checkbox"
                    />
                  </td>
                  <td>
                    <select
                      aria-label="SMS approval status"
                      className={`approval-select ${row.approval
                        .toLowerCase()
                        .replaceAll(' ', '-')}`}
                      onChange={(event) =>
                        updateRow(row.id, { approval: event.target.value })
                      }
                      value={row.approval}
                    >
                      {approvalOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <textarea
                      aria-label="SMS observations"
                      onChange={(event) => updateRow(row.id, { obs: event.target.value })}
                      placeholder="Notes"
                      value={row.obs}
                    />
                  </td>
                  <td className="check-cell">
                    <input
                      aria-label="SMS scheduled"
                      checked={row.scheduled}
                      onChange={(event) =>
                        updateRow(row.id, { scheduled: event.target.checked })
                      }
                      type="checkbox"
                    />
                  </td>
                  <td>
                    <button
                      className="delete-row"
                      onClick={() => removeRow(row.id)}
                      type="button"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </TableScroller>

      <TablePagination
        endIndex={pagination.endIndex}
        onPageChange={pagination.setPage}
        page={pagination.page}
        startIndex={pagination.startIndex}
        totalPages={pagination.totalPages}
        totalRows={rows.length}
      />
    </section>
  )
}

function InstaDashboard() {
  const [rows, setRows] = useState<InstaRow[]>([])
  const [isLoadingRows, setIsLoadingRows] = useState(true)
  const [instaStatus, setInstaStatus] = useState('')
  const [instaError, setInstaError] = useState('')
  const pagination = useTablePagination(rows.length)
  const visibleRows = rows.slice(pagination.startIndex, pagination.endIndex)

  useEffect(() => {
    let isMounted = true

    async function loadRows() {
      setIsLoadingRows(true)
      setInstaError('')

      try {
        const response = await fetch(
          `${supabaseRestUrl}/insta_dashboard_rows?select=*&order=row_order.asc,created_at.asc`,
          {
            headers: supabaseHeaders(),
          },
        )
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Could not load Instagram dashboard rows.')
        }

        if (isMounted) {
          setRows(sortRowsByDate((data as InstaDbRow[]).map(toInstaRow)))
          setInstaStatus(data.length ? 'Loaded from Supabase.' : 'No saved Instagram rows yet.')
        }
      } catch (error) {
        if (isMounted) {
          setRows(sortRowsByDate(initialInstaRows))
          setInstaError(
            error instanceof Error
              ? error.message
              : 'Could not load Instagram dashboard rows.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoadingRows(false)
        }
      }
    }

    loadRows()

    return () => {
      isMounted = false
    }
  }, [])

  function updateRow(id: string, changes: Partial<InstaRow>) {
    const nextRows = sortRowsByDate(
      rows.map((row) => {
        if (row.id !== id) return row

        return { ...row, ...changes }
      }),
    )
    const updatedRow = nextRows.find((row) => row.id === id)
    const rowOrder = nextRows.findIndex((row) => row.id === id)

    setRows(nextRows)

    if (updatedRow && rowOrder >= 0) {
      saveRow(updatedRow, rowOrder)
    }
  }

  async function saveRow(row: InstaRow, rowOrder: number) {
    if (!supabaseAnonKey) {
      setInstaError('Missing VITE_SUPABASE_ANON_KEY.')
      return
    }

    setInstaStatus('Saving...')
    setInstaError('')

    try {
      const response = await fetch(
        `${supabaseRestUrl}/insta_dashboard_rows?id=eq.${row.id}`,
        {
          body: JSON.stringify(toInstaDbPayload(row, rowOrder)),
          headers: supabaseHeaders(),
          method: 'PATCH',
        },
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Could not save Instagram row.')
      }

      setInstaStatus('Saved to Supabase.')
    } catch (error) {
      setInstaError(error instanceof Error ? error.message : 'Could not save Instagram row.')
    }
  }

  async function addRow() {
    const nextRow: InstaRow = {
      id: crypto.randomUUID(),
      approval: 'Pending Approval',
      caption: '',
      date: new Date().toISOString().slice(0, 10),
      feed: '',
      obs: '',
      stories: '',
      storyApproval: 'Pending Approval',
      time: '09:00',
    }

    const nextRows = sortRowsByDate([...rows, nextRow])
    const rowOrder = nextRows.findIndex((row) => row.id === nextRow.id)

    setRows(nextRows)
    setInstaStatus('Saving new Instagram row...')
    setInstaError('')

    try {
      const response = await fetch(`${supabaseRestUrl}/insta_dashboard_rows`, {
        body: JSON.stringify(toInstaDbPayload(nextRow, rowOrder)),
        headers: supabaseHeaders('return=representation'),
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Could not create Instagram row.')
      }

      setInstaStatus('New Instagram row saved.')
    } catch (error) {
      setInstaError(error instanceof Error ? error.message : 'Could not create Instagram row.')
    }
  }

  async function removeRow(id: string) {
    setRows((currentRows) => currentRows.filter((row) => row.id !== id))
    setInstaStatus('Deleting Instagram row...')
    setInstaError('')

    try {
      const response = await fetch(`${supabaseRestUrl}/insta_dashboard_rows?id=eq.${id}`, {
        headers: supabaseHeaders(),
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Could not delete Instagram row.')
      }

      setInstaStatus('Instagram row deleted.')
    } catch (error) {
      setInstaError(error instanceof Error ? error.message : 'Could not delete Instagram row.')
    }
  }

  function exportCsv() {
    const headers = [
      'Date',
      'Time',
      'Feed',
      'Caption',
      'Notes',
      'Approval',
      'Stories',
      'Story Approval',
    ]
    const body = rows.map((row) =>
      [
        row.date,
        row.time,
        row.feed,
        row.caption,
        row.obs,
        row.approval,
        row.stories,
        row.storyApproval,
      ]
        .map(csvEscape)
        .join(','),
    )

    downloadTextFile(
      'insta-dashboard.csv',
      [headers.map(csvEscape).join(','), ...body].join('\n'),
      'text/csv',
    )
  }

  return (
    <section className="email-dashboard insta-dashboard" aria-labelledby="insta-dashboard-title">
      <div className="email-toolbar">
        <div>
          <p className="eyebrow">Instagram Schedule</p>
          <h2 id="insta-dashboard-title">Feed & Story Production Table</h2>
          <p>
            Organize post timing, feed links, captions, story links, notes, and approvals
            in one visual production tracker.
          </p>
        </div>

        <div className="toolbar-actions">
          <button onClick={addRow} type="button">
            Add row
          </button>
          <button onClick={exportCsv} type="button">
            Export CSV
          </button>
          <button
            onClick={() =>
              downloadTextFile(
                'insta-dashboard.json',
                JSON.stringify(rows, null, 2),
                'application/json',
              )
            }
            type="button"
          >
            Export JSON
          </button>
        </div>
      </div>

      <div className="email-sync-status" aria-live="polite">
        <span>{isLoadingRows ? 'Loading Instagram rows from Supabase...' : instaStatus}</span>
        {instaError ? <strong>{instaError}</strong> : null}
      </div>

      <TableScroller>
        <table className="email-table insta-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Feed</th>
              <th>Caption</th>
              <th>Notes</th>
              <th>Approval</th>
              <th>Stories</th>
              <th>Approval</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoadingRows ? (
              <tr>
                <td className="empty-table-message" colSpan={9}>
                  Loading saved Instagram rows...
                </td>
              </tr>
            ) : null}

            {!isLoadingRows && rows.length === 0 ? (
              <tr>
                <td className="empty-table-message" colSpan={9}>
                  No saved Instagram rows yet. Add a row to start planning.
                </td>
              </tr>
            ) : null}

            {!isLoadingRows &&
              visibleRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <input
                      aria-label="Instagram date"
                      onChange={(event) => updateRow(row.id, { date: event.target.value })}
                      type="date"
                      value={row.date}
                    />
                  </td>
                  <td>
                    <input
                      aria-label="Instagram time"
                      onChange={(event) => updateRow(row.id, { time: event.target.value })}
                      type="time"
                      value={row.time}
                    />
                  </td>
                  <td>
                    <LinkField
                      aria-label="Instagram feed"
                      onChange={(value) => updateRow(row.id, { feed: value })}
                      placeholder="https://"
                      value={row.feed}
                    />
                  </td>
                  <td>
                    <CopyableTextarea
                      aria-label="Instagram caption"
                      copyLabel="Copy caption"
                      onChange={(value) => updateRow(row.id, { caption: value })}
                      placeholder="Caption"
                      value={row.caption}
                    />
                  </td>
                  <td>
                    <textarea
                      aria-label="Instagram observations"
                      onChange={(event) => updateRow(row.id, { obs: event.target.value })}
                      placeholder="Notes"
                      value={row.obs}
                    />
                  </td>
                  <td>
                    <select
                      aria-label="Instagram approval"
                      className={`approval-select ${row.approval
                        .toLowerCase()
                        .replaceAll(' ', '-')}`}
                      onChange={(event) =>
                        updateRow(row.id, { approval: event.target.value })
                      }
                      value={row.approval}
                    >
                      {approvalOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <LinkField
                      aria-label="Instagram stories"
                      onChange={(value) => updateRow(row.id, { stories: value })}
                      placeholder="https://"
                      value={row.stories}
                    />
                  </td>
                  <td>
                    <select
                      aria-label="Instagram story approval"
                      className={`approval-select ${row.storyApproval
                        .toLowerCase()
                        .replaceAll(' ', '-')}`}
                      onChange={(event) =>
                        updateRow(row.id, { storyApproval: event.target.value })
                      }
                      value={row.storyApproval}
                    >
                      {approvalOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      className="delete-row"
                      onClick={() => removeRow(row.id)}
                      type="button"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </TableScroller>

      <TablePagination
        endIndex={pagination.endIndex}
        onPageChange={pagination.setPage}
        page={pagination.page}
        startIndex={pagination.startIndex}
        totalPages={pagination.totalPages}
        totalRows={rows.length}
      />
    </section>
  )
}

function TiktokDashboard() {
  const [rows, setRows] = useState<TiktokRow[]>([])
  const [isLoadingRows, setIsLoadingRows] = useState(true)
  const [tiktokStatus, setTiktokStatus] = useState('')
  const [tiktokError, setTiktokError] = useState('')
  const pagination = useTablePagination(rows.length)
  const visibleRows = rows.slice(pagination.startIndex, pagination.endIndex)

  useEffect(() => {
    let isMounted = true

    async function loadRows() {
      setIsLoadingRows(true)
      setTiktokError('')

      try {
        const response = await fetch(
          `${supabaseRestUrl}/tiktok_dashboard_rows?select=*&order=row_order.asc,created_at.asc`,
          {
            headers: supabaseHeaders(),
          },
        )
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Could not load TikTok dashboard rows.')
        }

        if (isMounted) {
          setRows(sortRowsByDate((data as TiktokDbRow[]).map(toTiktokRow)))
          setTiktokStatus(data.length ? 'Loaded from Supabase.' : 'No saved TikTok rows yet.')
        }
      } catch (error) {
        if (isMounted) {
          setRows(sortRowsByDate(initialTiktokRows))
          setTiktokError(
            error instanceof Error
              ? error.message
              : 'Could not load TikTok dashboard rows.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoadingRows(false)
        }
      }
    }

    loadRows()

    return () => {
      isMounted = false
    }
  }, [])

  function updateRow(id: string, changes: Partial<TiktokRow>) {
    let updatedRow: TiktokRow | null = null
    let rowOrder = 0

    setRows((currentRows) => {
      const nextRows = sortRowsByDate(
        currentRows.map((row) => {
        if (row.id !== id) return row

        updatedRow = { ...row, ...changes }
        return updatedRow
        }),
      )
      rowOrder = nextRows.findIndex((row) => row.id === id)
      return nextRows
    })

    window.setTimeout(() => {
      if (updatedRow) {
        saveRow(updatedRow, rowOrder)
      }
    }, 0)
  }

  async function saveRow(row: TiktokRow, rowOrder: number) {
    if (!supabaseAnonKey) {
      setTiktokError('Missing VITE_SUPABASE_ANON_KEY.')
      return
    }

    setTiktokStatus('Saving...')
    setTiktokError('')

    try {
      const response = await fetch(
        `${supabaseRestUrl}/tiktok_dashboard_rows?id=eq.${row.id}`,
        {
          body: JSON.stringify(toTiktokDbPayload(row, rowOrder)),
          headers: supabaseHeaders(),
          method: 'PATCH',
        },
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Could not save TikTok row.')
      }

      setTiktokStatus('Saved to Supabase.')
    } catch (error) {
      setTiktokError(error instanceof Error ? error.message : 'Could not save TikTok row.')
    }
  }

  async function addRow() {
    const nextRow: TiktokRow = {
      id: crypto.randomUUID(),
      approval: 'Pending Approval',
      caption: '',
      date: new Date().toISOString().slice(0, 10),
      obs: '',
      time: '09:00',
      videoLinks: '',
    }

    const nextRows = sortRowsByDate([...rows, nextRow])
    const rowOrder = nextRows.findIndex((row) => row.id === nextRow.id)

    setRows(nextRows)
    setTiktokStatus('Saving new TikTok row...')
    setTiktokError('')

    try {
      const response = await fetch(`${supabaseRestUrl}/tiktok_dashboard_rows`, {
        body: JSON.stringify(toTiktokDbPayload(nextRow, rowOrder)),
        headers: supabaseHeaders('return=representation'),
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Could not create TikTok row.')
      }

      setTiktokStatus('New TikTok row saved.')
    } catch (error) {
      setTiktokError(error instanceof Error ? error.message : 'Could not create TikTok row.')
    }
  }

  async function removeRow(id: string) {
    setRows((currentRows) => currentRows.filter((row) => row.id !== id))
    setTiktokStatus('Deleting TikTok row...')
    setTiktokError('')

    try {
      const response = await fetch(`${supabaseRestUrl}/tiktok_dashboard_rows?id=eq.${id}`, {
        headers: supabaseHeaders(),
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Could not delete TikTok row.')
      }

      setTiktokStatus('TikTok row deleted.')
    } catch (error) {
      setTiktokError(error instanceof Error ? error.message : 'Could not delete TikTok row.')
    }
  }

  function exportCsv() {
    const headers = ['Date', 'Time', 'Video/Links', 'Caption', 'Approval', 'Notes']
    const body = rows.map((row) =>
      [row.date, row.time, row.videoLinks, row.caption, row.approval, row.obs]
        .map(csvEscape)
        .join(','),
    )

    downloadTextFile(
      'tiktok-dashboard.csv',
      [headers.map(csvEscape).join(','), ...body].join('\n'),
      'text/csv',
    )
  }

  return (
    <section className="email-dashboard tiktok-dashboard" aria-labelledby="tiktok-dashboard-title">
      <div className="email-toolbar">
        <div>
          <p className="eyebrow">TikTok Schedule</p>
          <h2 id="tiktok-dashboard-title">Short Video Production Table</h2>
          <p>
            Track short-video assets, captions, approvals, and publishing notes for fast
            creator-style campaign execution.
          </p>
        </div>

        <div className="toolbar-actions">
          <button onClick={addRow} type="button">
            Add row
          </button>
          <button onClick={exportCsv} type="button">
            Export CSV
          </button>
          <button
            onClick={() =>
              downloadTextFile(
                'tiktok-dashboard.json',
                JSON.stringify(rows, null, 2),
                'application/json',
              )
            }
            type="button"
          >
            Export JSON
          </button>
        </div>
      </div>

      <div className="email-sync-status" aria-live="polite">
        <span>{isLoadingRows ? 'Loading TikTok rows from Supabase...' : tiktokStatus}</span>
        {tiktokError ? <strong>{tiktokError}</strong> : null}
      </div>

      <TableScroller>
        <table className="email-table tiktok-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Video/Links</th>
              <th>Caption</th>
              <th>Approval</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoadingRows ? (
              <tr>
                <td className="empty-table-message" colSpan={7}>
                  Loading saved TikTok rows...
                </td>
              </tr>
            ) : null}

            {!isLoadingRows && rows.length === 0 ? (
              <tr>
                <td className="empty-table-message" colSpan={7}>
                  No saved TikTok rows yet. Add a row to start planning.
                </td>
              </tr>
            ) : null}

            {!isLoadingRows &&
              visibleRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <input
                      aria-label="TikTok date"
                      onChange={(event) => updateRow(row.id, { date: event.target.value })}
                      type="date"
                      value={row.date}
                    />
                  </td>
                  <td>
                    <input
                      aria-label="TikTok time"
                      onChange={(event) => updateRow(row.id, { time: event.target.value })}
                      type="time"
                      value={row.time}
                    />
                  </td>
                  <td>
                    <LinkField
                      aria-label="TikTok video links"
                      onChange={(value) => updateRow(row.id, { videoLinks: value })}
                      placeholder="Video link or asset label"
                      type="text"
                      value={row.videoLinks}
                    />
                  </td>
                  <td>
                    <CopyableTextarea
                      aria-label="TikTok caption"
                      copyLabel="Copy caption"
                      onChange={(value) => updateRow(row.id, { caption: value })}
                      placeholder="Caption"
                      value={row.caption}
                    />
                  </td>
                  <td>
                    <select
                      aria-label="TikTok approval"
                      className={`approval-select ${row.approval
                        .toLowerCase()
                        .replaceAll(' ', '-')}`}
                      onChange={(event) =>
                        updateRow(row.id, { approval: event.target.value })
                      }
                      value={row.approval}
                    >
                      {approvalOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <textarea
                      aria-label="TikTok observations"
                      onChange={(event) => updateRow(row.id, { obs: event.target.value })}
                      placeholder="Notes"
                      value={row.obs}
                    />
                  </td>
                  <td>
                    <button
                      className="delete-row"
                      onClick={() => removeRow(row.id)}
                      type="button"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </TableScroller>

      <TablePagination
        endIndex={pagination.endIndex}
        onPageChange={pagination.setPage}
        page={pagination.page}
        startIndex={pagination.startIndex}
        totalPages={pagination.totalPages}
        totalRows={rows.length}
      />
    </section>
  )
}

function MockupDashboard() {
  const [rows, setRows] = useState<MockupRow[]>([])
  const [isLoadingRows, setIsLoadingRows] = useState(true)
  const [mockupStatus, setMockupStatus] = useState('')
  const [mockupError, setMockupError] = useState('')
  const pagination = useTablePagination(rows.length)
  const visibleRows = rows.slice(pagination.startIndex, pagination.endIndex)

  useEffect(() => {
    let isMounted = true

    async function loadRows() {
      setIsLoadingRows(true)
      setMockupError('')

      try {
        const response = await fetch(
          `${supabaseRestUrl}/mockup_dashboard_rows?select=*&order=row_order.asc,created_at.asc`,
          {
            headers: supabaseHeaders(),
          },
        )
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Could not load Mockup dashboard rows.')
        }

        if (isMounted) {
          setRows(sortRowsByDate((data as MockupDbRow[]).map(toMockupRow)))
          setMockupStatus(data.length ? 'Loaded from Supabase.' : 'No saved mockup rows yet.')
        }
      } catch (error) {
        if (isMounted) {
          setRows(sortRowsByDate(initialMockupRows))
          setMockupError(
            error instanceof Error
              ? error.message
              : 'Could not load Mockup dashboard rows.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoadingRows(false)
        }
      }
    }

    loadRows()

    return () => {
      isMounted = false
    }
  }, [])

  function updateRow(id: string, changes: Partial<MockupRow>) {
    let updatedRow: MockupRow | null = null
    let rowOrder = 0

    setRows((currentRows) => {
      const nextRows = sortRowsByDate(
        currentRows.map((row) => {
        if (row.id !== id) return row

        updatedRow = { ...row, ...changes }
        return updatedRow
        }),
      )
      rowOrder = nextRows.findIndex((row) => row.id === id)
      return nextRows
    })

    window.setTimeout(() => {
      if (updatedRow) {
        saveRow(updatedRow, rowOrder)
      }
    }, 0)
  }

  async function saveRow(row: MockupRow, rowOrder: number) {
    if (!supabaseAnonKey) {
      setMockupError('Missing VITE_SUPABASE_ANON_KEY.')
      return
    }

    setMockupStatus('Saving...')
    setMockupError('')

    try {
      const response = await fetch(
        `${supabaseRestUrl}/mockup_dashboard_rows?id=eq.${row.id}`,
        {
          body: JSON.stringify(toMockupDbPayload(row, rowOrder)),
          headers: supabaseHeaders(),
          method: 'PATCH',
        },
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Could not save mockup row.')
      }

      setMockupStatus('Saved to Supabase.')
    } catch (error) {
      setMockupError(error instanceof Error ? error.message : 'Could not save mockup row.')
    }
  }

  async function addRow() {
    const nextRow: MockupRow = {
      id: crypto.randomUUID(),
      approval: 'Pending Approval',
      date: '',
      link: '',
      mockupLink: '',
      obs: '',
      platform: '',
    }

    const nextRows = sortRowsByDate([...rows, nextRow])
    const rowOrder = nextRows.findIndex((row) => row.id === nextRow.id)

    setRows(nextRows)
    setMockupStatus('Saving new mockup row...')
    setMockupError('')

    try {
      const response = await fetch(`${supabaseRestUrl}/mockup_dashboard_rows`, {
        body: JSON.stringify(toMockupDbPayload(nextRow, rowOrder)),
        headers: supabaseHeaders('return=representation'),
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Could not create mockup row.')
      }

      setMockupStatus('New mockup row saved.')
    } catch (error) {
      setMockupError(error instanceof Error ? error.message : 'Could not create mockup row.')
    }
  }

  async function removeRow(id: string) {
    setRows((currentRows) => currentRows.filter((row) => row.id !== id))
    setMockupStatus('Deleting mockup row...')
    setMockupError('')

    try {
      const response = await fetch(`${supabaseRestUrl}/mockup_dashboard_rows?id=eq.${id}`, {
        headers: supabaseHeaders(),
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Could not delete mockup row.')
      }

      setMockupStatus('Mockup row deleted.')
    } catch (error) {
      setMockupError(error instanceof Error ? error.message : 'Could not delete mockup row.')
    }
  }

  function exportCsv() {
    const headers = ['Date', 'Platform', 'Link', 'Mockup Link', 'Approval', 'Notes']
    const body = rows.map((row) =>
      [row.date, row.platform, row.link, row.mockupLink, row.approval, row.obs]
        .map(csvEscape)
        .join(','),
    )

    downloadTextFile(
      'mockup-dashboard.csv',
      [headers.map(csvEscape).join(','), ...body].join('\n'),
      'text/csv',
    )
  }

  return (
    <section className="email-dashboard mockup-dashboard" aria-labelledby="mockup-dashboard-title">
      <div className="email-toolbar">
        <div>
          <p className="eyebrow">Mockup Review</p>
          <h2 id="mockup-dashboard-title">Creative Mockup Table</h2>
          <p>
            Track platform mockups, preview files, approval status, and revision notes before
            final production.
          </p>
        </div>

        <div className="toolbar-actions">
          <button onClick={addRow} type="button">
            Add row
          </button>
          <button onClick={exportCsv} type="button">
            Export CSV
          </button>
          <button
            onClick={() =>
              downloadTextFile(
                'mockup-dashboard.json',
                JSON.stringify(rows, null, 2),
                'application/json',
              )
            }
            type="button"
          >
            Export JSON
          </button>
        </div>
      </div>

      <div className="email-sync-status" aria-live="polite">
        <span>{isLoadingRows ? 'Loading mockup rows from Supabase...' : mockupStatus}</span>
        {mockupError ? <strong>{mockupError}</strong> : null}
      </div>

      <TableScroller>
        <table className="email-table mockup-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Platform</th>
              <th>Link</th>
              <th>Mockup</th>
              <th>Approval</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoadingRows ? (
              <tr>
                <td className="empty-table-message" colSpan={7}>
                  Loading saved mockup rows...
                </td>
              </tr>
            ) : null}

            {!isLoadingRows && rows.length === 0 ? (
              <tr>
                <td className="empty-table-message" colSpan={7}>
                  No saved mockup rows yet. Add a row to start planning.
                </td>
              </tr>
            ) : null}

            {!isLoadingRows &&
              visibleRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <input
                      aria-label="Mockup date"
                      onChange={(event) => updateRow(row.id, { date: event.target.value })}
                      placeholder="May 04 to 15"
                      value={row.date}
                    />
                  </td>
                  <td>
                    <input
                      aria-label="Mockup platform"
                      onChange={(event) => updateRow(row.id, { platform: event.target.value })}
                      placeholder="INSTAGRAM"
                      value={row.platform}
                    />
                  </td>
                  <td>
                    <LinkField
                      aria-label="Mockup link"
                      onChange={(value) => updateRow(row.id, { link: value })}
                      placeholder="https://"
                      value={row.link}
                    />
                  </td>
                  <td>
                    <LinkField
                      aria-label="Mockup asset link"
                      onChange={(value) => updateRow(row.id, { mockupLink: value })}
                      placeholder="https://"
                      value={row.mockupLink}
                    />
                  </td>
                  <td>
                    <select
                      aria-label="Mockup approval"
                      className={`approval-select ${row.approval
                        .toLowerCase()
                        .replaceAll(' ', '-')}`}
                      onChange={(event) =>
                        updateRow(row.id, { approval: event.target.value })
                      }
                      value={row.approval}
                    >
                      {approvalOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <textarea
                      aria-label="Mockup observations"
                      onChange={(event) => updateRow(row.id, { obs: event.target.value })}
                      placeholder="Notes"
                      value={row.obs}
                    />
                  </td>
                  <td>
                    <button
                      className="delete-row"
                      onClick={() => removeRow(row.id)}
                      type="button"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </TableScroller>

      <TablePagination
        endIndex={pagination.endIndex}
        onPageChange={pagination.setPage}
        page={pagination.page}
        startIndex={pagination.startIndex}
        totalPages={pagination.totalPages}
        totalRows={rows.length}
      />
    </section>
  )
}

function CommunitiesDashboard() {
  const [rows, setRows] = useState<CommunityRow[]>([])
  const [isLoadingRows, setIsLoadingRows] = useState(true)
  const [communitiesStatus, setCommunitiesStatus] = useState('')
  const [communitiesError, setCommunitiesError] = useState('')
  const pagination = useTablePagination(rows.length)
  const visibleRows = rows.slice(pagination.startIndex, pagination.endIndex)

  useEffect(() => {
    let isMounted = true

    async function loadRows() {
      setIsLoadingRows(true)
      setCommunitiesError('')

      try {
        const response = await fetch(
          `${supabaseRestUrl}/communities_dashboard_rows?select=*&order=row_order.asc,created_at.asc`,
          {
            headers: supabaseHeaders(),
          },
        )
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Could not load Communities dashboard rows.')
        }

        if (isMounted) {
          setRows(sortRowsByDate((data as CommunityDbRow[]).map(toCommunityRow)))
          setCommunitiesStatus(data.length ? 'Loaded from Supabase.' : 'No saved community rows yet.')
        }
      } catch (error) {
        if (isMounted) {
          setRows(sortRowsByDate(initialCommunityRows))
          setCommunitiesError(
            error instanceof Error
              ? error.message
              : 'Could not load Communities dashboard rows.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoadingRows(false)
        }
      }
    }

    loadRows()

    return () => {
      isMounted = false
    }
  }, [])

  function updateRow(id: string, changes: Partial<CommunityRow>) {
    let updatedRow: CommunityRow | null = null
    let rowOrder = 0

    setRows((currentRows) => {
      const nextRows = sortRowsByDate(
        currentRows.map((row) => {
          if (row.id !== id) return row

          updatedRow = { ...row, ...changes }
          return updatedRow
        }),
      )
      rowOrder = nextRows.findIndex((row) => row.id === id)
      return nextRows
    })

    window.setTimeout(() => {
      if (updatedRow) {
        saveRow(updatedRow, rowOrder)
      }
    }, 0)
  }

  async function saveRow(row: CommunityRow, rowOrder: number) {
    if (!supabaseAnonKey) {
      setCommunitiesError('Missing VITE_SUPABASE_ANON_KEY.')
      return
    }

    setCommunitiesStatus('Saving...')
    setCommunitiesError('')

    try {
      const response = await fetch(
        `${supabaseRestUrl}/communities_dashboard_rows?id=eq.${row.id}`,
        {
          body: JSON.stringify(toCommunityDbPayload(row, rowOrder)),
          headers: supabaseHeaders(),
          method: 'PATCH',
        },
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Could not save community row.')
      }

      setCommunitiesStatus('Saved to Supabase.')
    } catch (error) {
      setCommunitiesError(error instanceof Error ? error.message : 'Could not save community row.')
    }
  }

  async function addRow() {
    const nextRow: CommunityRow = {
      id: crypto.randomUUID(),
      approval: 'Pending Approval',
      date: '',
      link: '',
      obs: '',
      platform: '',
    }

    const nextRows = sortRowsByDate([...rows, nextRow])
    const rowOrder = nextRows.findIndex((row) => row.id === nextRow.id)

    setRows(nextRows)
    setCommunitiesStatus('Saving new community row...')
    setCommunitiesError('')

    try {
      const response = await fetch(`${supabaseRestUrl}/communities_dashboard_rows`, {
        body: JSON.stringify(toCommunityDbPayload(nextRow, rowOrder)),
        headers: supabaseHeaders('return=representation'),
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Could not create community row.')
      }

      setCommunitiesStatus('New community row saved.')
    } catch (error) {
      setCommunitiesError(error instanceof Error ? error.message : 'Could not create community row.')
    }
  }

  async function removeRow(id: string) {
    setRows((currentRows) => currentRows.filter((row) => row.id !== id))
    setCommunitiesStatus('Deleting community row...')
    setCommunitiesError('')

    try {
      const response = await fetch(`${supabaseRestUrl}/communities_dashboard_rows?id=eq.${id}`, {
        headers: supabaseHeaders(),
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Could not delete community row.')
      }

      setCommunitiesStatus('Community row deleted.')
    } catch (error) {
      setCommunitiesError(error instanceof Error ? error.message : 'Could not delete community row.')
    }
  }

  function exportCsv() {
    const headers = ['Date', 'Platform', 'Link', 'Approval', 'Notes']
    const body = rows.map((row) =>
      [row.date, row.platform, row.link, row.approval, row.obs].map(csvEscape).join(','),
    )

    downloadTextFile(
      'communities-dashboard.csv',
      [headers.map(csvEscape).join(','), ...body].join('\n'),
      'text/csv',
    )
  }

  return (
    <section
      className="email-dashboard communities-dashboard"
      aria-labelledby="communities-dashboard-title"
    >
      <div className="email-toolbar">
        <div>
          <p className="eyebrow">Community Review</p>
          <h2 id="communities-dashboard-title">Communities Table</h2>
          <p>
            Track community platforms, live links, approval status, and notes before
            publishing.
          </p>
        </div>

        <div className="toolbar-actions">
          <button onClick={addRow} type="button">
            Add row
          </button>
          <button onClick={exportCsv} type="button">
            Export CSV
          </button>
          <button
            onClick={() =>
              downloadTextFile(
                'communities-dashboard.json',
                JSON.stringify(rows, null, 2),
                'application/json',
              )
            }
            type="button"
          >
            Export JSON
          </button>
        </div>
      </div>

      <div className="email-sync-status" aria-live="polite">
        <span>{isLoadingRows ? 'Loading community rows from Supabase...' : communitiesStatus}</span>
        {communitiesError ? <strong>{communitiesError}</strong> : null}
      </div>

      <TableScroller>
        <table className="email-table communities-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Platform</th>
              <th>Link</th>
              <th>Approval</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoadingRows ? (
              <tr>
                <td className="empty-table-message" colSpan={6}>
                  Loading saved community rows...
                </td>
              </tr>
            ) : null}

            {!isLoadingRows && rows.length === 0 ? (
              <tr>
                <td className="empty-table-message" colSpan={6}>
                  No saved community rows yet. Add a row to start planning.
                </td>
              </tr>
            ) : null}

            {!isLoadingRows &&
              visibleRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <input
                      aria-label="Community date"
                      onChange={(event) => updateRow(row.id, { date: event.target.value })}
                      placeholder="May 04 to 15"
                      value={row.date}
                    />
                  </td>
                  <td>
                    <input
                      aria-label="Community platform"
                      onChange={(event) => updateRow(row.id, { platform: event.target.value })}
                      placeholder="INSTAGRAM"
                      value={row.platform}
                    />
                  </td>
                  <td>
                    <LinkField
                      aria-label="Community link"
                      onChange={(value) => updateRow(row.id, { link: value })}
                      placeholder="https://"
                      value={row.link}
                    />
                  </td>
                  <td>
                    <select
                      aria-label="Community approval"
                      className={`approval-select ${row.approval
                        .toLowerCase()
                        .replaceAll(' ', '-')}`}
                      onChange={(event) =>
                        updateRow(row.id, { approval: event.target.value })
                      }
                      value={row.approval}
                    >
                      {approvalOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <textarea
                      aria-label="Community observations"
                      onChange={(event) => updateRow(row.id, { obs: event.target.value })}
                      placeholder="Notes"
                      value={row.obs}
                    />
                  </td>
                  <td>
                    <button
                      className="delete-row"
                      onClick={() => removeRow(row.id)}
                      type="button"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </TableScroller>

      <TablePagination
        endIndex={pagination.endIndex}
        onPageChange={pagination.setPage}
        page={pagination.page}
        startIndex={pagination.startIndex}
        totalPages={pagination.totalPages}
        totalRows={rows.length}
      />
    </section>
  )
}

function AdsDharmaDashboard() {
  const [rows, setRows] = useState<AdsDharmaRow[]>([])
  const [isLoadingRows, setIsLoadingRows] = useState(true)
  const [adsStatus, setAdsStatus] = useState('')
  const [adsError, setAdsError] = useState('')
  const pagination = useTablePagination(rows.length)
  const visibleRows = rows.slice(pagination.startIndex, pagination.endIndex)

  useEffect(() => {
    let isMounted = true

    async function loadRows() {
      setIsLoadingRows(true)
      setAdsError('')

      try {
        const response = await fetch(
          `${supabaseRestUrl}/ads_dharma_dashboard_rows?select=*&order=row_order.asc,created_at.asc`,
          {
            headers: supabaseHeaders(),
          },
        )
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Could not load Ads Injection rows.')
        }

        if (isMounted) {
          setRows(sortRowsByDate((data as AdsDharmaDbRow[]).map(toAdsDharmaRow)))
          setAdsStatus(data.length ? 'Loaded from Supabase.' : 'No saved Ads Injection rows yet.')
        }
      } catch (error) {
        if (isMounted) {
          setRows(sortRowsByDate(initialAdsDharmaRows))
          setAdsError(error instanceof Error ? error.message : 'Could not load Ads Injection rows.')
        }
      } finally {
        if (isMounted) {
          setIsLoadingRows(false)
        }
      }
    }

    loadRows()

    return () => {
      isMounted = false
    }
  }, [])

  function updateRow(id: string, changes: Partial<AdsDharmaRow>) {
    let updatedRow: AdsDharmaRow | null = null
    let rowOrder = 0

    setRows((currentRows) => {
      const nextRows = sortRowsByDate(
        currentRows.map((row) => {
        if (row.id !== id) return row

        updatedRow = { ...row, ...changes }
        return updatedRow
        }),
      )
      rowOrder = nextRows.findIndex((row) => row.id === id)
      return nextRows
    })

    window.setTimeout(() => {
      if (updatedRow) {
        saveRow(updatedRow, rowOrder)
      }
    }, 0)
  }

  async function saveRow(row: AdsDharmaRow, rowOrder: number) {
    if (!supabaseAnonKey) {
      setAdsError('Missing VITE_SUPABASE_ANON_KEY.')
      return
    }

    setAdsStatus('Saving...')
    setAdsError('')

    try {
      const response = await fetch(
        `${supabaseRestUrl}/ads_dharma_dashboard_rows?id=eq.${row.id}`,
        {
          body: JSON.stringify(toAdsDharmaDbPayload(row, rowOrder)),
          headers: supabaseHeaders(),
          method: 'PATCH',
        },
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Could not save Ads Injection row.')
      }

      setAdsStatus('Saved to Supabase.')
    } catch (error) {
      setAdsError(error instanceof Error ? error.message : 'Could not save Ads Injection row.')
    }
  }

  async function addRow() {
    const nextRow: AdsDharmaRow = {
      id: crypto.randomUUID(),
      approval: 'Pending Approval',
      artLink1: '',
      artLink2: '',
      artLink3: '',
      copy: '',
      date: '',
      linkLinks: '',
      text: '',
      textReady: false,
    }

    const nextRows = sortRowsByDate([...rows, nextRow])
    const rowOrder = nextRows.findIndex((row) => row.id === nextRow.id)

    setRows(nextRows)
    setAdsStatus('Saving new Ads Injection row...')
    setAdsError('')

    try {
      const response = await fetch(`${supabaseRestUrl}/ads_dharma_dashboard_rows`, {
        body: JSON.stringify(toAdsDharmaDbPayload(nextRow, rowOrder)),
        headers: supabaseHeaders('return=representation'),
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Could not create Ads Injection row.')
      }

      setAdsStatus('New Ads Injection row saved.')
    } catch (error) {
      setAdsError(error instanceof Error ? error.message : 'Could not create Ads Injection row.')
    }
  }

  async function removeRow(id: string) {
    setRows((currentRows) => currentRows.filter((row) => row.id !== id))
    setAdsStatus('Deleting Ads Injection row...')
    setAdsError('')

    try {
      const response = await fetch(`${supabaseRestUrl}/ads_dharma_dashboard_rows?id=eq.${id}`, {
        headers: supabaseHeaders(),
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Could not delete Ads Injection row.')
      }

      setAdsStatus('Ads Injection row deleted.')
    } catch (error) {
      setAdsError(error instanceof Error ? error.message : 'Could not delete Ads Injection row.')
    }
  }

  function exportCsv() {
    const headers = [
      'Date',
      'Copy',
      'Text',
      'Art Link 1',
      'Art Link 2',
      'Art Link 3',
      'Link/Links',
      'Text Ready',
      'Approval',
    ]
    const body = rows.map((row) =>
      [
        row.date,
        row.copy,
        row.text,
        row.artLink1,
        row.artLink2,
        row.artLink3,
        row.linkLinks,
        row.textReady,
        row.approval,
      ]
        .map(csvEscape)
        .join(','),
    )

    downloadTextFile(
      'ads-dharma-dashboard.csv',
      [headers.map(csvEscape).join(','), ...body].join('\n'),
      'text/csv',
    )
  }

  return (
    <section
      className="email-dashboard ads-dharma-dashboard"
      aria-labelledby="ads-dharma-dashboard-title"
    >
      <div className="email-toolbar">
        <div>
          <p className="eyebrow">Ads Injection</p>
          <h2 id="ads-dharma-dashboard-title">Injection Ad Production Table</h2>
          <p>
            Track injection ad copy, creative links, destination links, text readiness, and
            approval status in one campaign review board.
          </p>
        </div>

        <div className="toolbar-actions">
          <button onClick={addRow} type="button">
            Add row
          </button>
          <button onClick={exportCsv} type="button">
            Export CSV
          </button>
          <button
            onClick={() =>
              downloadTextFile(
                'ads-dharma-dashboard.json',
                JSON.stringify(rows, null, 2),
                'application/json',
              )
            }
            type="button"
          >
            Export JSON
          </button>
        </div>
      </div>

      <div className="email-sync-status" aria-live="polite">
        <span>{isLoadingRows ? 'Loading Ads Injection rows from Supabase...' : adsStatus}</span>
        {adsError ? <strong>{adsError}</strong> : null}
      </div>

      <TableScroller>
        <table className="email-table ads-dharma-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Copy</th>
              <th>Text</th>
              <th>Art 1</th>
              <th>Art 2</th>
              <th>Art 3</th>
              <th>Link/Links</th>
              <th>Text</th>
              <th>Approval</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoadingRows ? (
              <tr>
                <td className="empty-table-message" colSpan={10}>
                  Loading saved Ads Injection rows...
                </td>
              </tr>
            ) : null}

            {!isLoadingRows && rows.length === 0 ? (
              <tr>
                <td className="empty-table-message" colSpan={10}>
                  No saved Ads Injection rows yet. Add a row to start planning.
                </td>
              </tr>
            ) : null}

            {!isLoadingRows &&
              visibleRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <input
                      aria-label="Ads Injection date"
                      onChange={(event) => updateRow(row.id, { date: event.target.value })}
                      placeholder="Date"
                      value={row.date}
                    />
                  </td>
                  <td>
                    <LinkField
                      aria-label="Ads Injection copy"
                      onChange={(value) => updateRow(row.id, { copy: value })}
                      placeholder="Copy link or label"
                      type="text"
                      value={row.copy}
                    />
                  </td>
                  <td>
                    <textarea
                      aria-label="Ads Injection text"
                      onChange={(event) => updateRow(row.id, { text: event.target.value })}
                      placeholder="Ad text"
                      value={row.text}
                    />
                  </td>
                  {(['artLink1', 'artLink2', 'artLink3'] as const).map((field, index) => (
                    <td key={field}>
                      <LinkField
                        aria-label={`Ads Injection art link ${index + 1}`}
                        onChange={(value) => updateRow(row.id, { [field]: value })}
                        placeholder="Art link"
                        type="text"
                        value={row[field]}
                      />
                    </td>
                  ))}
                  <td>
                    <LinkField
                      aria-label="Ads Injection link links"
                      onChange={(value) => updateRow(row.id, { linkLinks: value })}
                      placeholder="https://"
                      type="text"
                      value={row.linkLinks}
                    />
                  </td>
                  <td className="check-cell">
                    <input
                      aria-label="Ads Injection text ready"
                      checked={row.textReady}
                      onChange={(event) =>
                        updateRow(row.id, { textReady: event.target.checked })
                      }
                      type="checkbox"
                    />
                  </td>
                  <td>
                    <select
                      aria-label="Ads Injection approval"
                      className={`approval-select ${row.approval
                        .toLowerCase()
                        .replaceAll(' ', '-')}`}
                      onChange={(event) =>
                        updateRow(row.id, { approval: event.target.value })
                      }
                      value={row.approval}
                    >
                      {approvalOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      className="delete-row"
                      onClick={() => removeRow(row.id)}
                      type="button"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </TableScroller>

      <TablePagination
        endIndex={pagination.endIndex}
        onPageChange={pagination.setPage}
        page={pagination.page}
        startIndex={pagination.startIndex}
        totalPages={pagination.totalPages}
        totalRows={rows.length}
      />
    </section>
  )
}

function AdsBerberineDashboard() {
  const [rows, setRows] = useState<AdsBerberineRow[]>([])
  const [isLoadingRows, setIsLoadingRows] = useState(true)
  const [adsStatus, setAdsStatus] = useState('')
  const [adsError, setAdsError] = useState('')
  const pagination = useTablePagination(rows.length)
  const visibleRows = rows.slice(pagination.startIndex, pagination.endIndex)

  useEffect(() => {
    let isMounted = true

    async function loadRows() {
      setIsLoadingRows(true)
      setAdsError('')

      try {
        const response = await fetch(
          `${supabaseRestUrl}/ads_berberine_dashboard_rows?select=*&order=row_order.asc,created_at.asc`,
          {
            headers: supabaseHeaders(),
          },
        )
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Could not load Ads Supplement rows.')
        }

        if (isMounted) {
          setRows(sortRowsByDate((data as AdsBerberineDbRow[]).map(toAdsBerberineRow)))
          setAdsStatus(data.length ? 'Loaded from Supabase.' : 'No saved Ads Supplement rows yet.')
        }
      } catch (error) {
        if (isMounted) {
          setRows(sortRowsByDate(initialAdsBerberineRows))
          setAdsError(
            error instanceof Error ? error.message : 'Could not load Ads Supplement rows.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoadingRows(false)
        }
      }
    }

    loadRows()

    return () => {
      isMounted = false
    }
  }, [])

  function updateRow(id: string, changes: Partial<AdsBerberineRow>) {
    let updatedRow: AdsBerberineRow | null = null
    let rowOrder = 0

    setRows((currentRows) => {
      const nextRows = sortRowsByDate(
        currentRows.map((row) => {
        if (row.id !== id) return row

        updatedRow = { ...row, ...changes }
        return updatedRow
        }),
      )
      rowOrder = nextRows.findIndex((row) => row.id === id)
      return nextRows
    })

    window.setTimeout(() => {
      if (updatedRow) {
        saveRow(updatedRow, rowOrder)
      }
    }, 0)
  }

  async function saveRow(row: AdsBerberineRow, rowOrder: number) {
    if (!supabaseAnonKey) {
      setAdsError('Missing VITE_SUPABASE_ANON_KEY.')
      return
    }

    setAdsStatus('Saving...')
    setAdsError('')

    try {
      const response = await fetch(
        `${supabaseRestUrl}/ads_berberine_dashboard_rows?id=eq.${row.id}`,
        {
          body: JSON.stringify(toAdsBerberineDbPayload(row, rowOrder)),
          headers: supabaseHeaders(),
          method: 'PATCH',
        },
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Could not save Ads Supplement row.')
      }

      setAdsStatus('Saved to Supabase.')
    } catch (error) {
      setAdsError(error instanceof Error ? error.message : 'Could not save Ads Supplement row.')
    }
  }

  async function addRow() {
    const nextRow: AdsBerberineRow = {
      id: crypto.randomUUID(),
      approval: 'Pending Approval',
      artLink1: '',
      artLink2: '',
      artLink3: '',
      copy: '',
      date: '',
      linkLinks: '',
      obs: '',
      scheduled: false,
      text: '',
      textReady: false,
    }

    const nextRows = sortRowsByDate([...rows, nextRow])
    const rowOrder = nextRows.findIndex((row) => row.id === nextRow.id)

    setRows(nextRows)
    setAdsStatus('Saving new Ads Supplement row...')
    setAdsError('')

    try {
      const response = await fetch(`${supabaseRestUrl}/ads_berberine_dashboard_rows`, {
        body: JSON.stringify(toAdsBerberineDbPayload(nextRow, rowOrder)),
        headers: supabaseHeaders('return=representation'),
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Could not create Ads Supplement row.')
      }

      setAdsStatus('New Ads Supplement row saved.')
    } catch (error) {
      setAdsError(error instanceof Error ? error.message : 'Could not create Ads Supplement row.')
    }
  }

  async function removeRow(id: string) {
    setRows((currentRows) => currentRows.filter((row) => row.id !== id))
    setAdsStatus('Deleting Ads Supplement row...')
    setAdsError('')

    try {
      const response = await fetch(
        `${supabaseRestUrl}/ads_berberine_dashboard_rows?id=eq.${id}`,
        {
          headers: supabaseHeaders(),
          method: 'DELETE',
        },
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Could not delete Ads Supplement row.')
      }

      setAdsStatus('Ads Supplement row deleted.')
    } catch (error) {
      setAdsError(error instanceof Error ? error.message : 'Could not delete Ads Supplement row.')
    }
  }

  function exportCsv() {
    const headers = [
      'Date',
      'Copy',
      'Text',
      'Art Link 1',
      'Art Link 2',
      'Art Link 3',
      'Link/Links',
      'Text Ready',
      'Approval',
      'Notes',
      'Schedule',
    ]
    const body = rows.map((row) =>
      [
        row.date,
        row.copy,
        row.text,
        row.artLink1,
        row.artLink2,
        row.artLink3,
        row.linkLinks,
        row.textReady,
        row.approval,
        row.obs,
        row.scheduled,
      ]
        .map(csvEscape)
        .join(','),
    )

    downloadTextFile(
      'ads-berberine-dashboard.csv',
      [headers.map(csvEscape).join(','), ...body].join('\n'),
      'text/csv',
    )
  }

  return (
    <section
      className="email-dashboard ads-berberine-dashboard"
      aria-labelledby="ads-berberine-dashboard-title"
    >
      <div className="email-toolbar">
        <div>
          <p className="eyebrow">Ads Supplement</p>
          <h2 id="ads-berberine-dashboard-title">Supplement Ad Production Table</h2>
          <p>
            Coordinate Berberine campaign copy, creative links, landing links, approvals,
            notes, and scheduling from one paid media tracker.
          </p>
        </div>

        <div className="toolbar-actions">
          <button onClick={addRow} type="button">
            Add row
          </button>
          <button onClick={exportCsv} type="button">
            Export CSV
          </button>
          <button
            onClick={() =>
              downloadTextFile(
                'ads-berberine-dashboard.json',
                JSON.stringify(rows, null, 2),
                'application/json',
              )
            }
            type="button"
          >
            Export JSON
          </button>
        </div>
      </div>

      <div className="email-sync-status" aria-live="polite">
        <span>{isLoadingRows ? 'Loading Ads Supplement rows from Supabase...' : adsStatus}</span>
        {adsError ? <strong>{adsError}</strong> : null}
      </div>

      <TableScroller>
        <table className="email-table ads-berberine-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Copy</th>
              <th>Text</th>
              <th>Art 1</th>
              <th>Art 2</th>
              <th>Art 3</th>
              <th>Link/Links</th>
              <th>Text</th>
              <th>Approval</th>
              <th>Notes</th>
              <th>Schedule</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoadingRows ? (
              <tr>
                <td className="empty-table-message" colSpan={12}>
                  Loading saved Ads Supplement rows...
                </td>
              </tr>
            ) : null}

            {!isLoadingRows && rows.length === 0 ? (
              <tr>
                <td className="empty-table-message" colSpan={12}>
                  No saved Ads Supplement rows yet. Add a row to start planning.
                </td>
              </tr>
            ) : null}

            {!isLoadingRows &&
              visibleRows.map((row) => (
                <tr className={row.scheduled ? 'is-scheduled' : undefined} key={row.id}>
                  <td>
                    <input
                      aria-label="Ads Supplement date"
                      onChange={(event) => updateRow(row.id, { date: event.target.value })}
                      placeholder="Date"
                      value={row.date}
                    />
                  </td>
                  <td>
                    <LinkField
                      aria-label="Ads Supplement copy"
                      onChange={(value) => updateRow(row.id, { copy: value })}
                      placeholder="Copy link or label"
                      type="text"
                      value={row.copy}
                    />
                  </td>
                  <td>
                    <textarea
                      aria-label="Ads Supplement text"
                      onChange={(event) => updateRow(row.id, { text: event.target.value })}
                      placeholder="Ad text"
                      value={row.text}
                    />
                  </td>
                  {(['artLink1', 'artLink2', 'artLink3'] as const).map((field, index) => (
                    <td key={field}>
                      <LinkField
                        aria-label={`Ads Supplement art link ${index + 1}`}
                        onChange={(value) => updateRow(row.id, { [field]: value })}
                        placeholder="Art link"
                        type="text"
                        value={row[field]}
                      />
                    </td>
                  ))}
                  <td>
                    <LinkField
                      aria-label="Ads Supplement link links"
                      onChange={(value) => updateRow(row.id, { linkLinks: value })}
                      placeholder="https://"
                      type="text"
                      value={row.linkLinks}
                    />
                  </td>
                  <td className="check-cell">
                    <input
                      aria-label="Ads Supplement text ready"
                      checked={row.textReady}
                      onChange={(event) =>
                        updateRow(row.id, { textReady: event.target.checked })
                      }
                      type="checkbox"
                    />
                  </td>
                  <td>
                    <select
                      aria-label="Ads Supplement approval"
                      className={`approval-select ${row.approval
                        .toLowerCase()
                        .replaceAll(' ', '-')}`}
                      onChange={(event) =>
                        updateRow(row.id, { approval: event.target.value })
                      }
                      value={row.approval}
                    >
                      {approvalOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <textarea
                      aria-label="Ads Supplement observations"
                      onChange={(event) => updateRow(row.id, { obs: event.target.value })}
                      placeholder="Notes"
                      value={row.obs}
                    />
                  </td>
                  <td className="check-cell">
                    <input
                      aria-label="Ads Supplement scheduled"
                      checked={row.scheduled}
                      onChange={(event) =>
                        updateRow(row.id, { scheduled: event.target.checked })
                      }
                      type="checkbox"
                    />
                  </td>
                  <td>
                    <button
                      className="delete-row"
                      onClick={() => removeRow(row.id)}
                      type="button"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </TableScroller>

      <TablePagination
        endIndex={pagination.endIndex}
        onPageChange={pagination.setPage}
        page={pagination.page}
        startIndex={pagination.startIndex}
        totalPages={pagination.totalPages}
        totalRows={rows.length}
      />
    </section>
  )
}

function BannerDashboard() {
  const [rows, setRows] = useState<BannerRow[]>([])
  const [isLoadingRows, setIsLoadingRows] = useState(true)
  const [bannerStatus, setBannerStatus] = useState('')
  const [bannerError, setBannerError] = useState('')
  const pagination = useTablePagination(rows.length)
  const visibleRows = rows.slice(pagination.startIndex, pagination.endIndex)

  useEffect(() => {
    let isMounted = true

    async function loadRows() {
      setIsLoadingRows(true)
      setBannerError('')

      try {
        const response = await fetch(
          `${supabaseRestUrl}/banner_dashboard_rows?select=*&order=row_order.asc,created_at.asc`,
          {
            headers: supabaseHeaders(),
          },
        )
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Could not load Banner rows.')
        }

        if (isMounted) {
          setRows(sortBannerRowsByDate((data as BannerDbRow[]).map(toBannerRow)))
          setBannerStatus(data.length ? 'Loaded from Supabase.' : 'No saved Banner rows yet.')
        }
      } catch (error) {
        if (isMounted) {
          setRows(sortBannerRowsByDate(initialBannerRows))
          setBannerError(error instanceof Error ? error.message : 'Could not load Banner rows.')
        }
      } finally {
        if (isMounted) {
          setIsLoadingRows(false)
        }
      }
    }

    loadRows()

    return () => {
      isMounted = false
    }
  }, [])

  function updateRow(id: string, changes: Partial<BannerRow>) {
    let updatedRow: BannerRow | null = null
    let rowOrder = 0

    setRows((currentRows) => {
      const nextRows = sortBannerRowsByDate(
        currentRows.map((row) => {
        if (row.id !== id) return row

        updatedRow = { ...row, ...changes }
        return updatedRow
        }),
      )
      rowOrder = nextRows.findIndex((row) => row.id === id)
      return nextRows
    })

    window.setTimeout(() => {
      if (updatedRow) {
        saveRow(updatedRow, rowOrder)
      }
    }, 0)
  }

  async function saveRow(row: BannerRow, rowOrder: number) {
    if (!supabaseAnonKey) {
      setBannerError('Missing VITE_SUPABASE_ANON_KEY.')
      return
    }

    setBannerStatus('Saving...')
    setBannerError('')

    try {
      const response = await fetch(`${supabaseRestUrl}/banner_dashboard_rows?id=eq.${row.id}`, {
        body: JSON.stringify(toBannerDbPayload(row, rowOrder)),
        headers: supabaseHeaders(),
        method: 'PATCH',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Could not save Banner row.')
      }

      setBannerStatus('Saved to Supabase.')
    } catch (error) {
      setBannerError(error instanceof Error ? error.message : 'Could not save Banner row.')
    }
  }

  async function addRow() {
    const nextRow: BannerRow = {
      id: crypto.randomUUID(),
      approval: 'Pending Approval',
      artLink: '',
      artReady: false,
      copyReady: false,
      endDate: new Date().toISOString().slice(0, 10),
      obs: '',
      startDate: new Date().toISOString().slice(0, 10),
      text: '',
    }

    const nextRows = sortBannerRowsByDate([...rows, nextRow])
    const rowOrder = nextRows.findIndex((row) => row.id === nextRow.id)

    setRows(nextRows)
    setBannerStatus('Saving new Banner row...')
    setBannerError('')

    try {
      const response = await fetch(`${supabaseRestUrl}/banner_dashboard_rows`, {
        body: JSON.stringify(toBannerDbPayload(nextRow, rowOrder)),
        headers: supabaseHeaders('return=representation'),
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Could not create Banner row.')
      }

      setBannerStatus('New Banner row saved.')
    } catch (error) {
      setBannerError(error instanceof Error ? error.message : 'Could not create Banner row.')
    }
  }

  async function removeRow(id: string) {
    setRows((currentRows) => currentRows.filter((row) => row.id !== id))
    setBannerStatus('Deleting Banner row...')
    setBannerError('')

    try {
      const response = await fetch(`${supabaseRestUrl}/banner_dashboard_rows?id=eq.${id}`, {
        headers: supabaseHeaders(),
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Could not delete Banner row.')
      }

      setBannerStatus('Banner row deleted.')
    } catch (error) {
      setBannerError(error instanceof Error ? error.message : 'Could not delete Banner row.')
    }
  }

  function exportCsv() {
    const headers = [
      'Start Date',
      'End Date',
      'Text',
      'Art Link',
      'Copy',
      'Art',
      'Approval',
      'Notes',
    ]
    const body = rows.map((row) =>
      [
        row.startDate,
        row.endDate,
        row.text,
        row.artLink,
        row.copyReady,
        row.artReady,
        row.approval,
        row.obs,
      ]
        .map(csvEscape)
        .join(','),
    )

    downloadTextFile(
      'banner-dashboard.csv',
      [headers.map(csvEscape).join(','), ...body].join('\n'),
      'text/csv',
    )
  }

  return (
    <section className="email-dashboard banner-dashboard" aria-labelledby="banner-dashboard-title">
      <div className="email-toolbar">
        <div>
          <p className="eyebrow">Banner Schedule</p>
          <h2 id="banner-dashboard-title">Display Banner Production Table</h2>
          <p>
            Manage banner flight dates, text, art links, approvals, and production notes
            for display campaign launches.
          </p>
        </div>

        <div className="toolbar-actions">
          <button onClick={addRow} type="button">
            Add row
          </button>
          <button onClick={exportCsv} type="button">
            Export CSV
          </button>
          <button
            onClick={() =>
              downloadTextFile(
                'banner-dashboard.json',
                JSON.stringify(rows, null, 2),
                'application/json',
              )
            }
            type="button"
          >
            Export JSON
          </button>
        </div>
      </div>

      <div className="email-sync-status" aria-live="polite">
        <span>{isLoadingRows ? 'Loading Banner rows from Supabase...' : bannerStatus}</span>
        {bannerError ? <strong>{bannerError}</strong> : null}
      </div>

      <TableScroller>
        <table className="email-table banner-table">
          <thead>
            <tr>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Text</th>
              <th>Art Link</th>
              <th>Copy</th>
              <th>Art</th>
              <th>Approval</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoadingRows ? (
              <tr>
                <td className="empty-table-message" colSpan={9}>
                  Loading saved Banner rows...
                </td>
              </tr>
            ) : null}

            {!isLoadingRows && rows.length === 0 ? (
              <tr>
                <td className="empty-table-message" colSpan={9}>
                  No saved Banner rows yet. Add a row to start planning.
                </td>
              </tr>
            ) : null}

            {!isLoadingRows &&
              visibleRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <input
                      aria-label="Banner start date"
                      onChange={(event) =>
                        updateRow(row.id, { startDate: event.target.value })
                      }
                      type="date"
                      value={row.startDate}
                    />
                  </td>
                  <td>
                    <input
                      aria-label="Banner end date"
                      onChange={(event) => updateRow(row.id, { endDate: event.target.value })}
                      type="date"
                      value={row.endDate}
                    />
                  </td>
                  <td>
                    <textarea
                      aria-label="Banner text"
                      onChange={(event) => updateRow(row.id, { text: event.target.value })}
                      placeholder="Banner copy"
                      value={row.text}
                    />
                  </td>
                  <td>
                    <LinkField
                      aria-label="Banner art link"
                      onChange={(value) => updateRow(row.id, { artLink: value })}
                      placeholder="https://"
                      type="text"
                      value={row.artLink}
                    />
                  </td>
                  <td className="check-cell">
                    <input
                      aria-label="Banner copy ready"
                      checked={row.copyReady}
                      onChange={(event) =>
                        updateRow(row.id, { copyReady: event.target.checked })
                      }
                      type="checkbox"
                    />
                  </td>
                  <td className="check-cell">
                    <input
                      aria-label="Banner art ready"
                      checked={row.artReady}
                      onChange={(event) =>
                        updateRow(row.id, { artReady: event.target.checked })
                      }
                      type="checkbox"
                    />
                  </td>
                  <td>
                    <select
                      aria-label="Banner approval"
                      className={`approval-select ${row.approval
                        .toLowerCase()
                        .replaceAll(' ', '-')}`}
                      onChange={(event) =>
                        updateRow(row.id, { approval: event.target.value })
                      }
                      value={row.approval}
                    >
                      {approvalOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <textarea
                      aria-label="Banner observations"
                      onChange={(event) => updateRow(row.id, { obs: event.target.value })}
                      placeholder="Notes"
                      value={row.obs}
                    />
                  </td>
                  <td>
                    <button
                      className="delete-row"
                      onClick={() => removeRow(row.id)}
                      type="button"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </TableScroller>

      <TablePagination
        endIndex={pagination.endIndex}
        onPageChange={pagination.setPage}
        page={pagination.page}
        startIndex={pagination.startIndex}
        totalPages={pagination.totalPages}
        totalRows={rows.length}
      />
    </section>
  )
}

function MarketingPage({ route }: { route: MarketingRoute }) {
  const isHome = route.path === '/'
  const isEmail = route.path === '/email'
  const isSms = route.path === '/sms'
  const isInsta = route.path === '/insta'
  const isTiktok = route.path === '/tiktok'
  const isMockup = route.path === '/mockup'
  const isCommunities = route.path === '/communities'
  const isAdsDharma = route.path === '/ads-dharma'
  const isAdsBerberine = route.path === '/ads-berberine'
  const isBanner = route.path === '/banner'
  const [isEmailCardFlipped, setIsEmailCardFlipped] = useState(false)
  const [isEmailCardTurning, setIsEmailCardTurning] = useState(false)
  const [quickLinks, setQuickLinks] = useState(emailQuickLinks)
  const [editingQuickLink, setEditingQuickLink] = useState<{
    label: string
    url: string
  } | null>(null)
  const [copiedQuickLink, setCopiedQuickLink] = useState('')
  const panelDescription = isEmail
    ? 'Plan every email send, subject line, link, creative asset, approval, and schedule date from one focused production board.'
    : isHome
      ? 'Monitor campaign research, creative planning, approvals, and launch-ready actions from one central marketing control room.'
      : isSms
        ? 'Coordinate concise broadcast copy, links, approvals, and send timing for fast-moving SMS campaigns.'
        : isInsta
          ? 'Plan Instagram posts, captions, feed links, stories, notes, and approvals from one visual content calendar.'
          : isTiktok
            ? 'Coordinate TikTok video links, captions, approval status, and content notes for short-form campaign production.'
            : isMockup
              ? 'Review creative mockups, platform placements, asset links, approvals, and revision notes before production.'
              : isCommunities
                ? 'Manage community platform links, approval status, and notes from a focused production table.'
                : isAdsDharma
                  ? 'Manage injection ad copy, creative links, landing links, readiness checks, and approvals for paid media production.'
                  : isAdsBerberine
                    ? 'Coordinate Berberine ad copy, creative assets, links, notes, approvals, and scheduling for paid media launches.'
                    : isBanner
                      ? 'Plan banner flight dates, display copy, art links, approvals, and launch notes for every placement.'
                      : `This routed page is ready for your ${route.label.toLowerCase()} workflow, assets, and campaign controls.`
  const titleIconClass = `title-motion-icon title-icon-${
    route.path === '/' ? 'home' : route.path.replace('/', '')
  }`

  function openQuickLinkEditor(label: string) {
    const currentUrl = quickLinks.find((link) => link.label === label)?.url || ''

    setEditingQuickLink({ label, url: currentUrl })
  }

  function saveQuickLink() {
    if (!editingQuickLink) return

    setQuickLinks((links) =>
      links.map((link) =>
        link.label === editingQuickLink.label
          ? { ...link, url: editingQuickLink.url.trim() }
          : link,
      ),
    )
    setEditingQuickLink(null)
  }

  async function copyQuickLink(label: string, url: string) {
    if (!url) return

    await navigator.clipboard.writeText(url)
    setCopiedQuickLink(label)
    window.setTimeout(() => {
      setCopiedQuickLink((currentLabel) => (currentLabel === label ? '' : currentLabel))
    }, 1600)
  }

  function toggleEmailCard() {
    if (isEmailCardTurning) return

    setIsEmailCardTurning(true)
    window.setTimeout(() => {
      setIsEmailCardFlipped((isFlipped) => !isFlipped)
    }, 240)
    window.setTimeout(() => {
      setIsEmailCardTurning(false)
    }, 520)
  }

  return (
    <>
      <section className="page-view">
        <div className="page-copy">
          <p className="eyebrow">{route.eyebrow}</p>
          <div className="title-row">
            {isHome ? (
              <a
                aria-label="Open Dharma Nutrition Clinic on Google Maps"
                className={titleIconClass}
                href={dharmaMapsUrl}
                rel="noreferrer"
                target="_blank"
              >
                <span />
              </a>
            ) : (
              <span className={titleIconClass} aria-hidden="true">
                <span />
              </span>
            )}
            <h1>{route.title}</h1>
          </div>
          <p className="lede">{route.description}</p>
        </div>

        {isEmail ? (
          <button
            aria-label={
              isEmailCardFlipped
                ? 'Show email campaign summary'
                : 'Show email campaign links'
            }
            aria-pressed={isEmailCardFlipped}
            className={`workspace-panel flip-card ${isEmailCardFlipped ? 'flipped' : ''} ${
              isEmailCardTurning ? 'turning' : ''
            }`}
            onClick={toggleEmailCard}
            type="button"
          >
            <span className="flip-card-inner">
              <span className="flip-card-face">
                {isEmailCardFlipped ? (
                  <>
                    <span className="panel-label">Quick Links</span>
                    <span className="card-title">Email Campaign Links</span>
                    <span className="quick-links-list">
                      {quickLinks.map((link) => (
                        <span className="quick-link-row" key={link.label}>
                          <span>{link.label}</span>
                          <span className="quick-link-actions">
                            <button
                              onClick={(event) => {
                                event.stopPropagation()
                                openQuickLinkEditor(link.label)
                              }}
                              type="button"
                            >
                              View/Replace
                            </button>
                            {link.url ? (
                              <>
                                <a
                                  href={link.url}
                                  onClick={(event) => event.stopPropagation()}
                                  rel="noreferrer"
                                  target="_blank"
                                >
                                  Open
                                </a>
                                <button
                                  className={
                                    copiedQuickLink === link.label ? 'copied-link-button' : ''
                                  }
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    copyQuickLink(link.label, link.url)
                                  }}
                                  type="button"
                                >
                                  {copiedQuickLink === link.label ? '✓ Copied' : 'Copy'}
                                </button>
                              </>
                            ) : (
                              <em>Pending</em>
                            )}
                          </span>
                        </span>
                      ))}
                    </span>
                    <span className="flip-hint">Click to flip back</span>
                  </>
                ) : (
                  <>
                    <span className="panel-icon mail-icon" aria-hidden="true">
                      <span className="mail-back" />
                      <span className="mail-flap" />
                      <span className="mail-letter" />
                      <span className="mail-front" />
                    </span>
                    <span className="panel-label">{route.label}</span>
                    <span className="card-title">{route.title}</span>
                    <span className="card-description">{panelDescription}</span>
                    <span className="flip-hint">Click to view links</span>
                  </>
                )}
              </span>
            </span>
          </button>
        ) : (
          <div className="workspace-panel">
            <span
              className={
                isHome
                  ? 'panel-icon command-icon'
                  : isSms
                    ? 'panel-icon sms-icon'
                    : isInsta
                        ? 'panel-icon insta-icon'
                        : isTiktok
                          ? 'panel-icon tiktok-icon'
                          : isMockup || isCommunities
                            ? 'panel-icon mockup-icon'
                            : isAdsDharma
                              ? 'panel-icon ads-icon'
                              : isAdsBerberine
                                ? 'panel-icon berberine-icon'
                                : isBanner
                                  ? 'panel-icon banner-icon'
                                  : 'panel-icon'
              }
              aria-hidden="true"
            >
              {isHome ? (
                <>
                  <span className="command-ring" />
                  <span className="command-pulse" />
                  <span className="command-screen" />
                  <span className="command-dot dot-one" />
                  <span className="command-dot dot-two" />
                  <span className="command-dot dot-three" />
                </>
              ) : isSms ? (
                <>
                  <span className="sms-phone" />
                  <span className="sms-bubble bubble-one" />
                  <span className="sms-bubble bubble-two" />
                  <span className="sms-line line-one" />
                  <span className="sms-line line-two" />
                </>
              ) : isInsta ? (
                <>
                  <span className="insta-frame" />
                  <span className="insta-lens" />
                  <span className="insta-flash" />
                  <span className="insta-spark spark-one" />
                  <span className="insta-spark spark-two" />
                </>
              ) : isTiktok ? (
                <>
                  <span className="tiktok-phone" />
                  <span className="tiktok-play" />
                  <span className="tiktok-wave wave-one" />
                  <span className="tiktok-wave wave-two" />
                </>
              ) : isMockup || isCommunities ? (
                <>
                  <span className="mockup-board" />
                  <span className="mockup-tile tile-one" />
                  <span className="mockup-tile tile-two" />
                  <span className="mockup-tile tile-three" />
                  <span className="mockup-cursor" />
                </>
              ) : isAdsDharma ? (
                <>
                  <span className="ads-megaphone" />
                  <span className="ads-handle" />
                  <span className="ads-wave ads-wave-one" />
                  <span className="ads-wave ads-wave-two" />
                  <span className="ads-spark" />
                </>
              ) : isAdsBerberine ? (
                <>
                  <span className="berberine-bottle" />
                  <span className="berberine-cap" />
                  <span className="berberine-leaf leaf-one" />
                  <span className="berberine-leaf leaf-two" />
                  <span className="berberine-pulse" />
                </>
              ) : isBanner ? (
                <>
                  <span className="banner-frame" />
                  <span className="banner-line banner-line-one" />
                  <span className="banner-line banner-line-two" />
                  <span className="banner-badge" />
                  <span className="banner-scan" />
                </>
              ) : (
                <img src="/logo1.png" alt="" />
              )}
            </span>
            <p className="panel-label">{route.label}</p>
            <h2>{route.title}</h2>
            <p>{panelDescription}</p>
          </div>
        )}

        {editingQuickLink ? (
          <div
            className="quick-link-modal-backdrop"
            onClick={() => setEditingQuickLink(null)}
            role="presentation"
          >
            <form
              aria-labelledby="quick-link-modal-title"
              className="quick-link-modal"
              onClick={(event) => event.stopPropagation()}
              onSubmit={(event) => {
                event.preventDefault()
                saveQuickLink()
              }}
            >
              <p className="panel-label">Quick Link</p>
              <h3 id="quick-link-modal-title">View or replace link</h3>
              <label>
                {editingQuickLink.label}
                <input
                  autoFocus
                  onChange={(event) =>
                    setEditingQuickLink((current) =>
                      current ? { ...current, url: event.target.value } : current,
                    )
                  }
                  placeholder="https://"
                  type="url"
                  value={editingQuickLink.url}
                />
              </label>

              <div className="quick-link-modal-actions">
                <button type="submit">Save link</button>
                <button onClick={() => setEditingQuickLink(null)} type="button">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </section>

      {isHome ? <AdsResearchDashboard /> : null}
      {isEmail ? <EmailDashboard /> : null}
      {isSms ? <SmsDashboard /> : null}
      {isInsta ? <InstaDashboard /> : null}
      {isTiktok ? <TiktokDashboard /> : null}
      {isMockup ? <MockupDashboard /> : null}
      {isCommunities ? <CommunitiesDashboard /> : null}
      {isAdsDharma ? <AdsDharmaDashboard /> : null}
      {isAdsBerberine ? <AdsBerberineDashboard /> : null}
      {isBanner ? <BannerDashboard /> : null}
    </>
  )
}

function MarketingLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setStatus('')

    if (!supabaseAnonKey) {
      setError('Missing VITE_SUPABASE_ANON_KEY.')
      return
    }

    setIsSubmitting(true)

    try {
      const { error: signInError } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        throw signInError
      }
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Could not sign in.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function sendPasswordReset() {
    setError('')
    setStatus('')

    if (!email) {
      setError('Enter your email first.')
      return
    }

    const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })

    if (resetError) {
      setError(resetError.message)
      return
    }

    setStatus('Password reset email sent.')
  }

  return (
    <main className="login-shell">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-brand-row">
          <div>
            <h1 id="login-title">
              Dharma <span>Marketing Tool</span>
            </h1>
            <p>Secure campaign workspace</p>
          </div>
        </div>

        <form className="login-form" onSubmit={signIn}>
          <label>
            User / Email
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>

          <label>
            <span className="login-label-row">
              Password
              <button onClick={sendPasswordReset} type="button">
                Forgot?
              </button>
            </span>
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          {error ? <p className="login-error">{error}</p> : null}
          {status ? <p className="login-status">{status}</p> : null}

          <button className="login-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <footer className="login-footer">
          <strong>dharma</strong>
          <span>Copyright Dharma Nutrition Clinic @ IT</span>
        </footer>
      </section>

      <section className="login-visual" aria-label="Marketing command center preview">
        <div className="login-calendar-stack" aria-hidden="true">
          <span className="login-calendar-card calendar-back">
            <i />
            <i />
            <i />
          </span>
          <span className="login-calendar-card calendar-front">
            <span className="calendar-rings" />
            <span className="calendar-head" />
            <span className="calendar-grid-mini">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
          </span>
        </div>

        <div className="login-megaphone" aria-hidden="true">
          <span className="megaphone-cone" />
          <span className="megaphone-handle" />
          <span className="megaphone-wave wave-a" />
          <span className="megaphone-wave wave-b" />
        </div>

        <p>Master</p>
        <h2>Your Marketing</h2>
        <div className="login-target" aria-hidden="true">
          <span />
        </div>
        <div className="login-magazine" aria-hidden="true">
          <span className="magazine-shadow" />
          <span className="magazine-page page-left">
            <i className="magazine-title-line" />
            <i />
            <i />
            <i />
            <b />
          </span>
          <span className="magazine-page page-right">
            <i className="magazine-title-line" />
            <i />
            <i />
            <i />
            <b />
          </span>
          <span className="magazine-page flipping-page flip-one">
            <i />
            <i />
            <i />
          </span>
          <span className="magazine-page flipping-page flip-two">
            <i />
            <i />
            <i />
          </span>
          <span className="magazine-spine" />
        </div>
      </section>
    </main>
  )
}

function App() {
  const location = useLocation()
  const [session, setSession] = useState<Session | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  useEffect(() => {
    window.scrollTo({ left: 0, top: 0 })
  }, [location.pathname])

  useEffect(() => {
    let isMounted = true

    supabaseClient.auth.getSession().then(({ data }) => {
      if (isMounted) {
        supabaseAccessToken = data.session?.access_token || ''
        setSession(data.session)
        setIsAuthLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, nextSession) => {
      supabaseAccessToken = nextSession?.access_token || ''
      setSession(nextSession)
      setIsAuthLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function signOut() {
    supabaseAccessToken = ''
    await supabaseClient.auth.signOut()
  }

  if (isAuthLoading) {
    return (
      <main className="auth-loading">
        <span>Loading Marketing Tool...</span>
      </main>
    )
  }

  if (!session) {
    return <MarketingLogin />
  }

  return (
    <main className="app-shell">
      <header className="site-header" aria-label="Primary">
        <NavLink
          aria-label="Marketing Tool home"
          className="brand-area"
          onClick={() => window.scrollTo({ behavior: 'smooth', left: 0, top: 0 })}
          to="/"
        >
          <span className="brand-logo">
            <img src="/logo1.png" alt="" />
          </span>
          <span className="brand-name">
            <span>Marketing Tool</span>
          </span>
        </NavLink>

        <nav className="tabs" aria-label="Marketing sections">
          {marketingRoutes.map((route) => (
            <NavLink
              className={({ isActive }) => (isActive ? 'tab active' : 'tab')}
              end={route.path === '/'}
              key={route.path}
              to={route.path}
            >
              {route.label}
            </NavLink>
          ))}
        </nav>

        <div className="auth-actions">
          <span>{session.user.email}</span>
          <button onClick={signOut} type="button">
            Sign out
          </button>
        </div>
      </header>

      <Routes>
        {marketingRoutes.map((route) => (
          <Route
            element={<MarketingPage route={route} />}
            key={route.path}
            path={route.path}
          />
        ))}
        <Route element={<Navigate replace to="/" />} path="*" />
      </Routes>
    </main>
  )
}

export default App
