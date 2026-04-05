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
								"Activity",
								"AlertCircle",
								"ArrowLeft",
								"ArrowRight",
								"Blocks",
								"Code",
								"Calendar",
								"Check",
								"ChevronDown",
								"ChevronRight",
								"ChevronsUpDown",
								"ExternalLink",
								"FileText",
								"Footprints",
								"Forward",
								"GalleryVerticalEnd",
								"Keyboard",
								"LineChart",
								"Link",
								"Maximize2",
								"Menu",
								"MessageCircleQuestion",
								"Mic",
								"MicOff",
								"MoreHorizontal",
								"MousePointerClick",
								"Pause",
								"Play",
								"RotateCw",
								"Search",
								"Settings",
								"Square",
								"Settings2",
								"Trash2",
								"TreePine",
								"TrendingDown",
								"TrendingUp",
								"VolumeX",
								"Waves",
							],
							message:
								'Use the stable "*Icon" exports from "@/components/ui/vpk-icons" instead of the Lucide-compat aliases.',
						},
					],
				},
			],
		},
	},
	{
		files: ["components/blocks/dashboard/components/data-table.tsx"],
		rules: {
			"react-hooks/incompatible-library": "off",
		},
	},
]);

export default eslintConfig;
