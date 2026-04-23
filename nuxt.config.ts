export default defineNuxtConfig({
  devtools: { enabled: true },
  
  ssr: false,
  
  future: {
    compatibilityVersion: 4,
  },
  
  experimental: {
    rolldown: true,
  },
  
  modules: [
    '@nuxt/icon',
    '@nuxt/fonts',
    '@vueuse/motion/nuxt',
  ],
  
  css: ['~/assets/scss/main.scss'],
  
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        },
      },
    },
  },
  
  app: {
    head: {
      title: 'Адодин Егор | ИТБД-124 | Лабораторные работы',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Сайт студента РГУ им. А.Н. Косыгина - Адодин Егор, группа ИТБД-124. Лабораторные работы по информационной безопасности.' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },
  
  compatibilityDate: '2025-01-01',
})
