import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
	...nextVitals,
	...nextTs,
	// Override default ignores of eslint-config-next.
	globalIgnores([
		// Default ignores of eslint-config-next:
		".next/**",
		"out/**",
		"build/**",
		".expect/**",
		".venv/**",
		"next-env.d.ts",
		// Generated runtime assets; linting bundled vendor code is noisy and not actionable.
		"public/vad/**",
		"components/ui-ai/**",
		"components/blocks/dashboard/**",
		"components/blocks/sidebar/**",
		"components/blocks/login/**",
	]),
	{
		files: ["**/*.js", "**/*.cjs"],
		rules: {
			"@typescript-eslint/no-require-imports": "off",
		},
	},
	{
		files: ["app/**/*.ts", "app/**/*.tsx", "components/**/*.ts", "components/**/*.tsx"],
		rules: {
			"no-restricted-imports": [
				"error",
				{
					paths: [
						{
							name: "lucide-react",
							message:
								'Use "@/components/ui/vpk-icons" or direct "@atlaskit/icon" imports instead of "lucide-react".',
						},
						{
							name: "@/components/ui/vpk-icons",
							importNames: [
								"Blocks",
								"Calendar",
								"FileText",
								"Forward",
								"Keyboard",
								"LineChart",
								"Link",
								"Menu",
								"MessageCircleQuestion",
								"Settings2",
							],
							message:
								'Use the stable "*Icon" exports from "@/components/ui/vpk-icons" instead of the Lucide-compat aliases.',
						},
					],
				},
			],
		},
	},
]);

export default eslintConfig;
