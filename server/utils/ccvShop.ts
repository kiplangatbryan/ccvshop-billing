import crypto from 'crypto'
import { logger } from './logger'

export interface CCVProduct {
  id: string
  name: string
  price: number
  description?: string
  stock?: number
  sku?: string
  quantity?: number
}

export async function fetchCCVProducts(): Promise<CCVProduct[]> {
  const config = useRuntimeConfig()
  const log = logger.child({ context: { service: 'ccvShop', operation: 'fetchProducts' } })

  try {
    const apiDomain = (config.ccvShopApiUrl || '').replace(/\/$/, '')
    const apiKey = config.ccvShopApiKey
    const apiSecret = config.ccvShopApiSecret

    if (!apiDomain || !apiKey || !apiSecret) {
      log.error('Missing CCV Shop credentials', {
        apiDomain,
        hasApiKey: Boolean(apiKey),
        hasApiSecret: Boolean(apiSecret)
      })
      throw new Error(
        'Missing CCV Shop API credentials. Provide NUXT_CCV_SHOP_API_URL, NUXT_CCV_SHOP_API_KEY and NUXT_CCV_SHOP_API_SECRET environment variables.'
      )
    }

    const uriPath = '/api/rest/v1/products'
    const endpoint = `${apiDomain}${uriPath}`
    const method = 'GET'
    const bodyString = ''

    const { timestamp, hash } = buildCcvAuthSignature({
      apiKey,
      apiSecret,
      method,
      uriPath,
      body: bodyString
    })

    const response = await $fetch<any>(endpoint, {
      method,
      headers: {
        'x-public': apiKey,
        'x-date': timestamp,
        'x-hash': hash
      }
    })

    // Normalize response based on API structure
    const rawProducts: any[] = (() => {
      if (Array.isArray(response)) {
        return response
      }
      if (Array.isArray(response?.products)) {
        return response.products
      }
      if (Array.isArray(response?.data)) {
        return response.data
      }
      if (Array.isArray(response?.items)) {
        return response.items
      }
      return []
    })()

    return rawProducts.map(normalizeCcvProduct)
  } catch (error) {
    log.error('Error fetching CCV products', { error })
    // Return empty array or mock data on error
    return []
  }
}

export async function updateCCVProductStock(productId: string, quantity: number): Promise<boolean> {
  const config = useRuntimeConfig()
  const log = logger.child({ context: { service: 'ccvShop', operation: 'updateStock', productId, quantity } })

  try {
    const apiDomain = (config.ccvShopApiUrl || '').replace(/\/$/, '')
    const apiKey = config.ccvShopApiKey
    const apiSecret = config.ccvShopApiSecret

    if (!apiDomain || !apiKey || !apiSecret) {
      log.error('Missing CCV Shop credentials for stock update', {
        apiDomain,
        hasApiKey: Boolean(apiKey),
        hasApiSecret: Boolean(apiSecret)
      })
      throw new Error(
        'Missing CCV Shop API credentials. Provide NUXT_CCV_SHOP_API_URL, NUXT_CCV_SHOP_API_KEY and NUXT_CCV_SHOP_API_SECRET environment variables.'
      )
    }

    const uriPath = `/api/rest/v1/products/${productId}`
    const endpoint = `${apiDomain}${uriPath}`
    const method = 'PATCH'
    const bodyPayload = {
      stock: quantity
    }
    const bodyString = JSON.stringify(bodyPayload)

    const { timestamp, hash } = buildCcvAuthSignature({
      apiKey,
      apiSecret,
      method,
      uriPath,
      body: bodyString
    })

    const response = await $fetch<any>(endpoint, {
      method,
      headers: {
        'x-public': apiKey,
        'x-date': timestamp,
        'x-hash': hash,
        'Content-Type': 'application/json'
      },
      body: bodyPayload
    })

    return Boolean(response)
  } catch (error) {
    log.error('Error updating CCV product stock', { error })
    return false
  }
}

function buildCcvAuthSignature({
  apiKey,
  apiSecret,
  method,
  uriPath,
  body
}: {
  apiKey: string
  apiSecret: string
  method: string
  uriPath: string
  body: string
}) {
  const timestamp = new Date().toISOString()
  const normalizedMethod = method.toUpperCase()
  const data = body || ''
  const hashString = `${apiKey}|${normalizedMethod}|${uriPath}|${data}|${timestamp}`
  const hash = crypto.createHmac('sha512', apiSecret).update(hashString).digest('hex')

  return { timestamp, hash }
}

function normalizeCcvProduct(product: any): CCVProduct {
  return {
    id: String(product?.id ?? product?.product_id ?? ''),
    name: product?.name ?? product?.title ?? '',
    price: Number(product?.price ?? product?.salesprice ?? 0),
    description: product?.shortdescription || product?.description || '',
    stock: typeof product?.stock === 'number' ? product.stock : undefined,
    sku: product?.productnumber || product?.sku || undefined,
    quantity: typeof product?.stock === 'number' ? product.stock : undefined
  }
}

