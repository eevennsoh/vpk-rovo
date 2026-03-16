import { z } from "zod";
import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react";

export { schema };

export const catalog = defineCatalog(schema, {
	components: {
		// ── Layout ──────────────────────────────────────────
		Stack: {
			props: z.object({
				direction: z.enum(["horizontal", "vertical"]).nullable(),
				gap: z.enum(["sm", "md", "lg"]).nullable(),
				align: z.enum(["start", "center", "end", "stretch"]).nullable(),
				justify: z.enum(["start", "center", "end", "between"]).nullable(),
				padding: z.number().nullable(),
				wrap: z.boolean().nullable(),
				className: z.string().nullable(),
			}),
			slots: ["default"],
			description: "Flex layout container with direction, gap, and alignment. Horizontal Stack defaults to nowrap; set wrap=true only for flowing layouts like tag groups or badge lists.",
			example: { direction: "vertical", gap: "md", align: null, justify: null, padding: null, wrap: null, className: null },
		},
		Card: {
			props: z.object({
				title: z.string().nullable(),
				description: z.string().nullable(),
				href: z.string().nullable(),
				className: z.string().nullable(),
			}),
			slots: ["default"],
			description: "Card container with optional title, description, and clickable link",
			example: { title: "Overview", description: "Summary of recent activity", href: null },
		},
		Grid: {
			props: z.object({
				columns: z.enum(["1", "2", "3", "4"]).nullable(),
				gap: z.enum(["sm", "md", "lg"]).nullable(),
				className: z.string().nullable(),
			}),
			slots: ["default"],
			description: "Responsive CSS grid layout container",
			example: { columns: "3", gap: "md" },
		},
		AspectRatio: {
			props: z.object({
				ratio: z.number(),
			}),
			slots: ["default"],
			description: "Layout container that maintains a fixed aspect ratio. Useful for image and video containers.",
			example: { ratio: 16 / 9 },
		},
		ScrollArea: {
			props: z.object({
				maxHeight: z.string().nullable(),
				className: z.string().nullable(),
			}),
			slots: ["default"],
			description: "Scrollable content area with custom scrollbars. Use maxHeight to constrain height (e.g. '300px').",
			example: { maxHeight: "300px" },
		},
		Carousel: {
			props: z.object({
				orientation: z.enum(["horizontal", "vertical"]).nullable(),
			}),
			slots: ["default"],
			description: "Content carousel with previous/next navigation. Each child becomes a slide.",
			example: { orientation: "horizontal" },
		},
		Breadcrumb: {
			props: z.object({
				items: z.array(
					z.object({
						label: z.string(),
						href: z.string().nullable(),
					}),
				),
			}),
			slots: [],
			description: "Breadcrumb navigation with links",
			example: {
				items: [
					{ label: "Home", href: "/" },
					{ label: "Settings", href: null },
				],
			},
		},
		PageHeader: {
			props: z.object({
				title: z.string(),
				description: z.string().nullable(),
			}),
			slots: [],
			description: "Page header with title and optional description",
			example: { title: "Dashboard", description: "Overview of key metrics" },
		},
		ButtonGroup: {
			props: z.object({
				orientation: z.enum(["horizontal", "vertical"]).nullable(),
			}),
			slots: ["default"],
			description: "Group of buttons with shared styling",
			example: { orientation: "horizontal" },
		},

		// ── Typography ─────────────────────────────────────
		Heading: {
			props: z.object({
				text: z.string(),
				level: z.enum(["h1", "h2", "h3", "h4"]).nullable(),
				className: z.string().nullable(),
			}),
			slots: [],
			description: "Section heading element. Do not append colons or punctuation to heading text.",
			example: { text: "Project Overview", level: "h2" },
		},
		Text: {
			props: z.object({
				content: z.string(),
				muted: z.boolean().nullable(),
				size: z.enum(["xs", "sm", "base"]).nullable(),
			}),
			slots: [],
			description: "Text content paragraph. Use muted for secondary text.",
			example: { content: "Here is your data overview.", muted: null, size: "sm" },
		},

		// ── Data Display ───────────────────────────────────
		Badge: {
			props: z.object({
				text: z.string(),
				variant: z.enum(["default", "neutral", "secondary", "destructive", "danger", "success", "warning", "info", "information", "discovery", "outline"]).nullable(),
			}),
			slots: [],
			description: "Status badge for labels and counts",
			example: { text: "New", variant: "default" },
		},
		Alert: {
			props: z.object({
				title: z.string().nullable(),
				description: z.string(),
				variant: z.enum(["default", "info", "warning", "success", "discovery", "danger", "error", "announcement", "destructive"]).nullable(),
			}),
			slots: [],
			description: "Alert message bar with status and announcement variants",
			example: { title: "Update available", description: "A new version is ready.", variant: "info" },
		},
		Banner: {
			props: z.object({
				text: z.string(),
				variant: z.enum(["warning", "error", "announcement"]).nullable(),
			}),
			slots: [],
			description: "Full-width status banner for critical warnings, errors, and announcements",
			example: { text: "Scheduled maintenance Saturday 2am-4am", variant: "warning" },
		},
		Separator: {
			props: z.object({
				orientation: z.enum(["horizontal", "vertical"]).nullable(),
			}),
			slots: [],
			description: "Visual divider line",
			example: { orientation: "horizontal" },
		},
		Metric: {
			props: z.object({
				label: z.string(),
				value: z.string(),
				detail: z.string().nullable(),
				trend: z.enum(["up", "down", "neutral"]).nullable(),
			}),
			slots: [],
			description: "Single metric display with label, value, and optional trend indicator",
			example: { label: "Revenue", value: "$48,250", detail: "+12.5% from last month", trend: "up" },
		},
		Table: {
			props: z.object({
				data: z.array(z.record(z.string(), z.unknown())),
				columns: z.array(
					z.object({
						key: z.string(),
						label: z.string(),
					}),
				),
				emptyMessage: z.string().nullable(),
			}),
			slots: [],
			description: 'Sortable data table. Use { "$state": "/path" } to bind read-only data from state.',
			example: {
				data: { $state: "/users" },
				columns: [
					{ key: "name", label: "Name" },
					{ key: "role", label: "Role" },
				],
			},
		},
		Link: {
			props: z.object({
				text: z.string(),
				href: z.string(),
			}),
			slots: [],
			description: "External link that opens in a new tab",
			example: { text: "View docs", href: "https://example.com" },
		},

		// ── Data Display (extended) ───────────────────────
		Avatar: {
			props: z.object({
				src: z.string().nullable(),
				fallback: z.string(),
				size: z.enum(["xs", "sm", "default", "lg", "xl", "2xl"]).nullable(),
				shape: z.enum(["circle", "square", "hexagon"]).nullable(),
			}),
			slots: [],
			description: "User avatar with image and fallback initials",
			example: { fallback: "JD", size: "default", src: null },
		},
		Lozenge: {
			props: z.object({
				text: z.string(),
				variant: z
					.enum([
						"neutral",
						"success",
						"danger",
						"information",
						"discovery",
						"warning",
						"accent-red",
						"accent-orange",
						"accent-yellow",
						"accent-lime",
						"accent-green",
						"accent-teal",
						"accent-blue",
						"accent-purple",
						"accent-magenta",
						"accent-gray",
					])
					.nullable(),
				isBold: z.boolean().nullable(),
			}),
			slots: [],
			description: "Status lozenge indicator for workflow states (e.g. In Progress, Done)",
			example: { text: "In Progress", variant: "information", isBold: true },
		},
		Tag: {
			props: z.object({
				text: z.string(),
				variant: z.enum(["default", "rounded", "success", "removed", "inprogress", "new", "moved"]).nullable(),
				color: z.enum(["standard", "gray", "grey", "green", "blue", "red", "purple", "discovery", "teal", "orange", "yellow", "lime", "magenta"]).nullable(),
			}),
			slots: [],
			description: "Display-only tag label for categories and labels",
			example: { text: "frontend", color: "blue" },
		},
		TagGroup: {
			props: z.object({}),
			slots: ["default"],
			description: "Flex wrapper for Tag components",
		},
		Spinner: {
			props: z.object({
				size: z.enum(["xs", "sm", "default", "lg", "xl"]).nullable(),
				label: z.string().nullable(),
			}),
			slots: [],
			description: "Loading spinner indicator",
			example: { size: "default", label: "Loading..." },
		},
		Code: {
			props: z.object({
				text: z.string(),
			}),
			slots: [],
			description: "Inline code snippet",
			example: { text: "npm install" },
		},
		CodeBlock: {
			props: z.object({
				code: z.string(),
				language: z.string().nullable(),
			}),
			slots: [],
			description: "Preformatted code block with optional syntax highlighting",
			example: { code: "const x = 42;", language: "typescript" },
		},
		Kbd: {
			props: z.object({
				text: z.string(),
			}),
			slots: [],
			description: "Keyboard key display",
			example: { text: "Ctrl+S" },
		},
		Image: {
			props: z.object({
				src: z.string(),
				alt: z.string(),
				width: z.number(),
				height: z.number(),
			}),
			slots: [],
			description: "Image display with native img element",
			example: { src: "/logo.png", alt: "Logo", width: 200, height: 100 },
		},
		Comment: {
			props: z.object({
				author: z.string(),
				avatarSrc: z.string().nullable(),
				time: z.string().nullable(),
				content: z.string(),
			}),
			slots: [],
			description: "Comment display with author, avatar, and timestamp",
			example: { author: "Jordan Davis", time: "2 hours ago", content: "Looks good to me!" },
		},
		SectionMessage: {
			props: z.object({
				title: z.string(),
				description: z.string().nullable(),
				appearance: z.enum(["default", "info", "warning", "success", "discovery", "danger", "error", "announcement", "destructive"]).nullable(),
			}),
			slots: [],
			description: "Section-level alert message for page-wide announcements",
			example: { title: "Maintenance scheduled", description: "Downtime Saturday 2am-4am.", appearance: "warning" },
		},
		EmptyState: {
			props: z.object({
				title: z.string(),
				description: z.string().nullable(),
			}),
			slots: [],
			description: "Empty state placeholder with title and description",
			example: { title: "No results", description: "Try adjusting your filters." },
		},
		ObjectTile: {
			props: z.object({
				title: z.string(),
				description: z.string().nullable(),
				href: z.string().nullable(),
			}),
			slots: [],
			description: "Clickable content tile with title and description",
			example: { title: "Getting Started", description: "Learn the basics", href: "/docs" },
		},
		IconTile: {
			props: z.object({
				label: z.string(),
				variant: z
					.enum([
						"gray",
						"blue",
						"teal",
						"green",
						"lime",
						"yellow",
						"orange",
						"red",
						"magenta",
						"purple",
						"grayBold",
						"blueBold",
						"tealBold",
						"greenBold",
						"limeBold",
						"yellowBold",
						"orangeBold",
						"redBold",
						"magentaBold",
						"purpleBold",
					])
					.nullable(),
				size: z.enum(["xsmall", "small", "medium", "large", "xlarge"]).nullable(),
				shape: z.enum(["square", "circle"]).nullable(),
			}),
			slots: [],
			description: "Colored icon tile with label",
			example: { label: "Settings", variant: "blue", size: "medium" },
		},
		MapWidget: {
			props: z.object({
				center: z.object({
					lat: z.number(),
					lng: z.number(),
				}),
				zoom: z.number().nullable(),
				height: z.number().nullable(),
				selectedMarkerId: z.string().nullable(),
				markers: z
					.array(
						z.object({
							id: z.string(),
							lat: z.number(),
							lng: z.number(),
							title: z.string(),
							description: z.string().nullable(),
						}),
					)
					.nullable(),
			}),
			slots: [],
			description: "Leaflet/OpenStreetMap map with selectable markers and optional detail state. Use for maps, locations, pins, and directions.",
			example: {
				center: { lat: 40.7, lng: -74.0 },
				zoom: 12,
				markers: [{ id: "1", lat: 40.7, lng: -74.0, title: "New York", description: null }],
			},
		},

		// ── Compound ──────────────────────────────────────
		FigmaDesignContext: {
			props: z.object({
				title: z.string().nullable(),
				description: z.string().nullable(),
				figmaUrl: z.string().nullable(),
				code: z.string().nullable(),
				codeLanguage: z.string().nullable(),
				links: z.array(
					z.object({
						text: z.string(),
						href: z.string(),
					}),
				),
			}),
			slots: [],
			description:
				"Figma design context card. Renders extracted code with syntax highlighting, a link back to Figma, and resource links. Use for Figma MCP tool results.",
		},

		WorkSummary: {
			props: z.object({
				jiraItems: z.array(
					z.object({
						key: z.string(),
						summary: z.string(),
						status: z.string(),
						statusCategory: z.enum(["done", "inprogress", "todo", "blocked"]).nullable(),
						priority: z.string().nullable(),
						type: z.string().nullable(),
						url: z.string().nullable(),
						updated: z.string().nullable(),
					}),
				),
				confluencePages: z.array(
					z.object({
						title: z.string(),
						space: z.string().nullable(),
						url: z.string().nullable(),
						lastModified: z.string().nullable(),
					}),
				),
			}),
			slots: [],
			description:
				"Work summary dashboard. Renders metrics grid, bar chart comparing Work Items vs Pages, and tabbed detail lists. Use for 'last N days of work' summaries.",
		},

		// ── Charts ─────────────────────────────────────────
		BarChart: {
			props: z.object({
				title: z.string().nullable(),
				data: z.array(z.record(z.string(), z.unknown())),
				xKey: z.string(),
				yKey: z.string(),
				aggregate: z.enum(["sum", "count", "avg"]).nullable(),
				color: z.string().nullable(),
				height: z.number().nullable(),
			}),
			slots: [],
			description: 'Bar chart visualization. Use { "$state": "/path" } to bind data. xKey is the category field, yKey is the numeric value field. Use aggregate to group by xKey.',
			example: {
				title: "Sales by Region",
				data: [
					{ region: "North", revenue: 4500 },
					{ region: "South", revenue: 3200 },
				],
				xKey: "region",
				yKey: "revenue",
			},
		},
		LineChart: {
			props: z.object({
				title: z.string().nullable(),
				data: z.array(z.record(z.string(), z.unknown())),
				xKey: z.string(),
				yKey: z.string(),
				aggregate: z.enum(["sum", "count", "avg"]).nullable(),
				color: z.string().nullable(),
				height: z.number().nullable(),
			}),
			slots: [],
			description: 'Line chart visualization. Use { "$state": "/path" } to bind data. xKey is the x-axis field, yKey is the numeric value field.',
			example: {
				title: "Weekly Visitors",
				data: [
					{ week: "W1", visitors: 1200 },
					{ week: "W2", visitors: 1800 },
				],
				xKey: "week",
				yKey: "visitors",
			},
		},
		PieChart: {
			props: z.object({
				title: z.string().nullable(),
				data: z.array(z.record(z.string(), z.unknown())),
				nameKey: z.string(),
				valueKey: z.string(),
				height: z.number().nullable(),
			}),
			slots: [],
			description: 'Pie/donut chart for proportional data. Use { "$state": "/path" } to bind data. nameKey is the label field, valueKey is the numeric value field.',
			example: {
				title: "Traffic Sources",
				data: [
					{ source: "Direct", visits: 4000 },
					{ source: "Organic", visits: 3200 },
				],
				nameKey: "source",
				valueKey: "visits",
			},
		},
		AreaChart: {
			props: z.object({
				title: z.string().nullable(),
				data: z.array(z.record(z.string(), z.unknown())),
				xKey: z.string(),
				yKey: z.string(),
				aggregate: z.enum(["sum", "count", "avg"]).nullable(),
				color: z.string().nullable(),
				height: z.number().nullable(),
			}),
			slots: [],
			description: 'Area chart visualization. Use { "$state": "/path" } to bind data. xKey is the x-axis field, yKey is the numeric value field.',
			example: {
				title: "Revenue Over Time",
				data: [
					{ month: "Jan", revenue: 4200 },
					{ month: "Feb", revenue: 5100 },
				],
				xKey: "month",
				yKey: "revenue",
			},
		},
		RadarChart: {
			props: z.object({
				data: z.array(z.record(z.string(), z.unknown())),
				dataKey: z.string(),
				categories: z.array(z.string()),
				colors: z.array(z.string()).nullable(),
				title: z.string().nullable(),
			}),
			slots: [],
			description: "Radar/spider chart for multi-dimensional comparison",
			example: {
				title: "Team Skills",
				data: [
					{ skill: "Frontend", score: 85 },
					{ skill: "Backend", score: 72 },
				],
				dataKey: "skill",
				categories: ["score"],
			},
		},

		// ── Interactive ────────────────────────────────────
		Tabs: {
			props: z.object({
				tabs: z.array(
					z.object({
						value: z.string(),
						label: z.string(),
					}),
				),
				defaultValue: z.string().nullable(),
			}),
			slots: ["default"],
			description: "Tabbed content container. Children should be TabContent elements matching tab values.",
			example: {
				tabs: [
					{ value: "overview", label: "Overview" },
					{ value: "details", label: "Details" },
				],
				defaultValue: "overview",
			},
		},
		TabContent: {
			props: z.object({
				value: z.string(),
			}),
			slots: ["default"],
			description: "Content panel for a specific tab. The value must match a tab value from the parent Tabs.",
			example: { value: "overview" },
		},
		Progress: {
			props: z.object({
				value: z.number(),
				max: z.number().nullable(),
				label: z.string().nullable(),
			}),
			slots: [],
			description: "Progress bar with value/max",
			example: { value: 65, max: 100, label: "Upload progress" },
		},
		Skeleton: {
			props: z.object({
				width: z.string().nullable(),
				height: z.string().nullable(),
				className: z.string().nullable(),
			}),
			slots: [],
			description: "Loading placeholder skeleton",
			example: { width: "100%", height: "20px" },
		},
		Callout: {
			props: z.object({
				title: z.string().nullable(),
				content: z.string(),
				type: z.enum(["info", "warning", "success", "error"]).nullable(),
				icon: z.string().nullable(),
			}),
			slots: [],
			description: "Highlighted callout box for tips, warnings, notes, or key information",
			example: { type: "info", title: "Note", content: "Always include pagination metadata in list responses." },
		},
		Accordion: {
			props: z.object({
				items: z.array(
					z.object({
						title: z.string(),
						content: z.string(),
					}),
				),
			}),
			slots: [],
			description: "Collapsible accordion sections for organizing detailed content",
			example: { items: [{ title: "Overview", content: "A brief introduction to the topic." }] },
		},
		AccordionForm: {
			props: z.object({
				items: z.array(
					z.object({
						value: z.string(),
						title: z.string(),
					}),
				),
				defaultOpenValues: z.array(z.string()).nullable(),
			}),
			slots: ["default"],
			description: "Interactive accordion with children slots. Each child corresponds to a section's content. Use for forms, inputs, and mixed interactive content inside collapsible sections.",
			example: {
				items: [
					{ value: "section-1", title: "Personal Info" },
					{ value: "section-2", title: "Preferences" },
				],
				defaultOpenValues: ["section-1"],
			},
		},
		Timeline: {
			props: z.object({
				items: z.array(
					z.object({
						title: z.string(),
						description: z.string().nullable(),
						date: z.string().nullable(),
						status: z.enum(["completed", "current", "upcoming"]).nullable(),
					}),
				),
			}),
			slots: [],
			description: "Vertical timeline showing ordered events, steps, or historical milestones",
			example: {
				items: [
					{ title: "Planning", description: "Define requirements", date: "Jan 2025", status: "completed" },
					{ title: "Development", description: "Build features", date: "Feb 2025", status: "current" },
				],
			},
		},
		CalendarTimeline: {
			props: z.object({
				events: z.array(
					z.object({
						time: z.string(),
						title: z.string(),
						duration: z.string().nullable(),
						location: z.string().nullable(),
						color: z.enum(["blue", "green", "red", "purple", "yellow", "teal"]).nullable(),
						status: z.enum(["past", "current", "upcoming"]).nullable(),
					}),
				),
			}),
			slots: [],
			description: "Vertical timeline of calendar events with colored time indicators and connecting lines between meetings",
			example: {
				events: [
					{ time: "9:00 AM", title: "Daily Standup", duration: "30 min", location: "Zoom", color: "blue", status: "past" },
					{ time: "10:00 AM", title: "Sprint Planning", duration: "1 hr", location: "Room 3A", color: "green", status: "current" },
				],
			},
		},
		RadioGroup: {
			props: z.object({
				options: z.array(
					z.object({
						label: z.string(),
						value: z.string(),
					}),
				),
				value: z.string().nullable(),
				label: z.string().nullable(),
			}),
			slots: [],
			description: 'Radio button group for single selection. Use { "$bindState": "/path" } for two-way binding.',
			example: {
				label: "Choose one",
				value: { $bindState: "/answer" },
				options: [
					{ value: "a", label: "Option A" },
					{ value: "b", label: "Option B" },
				],
			},
		},
		SelectInput: {
			props: z.object({
				options: z.array(
					z.object({
						label: z.string(),
						value: z.string(),
					}),
				),
				value: z.string().nullable(),
				placeholder: z.string().nullable(),
				label: z.string().nullable(),
			}),
			slots: [],
			description: 'Dropdown select input. Use { "$bindState": "/path" } for two-way binding. Use when there are many options.',
			example: {
				label: "Country",
				value: { $bindState: "/selectedCountry" },
				placeholder: "Select a country",
				options: [
					{ value: "us", label: "United States" },
					{ value: "uk", label: "United Kingdom" },
				],
			},
		},
		TextInput: {
			props: z.object({
				placeholder: z.string().nullable(),
				value: z.string().nullable(),
				label: z.string().nullable(),
				type: z.enum(["text", "email", "password", "number", "url"]).nullable(),
			}),
			slots: [],
			description: 'Text input field. Use { "$bindState": "/path" } for two-way binding.',
			example: {
				label: "Your name",
				value: { $bindState: "/userName" },
				placeholder: "Enter your name",
				type: "text",
			},
		},
		Button: {
			props: z.object({
				label: z.string(),
				variant: z.enum(["default", "destructive", "outline", "secondary", "ghost", "link", "warning", "discovery"]).nullable(),
				size: z.enum(["default", "xs", "sm", "lg", "icon"]).nullable(),
				disabled: z.boolean().nullable(),
			}),
			slots: [],
			description: "Clickable button. Use with on.press to trigger actions like setState, pushState, etc.",
			example: { label: "Submit", variant: "default", size: "default", disabled: null },
		},
		Checkbox: {
			props: z.object({
				checked: z.boolean().nullable(),
				label: z.string().nullable(),
				disabled: z.boolean().nullable(),
			}),
			slots: [],
			description: 'Checkbox toggle with label. Use { "$bindState": "/path" } for two-way binding.',
			example: { label: "Accept terms", checked: { $bindState: "/accepted" } },
		},
		Switch: {
			props: z.object({
				checked: z.boolean().nullable(),
				label: z.string().nullable(),
				size: z.enum(["sm", "default", "lg"]).nullable(),
				disabled: z.boolean().nullable(),
			}),
			slots: [],
			description: 'Toggle switch with label. Use { "$bindState": "/path" } for two-way binding.',
			example: { label: "Enable notifications", checked: { $bindState: "/notificationsEnabled" } },
		},
		TextArea: {
			props: z.object({
				placeholder: z.string().nullable(),
				value: z.string().nullable(),
				label: z.string().nullable(),
				rows: z.number().nullable(),
			}),
			slots: [],
			description: 'Multi-line text input. Use { "$bindState": "/path" } for two-way binding.',
			example: { label: "Comments", placeholder: "Enter your comments", rows: 4 },
		},
		Slider: {
			props: z.object({
				value: z.number().nullable(),
				min: z.number().nullable(),
				max: z.number().nullable(),
				step: z.number().nullable(),
				label: z.string().nullable(),
			}),
			slots: [],
			description: 'Range slider input. Use { "$bindState": "/path" } for two-way binding.',
			example: { label: "Volume", value: { $bindState: "/volume" }, min: 0, max: 100, step: 5 },
		},
		Toggle: {
			props: z.object({
				text: z.string(),
				pressed: z.boolean().nullable(),
				variant: z.enum(["default", "outline"]).nullable(),
				size: z.enum(["default", "sm", "lg"]).nullable(),
			}),
			slots: [],
			description: "Toggle button with pressed state",
			example: { text: "Bold", pressed: false, variant: "outline" },
		},
		ToggleGroup: {
			props: z.object({
				options: z.array(
					z.object({
						label: z.string(),
						value: z.string(),
					}),
				),
				value: z.string().nullable(),
				type: z.enum(["single", "multiple"]).nullable(),
			}),
			slots: [],
			description: "Group of toggle buttons for selection",
			example: {
				options: [
					{ label: "Left", value: "left" },
					{ label: "Center", value: "center" },
				],
				type: "single",
			},
		},
		ProgressBar: {
			props: z.object({
				value: z.number(),
				label: z.string().nullable(),
				appearance: z.enum(["default", "success", "inverse", "transparent"]).nullable(),
			}),
			slots: [],
			description: "Styled progress bar with variant",
			example: { value: 75, label: "Storage used", appearance: "default" },
		},
		ProgressTracker: {
			props: z.object({
				steps: z.array(
					z.object({
						id: z.string(),
						label: z.string(),
						state: z.enum(["todo", "current", "done"]).nullable(),
					}),
				),
			}),
			slots: [],
			description: "Vertical step tracker showing ordered steps with todo/current/done states. Use for multi-step workflows, onboarding checklists, and process tracking.",
			example: {
				steps: [
					{ id: "step-1", label: "Create account", state: "done" },
					{ id: "step-2", label: "Verify email", state: "current" },
					{ id: "step-3", label: "Set up profile", state: "todo" },
				],
			},
		},
		// ── Overlay & Trigger ─────────────────────────────
		Collapsible: {
			props: z.object({
				title: z.string(),
				defaultOpen: z.boolean().nullable(),
			}),
			slots: ["default"],
			description: "Simple collapsible section with trigger and content. Simpler than Accordion for single sections.",
			example: { title: "Show details", defaultOpen: false },
		},
		Tooltip: {
			props: z.object({
				text: z.string(),
			}),
			slots: ["default"],
			description: "Tooltip that shows text on hover. Wraps its child element as the trigger.",
			example: { text: "More information about this item" },
		},
		Dialog: {
			props: z.object({
				triggerLabel: z.string(),
				title: z.string().nullable(),
				description: z.string().nullable(),
				size: z.enum(["sm", "md", "lg", "xl"]).nullable(),
				triggerVariant: z.enum(["default", "destructive", "outline", "secondary", "ghost", "link"]).nullable(),
			}),
			slots: ["default"],
			description: "Modal dialog triggered by a button. Children become the dialog body content.",
			example: { triggerLabel: "Open settings", title: "Settings", description: "Configure your preferences", size: "md" },
		},

		// ── Form Inputs (extended) ────────────────────────
		DatePicker: {
			props: z.object({
				value: z.string().nullable(),
				placeholder: z.string().nullable(),
				label: z.string().nullable(),
				disabled: z.boolean().nullable(),
			}),
			slots: [],
			description: 'Date picker input. Value is an ISO date string (YYYY-MM-DD). Use { "$bindState": "/path" } for two-way binding.',
			example: { label: "Start date", value: { $bindState: "/startDate" }, placeholder: "Select date" },
		},
		TimePicker: {
			props: z.object({
				value: z.string().nullable(),
				placeholder: z.string().nullable(),
				label: z.string().nullable(),
				stepMinutes: z.enum(["15", "30", "60"]).nullable(),
				disabled: z.boolean().nullable(),
			}),
			slots: [],
			description: 'Time picker dropdown with configurable step intervals. Value is HH:MM format. Use { "$bindState": "/path" } for two-way binding.',
			example: { label: "Start time", value: { $bindState: "/startTime" }, placeholder: "Select time", stepMinutes: "30" },
		},
		DateTimePicker: {
			props: z.object({
				date: z.string().nullable(),
				time: z.string().nullable(),
				label: z.string().nullable(),
				disabled: z.boolean().nullable(),
			}),
			slots: [],
			description: 'Combined date and time picker. Date is ISO (YYYY-MM-DD), time is HH:MM. Use { "$bindState": "/path" } for two-way binding on date and time independently.',
			example: { label: "Event start", date: { $bindState: "/eventDate" }, time: { $bindState: "/eventTime" } },
		},
		InlineEdit: {
			props: z.object({
				value: z.string().nullable(),
				label: z.string().nullable(),
				placeholder: z.string().nullable(),
			}),
			slots: [],
			description: 'Click-to-edit text field with confirm/cancel buttons. Use { "$bindState": "/path" } for two-way binding.',
			example: { label: "Project name", value: { $bindState: "/projectName" }, placeholder: "Click to edit" },
		},
		InputOTP: {
			props: z.object({
				value: z.string().nullable(),
				length: z.number(),
				label: z.string().nullable(),
			}),
			slots: [],
			description: 'OTP/verification code input with individual character slots. Use { "$bindState": "/path" } for two-way binding.',
			example: { label: "Verification code", value: { $bindState: "/otp" }, length: 6 },
		},
		Calendar: {
			props: z.object({
				selected: z.string().nullable(),
				label: z.string().nullable(),
			}),
			slots: [],
			description: 'Standalone calendar for date selection. Selected is an ISO date string (YYYY-MM-DD). Use { "$bindState": "/path" } for two-way binding.',
			example: { selected: { $bindState: "/selectedDate" }, label: "Pick a date" },
		},

		// ── Navigation ────────────────────────────────────
		Pagination: {
			props: z.object({
				currentPage: z.number(),
				totalPages: z.number(),
			}),
			slots: [],
			description: 'Page navigation with previous/next and numbered pages. Use { "$bindState": "/path" } on currentPage for two-way binding.',
			example: { currentPage: { $bindState: "/page" }, totalPages: 10 },
		},

		// ── 3D ─────────────────────────────────────────────
		Scene3D: {
			props: z.object({
				background: z.string().nullable(),
				cameraPosition: z.tuple([z.number(), z.number(), z.number()]).nullable(),
				height: z.string().nullable(),
				orbitControls: z.boolean().nullable(),
			}),
			slots: ["default"],
			description: "3D scene container with camera and controls. All 3D components must be children of a Scene3D.",
			example: { height: "400px", background: "#111111", cameraPosition: [0, 10, 30] },
		},
		Group3D: {
			props: z.object({
				position: z.tuple([z.number(), z.number(), z.number()]).nullable(),
				rotation: z.tuple([z.number(), z.number(), z.number()]).nullable(),
				animate: z
					.object({
						rotateY: z.number().nullable(),
						rotateX: z.number().nullable(),
					})
					.nullable(),
			}),
			slots: ["default"],
			description: "3D group / transform node with optional animation. Use to create orbits by animating rotation.",
		},
		Box: {
			props: z.object({
				position: z.tuple([z.number(), z.number(), z.number()]).nullable(),
				size: z.tuple([z.number(), z.number(), z.number()]).nullable(),
				color: z.string().nullable(),
			}),
			slots: [],
			description: "3D box primitive",
		},
		Sphere: {
			props: z.object({
				position: z.tuple([z.number(), z.number(), z.number()]).nullable(),
				radius: z.number().nullable(),
				color: z.string().nullable(),
			}),
			slots: [],
			description: "3D sphere primitive",
		},
		Cylinder: {
			props: z.object({
				position: z.tuple([z.number(), z.number(), z.number()]).nullable(),
				radiusTop: z.number().nullable(),
				radiusBottom: z.number().nullable(),
				height: z.number().nullable(),
				color: z.string().nullable(),
			}),
			slots: [],
			description: "3D cylinder primitive",
		},
		Cone: {
			props: z.object({
				position: z.tuple([z.number(), z.number(), z.number()]).nullable(),
				radius: z.number().nullable(),
				height: z.number().nullable(),
				color: z.string().nullable(),
			}),
			slots: [],
			description: "3D cone primitive",
		},
		Torus: {
			props: z.object({
				position: z.tuple([z.number(), z.number(), z.number()]).nullable(),
				radius: z.number().nullable(),
				tube: z.number().nullable(),
				color: z.string().nullable(),
			}),
			slots: [],
			description: "3D torus primitive",
		},
		Plane: {
			props: z.object({
				position: z.tuple([z.number(), z.number(), z.number()]).nullable(),
				size: z.tuple([z.number(), z.number()]).nullable(),
				color: z.string().nullable(),
				rotation: z.tuple([z.number(), z.number(), z.number()]).nullable(),
			}),
			slots: [],
			description: "3D plane primitive",
		},
		Ring: {
			props: z.object({
				position: z.tuple([z.number(), z.number(), z.number()]).nullable(),
				innerRadius: z.number().nullable(),
				outerRadius: z.number().nullable(),
				color: z.string().nullable(),
				rotation: z.tuple([z.number(), z.number(), z.number()]).nullable(),
			}),
			slots: [],
			description: "3D ring / annulus primitive",
		},
		AmbientLight: {
			props: z.object({
				intensity: z.number().nullable(),
				color: z.string().nullable(),
			}),
			slots: [],
			description: "Ambient light illuminating all objects equally",
		},
		PointLight: {
			props: z.object({
				position: z.tuple([z.number(), z.number(), z.number()]).nullable(),
				intensity: z.number().nullable(),
				color: z.string().nullable(),
			}),
			slots: [],
			description: "Point light source",
		},
		DirectionalLight: {
			props: z.object({
				position: z.tuple([z.number(), z.number(), z.number()]).nullable(),
				intensity: z.number().nullable(),
				color: z.string().nullable(),
			}),
			slots: [],
			description: "Directional light (like sunlight)",
		},
		Stars: {
			props: z.object({
				count: z.number().nullable(),
				radius: z.number().nullable(),
				depth: z.number().nullable(),
			}),
			slots: [],
			description: "Starfield background for 3D scenes",
		},
		Label3D: {
			props: z.object({
				text: z.string(),
				position: z.tuple([z.number(), z.number(), z.number()]).nullable(),
				color: z.string().nullable(),
				fontSize: z.number().nullable(),
			}),
			slots: [],
			description: "3D floating text label",
		},
	},
	actions: {
		push: {
			params: z.object({
				screen: z.string(),
			}),
			description: "Push a screen onto a simple navigation stack in state",
		},
		pop: {
			params: z.object({}),
			description: "Pop the last screen from navigation stack and restore current screen",
		},
	},
});
