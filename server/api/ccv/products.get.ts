import { fetchCCVProducts, type CCVProductFilters } from '../../utils/ccvShop'

/**
 * GET /api/ccv/products
 * 
 * Fetch products from CCV Shop API with optional filtering
 * 
 * Query Parameters (based on CCV Shop API documentation):
 * - productnumber: Filter by product number (confirmed supported)
 * - Additional parameters: Any other query parameters will be passed through to CCV Shop API
 * 
 * Examples:
 * - GET /api/ccv/products?productnumber=PROD001
 * - GET /api/ccv/products?productnumber=896617478
 */
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    
    // Build filters from query parameters
    // CCV Shop API confirmed supports: productnumber
    // Other parameters are passed through but may not all be supported
    const filters: CCVProductFilters = {}
    
    // Confirmed supported by CCV Shop API documentation
    if (query.productnumber && typeof query.productnumber === 'string') {
      filters.productnumber = query.productnumber
    }
    
    // Additional parameters (may be supported, passed through to API)
    if (query.name && typeof query.name === 'string') {
      filters.name = query.name
    }
    
    if (query.search && typeof query.search === 'string') {
      filters.search = query.search
    }
    
    if (query.start) {
      const start = Number(query.start)
      if (!isNaN(start) && start >= 0) {
        filters.start = start
      }
    }
    
    if (query.size) {
      const size = Number(query.size)
      if (!isNaN(size) && size > 0) {
        filters.size = size
      }
    }
    
    if (query.orderby && typeof query.orderby === 'string') {
      filters.orderby = query.orderby
    }
    
    // Allow any additional query parameters to be passed through to CCV Shop API
    Object.keys(query).forEach(key => {
      if (!['productnumber', 'name', 'search', 'start', 'size', 'orderby'].includes(key)) {
        const value = query[key]
        if (value && typeof value === 'string') {
          filters[key] = value
        }
      }
    })
    
    const products = await fetchCCVProducts(Object.keys(filters).length > 0 ? filters : undefined)
    
    return { 
      products,
      count: products.length,
      filters: Object.keys(filters).length > 0 ? filters : undefined
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch products'
    })
  }
})






