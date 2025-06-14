// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import i18n from 'astro-i18n';

// https://astro.build/config
export default defineConfig({
  integrations: [
    tailwind(),
    i18n({
      defaultLocale: 'ja',
      locales: ['ja', 'en'],
      routing: {
        prefixDefaultLocale: false,
      },
    }),
  ],
});