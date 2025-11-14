import { fetchCCVProducts } from '../../utils/ccvShop'

export default defineEventHandler(async (event) => {
  try {
    const products = await fetchCCVProducts()
    return { products }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch products'
    })
  }
})






