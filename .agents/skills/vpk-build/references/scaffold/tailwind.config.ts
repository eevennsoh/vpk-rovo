import type { Config } from "tailwindcss";

// Tailwind v4 does not require explicit theme config here — see
// `app/tailwind-theme.css` which defines semantic tokens via `@theme inline`.
// We only need to tell Tailwind where to scan for class usage.
export default {
	content: [
		"./app/**/*.{ts,tsx,js,jsx,mdx}",
		"./components/**/*.{ts,tsx,js,jsx,mdx}",
		"./lib/**/*.{ts,tsx,js,jsx,mdx}",
		"./hooks/**/*.{ts,tsx,js,jsx,mdx}",
	],
} satisfies Config;
