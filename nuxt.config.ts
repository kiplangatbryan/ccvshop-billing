// https://nuxt.com/docs/api/configuration/nuxt-config
import vuetify from 'vite-plugin-vuetify'

export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  plugins: ['~/plugins/vuetify'],
  css: ['@mdi/font/css/materialdesignicons.css', '~/assets/css/main.css'],
  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/zargar-invoice',
    ccvShopApiUrl: process.env.CCV_SHOP_API_URL || 'https://demo.ccvshop.nl/API',
    ccvShopApiKey: process.env.CCV_SHOP_API_KEY || '',
    ccvShopApiSecret: process.env.CCV_SHOP_API_SECRET || '',
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: Number(process.env.SMTP_PORT || 587),
    smtpUser: process.env.SMTP_USER || '',
    smtpPassword: process.env.SMTP_PASSWORD || '',
    smtpFromEmail: process.env.SMTP_FROM_EMAIL || 'no-reply@zargar-invoice.local',
    defaultAdminEmail: process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com',
    defaultAdminPassword: process.env.DEFAULT_ADMIN_PASSWORD || 'change-me',
    defaultAdminName: process.env.DEFAULT_ADMIN_NAME || 'System Admin',
    public: {
      apiBase: '/api'
    }
  },
  tailwindcss: {
    configPath: 'tailwind.config.ts'
  },
  build: {
    transpile: ['vuetify']
  },
  vite: {
    ssr: {
      noExternal: ['vuetify']
    },
    define: {
      'process.env.DEBUG': false
    },
    plugins: [
      vuetify()
    ]
  },
  app: {
    head: {
      title: 'Zargar Invoice Admin',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  }
})


