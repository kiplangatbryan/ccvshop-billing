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

/**
 * CCV Shop API Product Filters
 * Based on CCV Shop API documentation: https://demo.ccvshop.nl/API/Docs/
 * 
 * Confirmed supported parameters:
 * - productnumber: Filter by product number (e.g., ?productnumber=PROD001)
 * 
 * Additional parameters may be supported - these will be passed through to the API:
 * - name, search, start, size, orderby, etc.
 */
export interface CCVProductFilters {
  /** Filter by product number (confirmed supported by CCV Shop API) */
  productnumber?: string
  /** Filter by product name (may be supported) */
  name?: string
  /** Search parameter (may be supported) */
  search?: string
  /** Pagination start index (may be supported) */
  start?: number
  /** Number of results per page (may be supported) */
  size?: number
  /** Sort order (may be supported) */
  orderby?: string
  /** Allow any additional query parameters to be passed through */
  [key: string]: string | number | undefined
}

export async function fetchCCVProducts(filters?: CCVProductFilters): Promise<CCVProduct[]> {
  const config = useRuntimeConfig()
  const log = logger.child({ context: { service: 'ccvShop', operation: 'fetchProducts', filters } })

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

    // Build query string from filters
    const queryParams = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value))
        }
      })
    }
    
    const queryString = queryParams.toString()
    const uriPath = `/api/rest/v1/products${queryString ? `?${queryString}` : ''}`
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

/**
 * Fetch a single product by ID from CCV Shop API
 * This can be used to get complete product information including stock
 */
export async function fetchCCVProductById(productId: string): Promise<CCVProduct | null> {
  const config = useRuntimeConfig()
  const log = logger.child({ context: { service: 'ccvShop', operation: 'fetchProductById', productId } })

  try {
    const apiDomain = (config.ccvShopApiUrl || '').replace(/\/$/, '')
    const apiKey = config.ccvShopApiKey
    const apiSecret = config.ccvShopApiSecret

    if (!apiDomain || !apiKey || !apiSecret) {
      log.error('Missing CCV Shop credentials')
      return null
    }

    const uriPath = `/api/rest/v1/products/${productId}`
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

    if (response) {
      return normalizeCcvProduct(response)
    }
    return null
  } catch (error) {
    log.error('Error fetching product by ID', { error })
    return null
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

    // CCV Shop API typically returns the updated product object on success
    // Check if response indicates success (has product data or stock field)
    const success = Boolean(
      response && (
        response.stock !== undefined ||
        response.id ||
        response.product_id ||
        (typeof response === 'object' && Object.keys(response).length > 0)
      )
    )

    if (success) {
      log.info('Successfully updated product stock in CCV Shop', {
        productId,
        newStock: quantity,
        response: response?.stock !== undefined ? { stock: response.stock } : 'updated'
      })
    } else {
      log.warn('CCV Shop API response indicates possible failure', {
        productId,
        response
      })
    }

    return success
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
  // CCV Shop API may return stock in different fields:
  // - stock: direct stock field
  // - quantity: alternative field name
  // - stockquantity: another possible field name
  // - available: availability flag
  const stockValue = 
    typeof product?.stock === 'number' ? product.stock :
    typeof product?.quantity === 'number' ? product.quantity :
    typeof product?.stockquantity === 'number' ? product.stockquantity :
    typeof product?.stock === 'string' && !isNaN(Number(product.stock)) ? Number(product.stock) :
    undefined

  return {
    id: String(product?.id ?? product?.product_id ?? ''),
    name: product?.name ?? product?.title ?? '',
    price: Number(product?.price ?? product?.salesprice ?? 0),
    description: product?.shortdescription || product?.description || '',
    stock: stockValue,
    sku: product?.productnumber || product?.sku || undefined,
    quantity: stockValue
  }
}

