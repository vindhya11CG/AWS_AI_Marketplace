/**
 * marketplaceService.js
 * ----------------------
 * Client service connecting the React/Cloudscape frontend to the AWS S3
 * and Lambda connector endpoints for SharePoint catalog data.
 *
 * Supported operations:
 *  - fetchCatalog(): Fetches live curated catalog (S3 / CloudFront / API Gateway / Function URL)
 *  - syncSharePointData(rawItems): Sends raw SharePoint list export to AWS Lambda transform
 *  - submitComment(itemId, comment): Adds comment to S3-persisted catalog
 *  - submitRating(itemId, rating): Submits 1-5 star rating to S3-persisted catalog
 */

import { INDUSTRIES, AGENT_DOMAINS } from '../data/marketplaceData'

const rawCatalogUrl = import.meta.env.VITE_CATALOG_URL || ''
const rawApiEndpoint = import.meta.env.VITE_API_ENDPOINT || ''

const API_ENDPOINT = rawApiEndpoint.replace(/\/+$/, '')
const CATALOG_URL = rawCatalogUrl.trim()

export const marketplaceService = {
  /**
   * Fetches the live curated catalog from S3 / CloudFront or API Gateway.
   * Returns { industries, domains } or falls back to cached/bundled static data.
   */
  async fetchCatalog() {
    // 1. Try direct API Gateway / Function URL GET /catalog
    if (API_ENDPOINT) {
      try {
        const catalogPath = API_ENDPOINT.endsWith('/catalog') ? API_ENDPOINT : `${API_ENDPOINT}/catalog`
        const res = await fetch(catalogPath, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        })
        if (res.ok) {
          const data = await res.json()
          if (data && (data.industries || data.domains)) {
            console.info('Successfully fetched live catalog from API /catalog')
            return {
              industries: Array.isArray(data.industries) && data.industries.length > 0 ? data.industries : INDUSTRIES,
              domains: Array.isArray(data.domains) && data.domains.length > 0 ? data.domains : AGENT_DOMAINS,
            }
          }
        } else {
          console.warn(`API /catalog returned HTTP ${res.status}. Falling back to secondary sources.`)
        }
      } catch (err) {
        console.warn('API /catalog fetch error:', err)
      }
    }

    // 2. Try S3 direct curated JSON URL
    if (CATALOG_URL) {
      try {
        const res = await fetch(CATALOG_URL, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          console.info('Successfully fetched live catalog from S3 curated URL')
          if (Array.isArray(data)) {
            // S3 curated starter-packs.json
            return { industries: data, domains: AGENT_DOMAINS }
          }
          if (data && typeof data === 'object') {
            return {
              industries: Array.isArray(data.industries) && data.industries.length > 0 ? data.industries : INDUSTRIES,
              domains: Array.isArray(data.domains) && data.domains.length > 0 ? data.domains : AGENT_DOMAINS,
            }
          }
        } else {
          console.warn(`S3 curated URL returned HTTP ${res.status}.`)
        }
      } catch (err) {
        console.warn('Direct S3 CATALOG_URL fetch error:', err)
      }
    }

    // 3. Fallback to bundled dataset
    console.info('Using offline base catalog with local sync cache.')
    return {
      industries: INDUSTRIES,
      domains: AGENT_DOMAINS,
    }
  },

  /**
   * Pushes raw SharePoint export items to the AWS Lambda /transform ingestion endpoint.
   * Updates S3 RAW archive and S3 CURATED catalogs.
   */
  async syncSharePointData(rawItems) {
    if (!API_ENDPOINT) {
      console.info('VITE_API_ENDPOINT not configured. Processed locally.')
      return { success: true, localOnly: true }
    }

    const transformUrl = API_ENDPOINT.endsWith('/transform') ? API_ENDPOINT : `${API_ENDPOINT}/transform`

    try {
      const res = await fetch(transformUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rawItems),
      })

      if (!res.ok) {
        throw new Error(`Sync failed with HTTP ${res.status}: ${res.statusText}`)
      }

      const result = await res.json()
      console.info('Live AWS sync complete:', result)
      return { success: true, ...result }
    } catch (err) {
      console.error('Error syncing SharePoint data to AWS endpoint:', err)
      throw err
    }
  },

  /**
   * Submits a user comment on a starter pack or agent.
   */
  async submitComment(itemId, commentText, author = 'Current User') {
    if (!API_ENDPOINT) {
      return { success: true, localOnly: true, comment: { text: commentText, author, created: 'Just now' } }
    }

    try {
      const res = await fetch(`${API_ENDPOINT}/items/${encodeURIComponent(itemId)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentText, author }),
      })
      if (!res.ok) {
        throw new Error(`Failed to submit comment: HTTP ${res.status}`)
      }
      return await res.json()
    } catch (err) {
      console.warn('Failed to submit comment to backend, saving locally:', err)
      return { success: true, localOnly: true, comment: { text: commentText, author, created: 'Just now' } }
    }
  },

  /**
   * Submits a star rating (1-5) on an item.
   */
  async submitRating(itemId, rating) {
    if (!API_ENDPOINT) {
      return { success: true, localOnly: true }
    }

    try {
      const res = await fetch(`${API_ENDPOINT}/items/${encodeURIComponent(itemId)}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      })
      if (!res.ok) {
        throw new Error(`Failed to submit rating: HTTP ${res.status}`)
      }
      return await res.json()
    } catch (err) {
      console.warn('Failed to submit rating to backend:', err)
      return { success: true, localOnly: true }
    }
  },
}
