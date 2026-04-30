// Tailwind v4 uses a single PostCSS plugin. All other theme configuration
// (colors, durations, easing) lives in app/tailwind-theme.css via `@theme inline`.
const postcssConfig = {
	plugins: ["@tailwindcss/postcss"],
};

export default postcssConfig;
