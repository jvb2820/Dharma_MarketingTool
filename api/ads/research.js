import { handleAdsResearchRequest } from '../../server.js'

export const config = {
  maxDuration: 60,
}

export default function handler(request, response) {
  return handleAdsResearchRequest(request, response)
}
