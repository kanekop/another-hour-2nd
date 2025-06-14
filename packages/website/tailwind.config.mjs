import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				'ah-blue': '#0066CC',
				'ah-dark': '#1a1a1a',
				'ah-light': '#f5f5f5',
			},
			fontFamily: {
				sans: ['Inter', 'Noto Sans JP', 'sans-serif'],
				jp: ['Noto Sans JP', 'sans-serif'],
			}
		},
	},
	plugins: [typography],
}; 