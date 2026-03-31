"use client";

import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

const PRODUCTS = [
	{
		name: "iPhone",
		description:
			"The revolutionary smartphone that redefined mobile computing with its multi-touch interface and App Store ecosystem.",
		year: 2007,
		icon: "📱",
	},
	{
		name: "Mac",
		description:
			"Apple's line of personal computers, from the original Macintosh to today's Apple Silicon-powered machines.",
		year: 1984,
		icon: "💻",
	},
	{
		name: "iPad",
		description:
			"A tablet that created an entirely new category of device, bridging the gap between smartphone and laptop.",
		year: 2010,
		icon: "📲",
	},
	{
		name: "Apple Watch",
		description:
			"The world's most popular smartwatch, combining health monitoring, fitness tracking, and seamless connectivity.",
		year: 2015,
		icon: "⌚",
	},
	{
		name: "AirPods",
		description:
			"Wireless earbuds that set the standard for truly wireless audio with seamless device switching and spatial audio.",
		year: 2016,
		icon: "🎧",
	},
	{
		name: "Apple Vision Pro",
		description:
			"A spatial computing device that blends digital content with the physical world through advanced AR/VR technology.",
		year: 2024,
		icon: "🥽",
	},
];

const MILESTONES = [
	{ year: 1976, event: "Apple Computer Company founded by Steve Jobs, Steve Wozniak, and Ronald Wayne" },
	{ year: 1984, event: "Macintosh introduced with its iconic '1984' Super Bowl commercial" },
	{ year: 1997, event: "Steve Jobs returns to Apple; launches the 'Think Different' campaign" },
	{ year: 2001, event: "iPod and iTunes revolutionize the music industry" },
	{ year: 2007, event: "iPhone launches, redefining the smartphone market forever" },
	{ year: 2008, event: "App Store opens, creating a new software economy" },
	{ year: 2010, event: "iPad creates the modern tablet category" },
	{ year: 2015, event: "Apple Watch enters the wearable technology market" },
	{ year: 2020, event: "Apple Silicon (M1 chip) marks the transition from Intel processors" },
	{ year: 2024, event: "Apple Vision Pro introduces spatial computing" },
];

export default function ApplePage() {
	return (
		<div
			className="min-h-screen bg-surface"
			style={{ fontFamily: "var(--ds-font-family-sans, var(--font-sans), sans-serif)" }}
		>
			{/* Hero Section */}
			<header
				className="relative overflow-hidden"
				style={{
					background: "linear-gradient(135deg, var(--ds-background-brand-bold, #0052CC) 0%, var(--ds-background-brand-boldest, #09326C) 100%)",
				}}
			>
				<div className="mx-auto max-w-5xl px-6 py-20 text-center">
					<div className="mb-6 text-7xl">🍎</div>
					<h1
						className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl"
						style={{ color: "var(--ds-text-inverse, #FFFFFF)" }}
					>
						Apple Inc.
					</h1>
					<p
						className="mx-auto max-w-2xl text-lg"
						style={{
							color: "var(--ds-text-inverse, #FFFFFF)",
							opacity: 0.85,
						}}
					>
						Think Different — From a garage in Cupertino to the world&apos;s most valuable company,
						Apple has been at the forefront of innovation for nearly five decades.
					</p>
				</div>
			</header>

			<main className="mx-auto max-w-5xl px-6 py-12">
				{/* Overview Section */}
				<section className="mb-16">
					<h2
						className="mb-6 text-2xl font-semibold"
						style={{ color: "var(--ds-text, #172B4D)" }}
					>
						Overview
					</h2>
					<div
						className="rounded-lg border p-6"
						style={{
							backgroundColor: "var(--ds-surface-raised, #FFFFFF)",
							borderColor: "var(--ds-border, #DFE1E6)",
							boxShadow: token("elevation.shadow.raised"),
						}}
					>
						<p
							className="mb-4 leading-relaxed"
							style={{ color: "var(--ds-text, #172B4D)" }}
						>
							Apple Inc. is an American multinational technology company headquartered in
							Cupertino, California. Founded in 1976 by Steve Jobs, Steve Wozniak, and Ronald Wayne,
							Apple designs, develops, and sells consumer electronics, computer software, and online
							services. It is considered one of the Big Five American information technology companies,
							alongside Alphabet (Google), Amazon, Meta, and Microsoft.
						</p>
						<p
							className="leading-relaxed"
							style={{ color: "var(--ds-text, #172B4D)" }}
						>
							Known for its focus on design, user experience, and a tightly integrated ecosystem of
							hardware and software, Apple has consistently pushed the boundaries of personal
							technology. The company&apos;s products and services — including the iPhone, Mac, iPad,
							Apple Watch, and services like iCloud, Apple Music, and the App Store — have
							fundamentally shaped modern digital life.
						</p>
					</div>
				</section>

				{/* Key Stats */}
				<section className="mb-16">
					<h2
						className="mb-6 text-2xl font-semibold"
						style={{ color: "var(--ds-text, #172B4D)" }}
					>
						By the Numbers
					</h2>
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
						{[
							{ label: "Founded", value: "1976" },
							{ label: "Employees", value: "164,000+" },
							{ label: "Revenue (2024)", value: "$391B" },
							{ label: "Active Devices", value: "2.2B+" },
						].map((stat) => (
							<div
								key={stat.label}
								className="rounded-lg border p-5 text-center"
								style={{
									backgroundColor: "var(--ds-surface-raised, #FFFFFF)",
									borderColor: "var(--ds-border, #DFE1E6)",
									boxShadow: token("elevation.shadow.raised"),
								}}
							>
								<div
									className="text-2xl font-bold"
									style={{ color: "var(--ds-text-brand, #0052CC)" }}
								>
									{stat.value}
								</div>
								<div
									className="mt-1 text-sm"
									style={{ color: "var(--ds-text-subtlest, #626F86)" }}
								>
									{stat.label}
								</div>
							</div>
						))}
					</div>
				</section>

				{/* Products Section */}
				<section className="mb-16">
					<h2
						className="mb-6 text-2xl font-semibold"
						style={{ color: "var(--ds-text, #172B4D)" }}
					>
						Iconic Products
					</h2>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{PRODUCTS.map((product) => (
							<div
								key={product.name}
								className={cn(
									"rounded-lg border p-5 transition-shadow hover:shadow-md"
								)}
								style={{
									backgroundColor: "var(--ds-surface-raised, #FFFFFF)",
									borderColor: "var(--ds-border, #DFE1E6)",
									boxShadow: token("elevation.shadow.raised"),
								}}
							>
								<div className="mb-3 text-3xl">{product.icon}</div>
								<h3
									className="mb-1 text-lg font-semibold"
									style={{ color: "var(--ds-text, #172B4D)" }}
								>
									{product.name}
								</h3>
								<span
									className="mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium"
									style={{
										backgroundColor: "var(--ds-background-neutral, #DFE1E6)",
										color: "var(--ds-text-subtle, #44546F)",
									}}
								>
									Since {product.year}
								</span>
								<p
									className="mt-2 text-sm leading-relaxed"
									style={{ color: "var(--ds-text-subtle, #44546F)" }}
								>
									{product.description}
								</p>
							</div>
						))}
					</div>
				</section>

				{/* Timeline Section */}
				<section className="mb-16">
					<h2
						className="mb-6 text-2xl font-semibold"
						style={{ color: "var(--ds-text, #172B4D)" }}
					>
						Key Milestones
					</h2>
					<div
						className="rounded-lg border p-6"
						style={{
							backgroundColor: "var(--ds-surface-raised, #FFFFFF)",
							borderColor: "var(--ds-border, #DFE1E6)",
							boxShadow: token("elevation.shadow.raised"),
						}}
					>
						<div className="space-y-4">
							{MILESTONES.map((milestone, index) => (
								<div
									key={milestone.year}
									className={cn(
										"flex gap-4",
										index < MILESTONES.length - 1 ? "border-b pb-4" : ""
									)}
									style={{
										borderColor: "var(--ds-border, #DFE1E6)",
									}}
								>
									<span
										className="shrink-0 rounded-md px-3 py-1 text-sm font-bold"
										style={{
											backgroundColor: "var(--ds-background-brand-bold, #0052CC)",
											color: "var(--ds-text-inverse, #FFFFFF)",
											height: "fit-content",
										}}
									>
										{milestone.year}
									</span>
									<p
										className="text-sm leading-relaxed"
										style={{ color: "var(--ds-text, #172B4D)" }}
									>
										{milestone.event}
									</p>
								</div>
							))}
						</div>
					</div>
				</section>

				{/* Core Values */}
				<section className="mb-16">
					<h2
						className="mb-6 text-2xl font-semibold"
						style={{ color: "var(--ds-text, #172B4D)" }}
					>
						Core Values
					</h2>
					<div className="grid gap-4 sm:grid-cols-2">
						{[
							{
								title: "Innovation",
								description:
									"Relentlessly pursuing breakthrough technologies that change how people interact with the world.",
								icon: "💡",
							},
							{
								title: "Design",
								description:
									"Believing that design is not just how something looks, but how it works — simplicity is the ultimate sophistication.",
								icon: "✨",
							},
							{
								title: "Privacy",
								description:
									"Treating privacy as a fundamental human right, building protections into every product from the ground up.",
								icon: "🔒",
							},
							{
								title: "Environment",
								description:
									"Committed to making products carbon neutral and using 100% recycled materials across all product lines.",
								icon: "🌍",
							},
						].map((value) => (
							<div
								key={value.title}
								className="rounded-lg border p-5"
								style={{
									backgroundColor: "var(--ds-surface-raised, #FFFFFF)",
									borderColor: "var(--ds-border, #DFE1E6)",
									boxShadow: token("elevation.shadow.raised"),
								}}
							>
								<div className="mb-2 text-2xl">{value.icon}</div>
								<h3
									className="mb-2 font-semibold"
									style={{ color: "var(--ds-text, #172B4D)" }}
								>
									{value.title}
								</h3>
								<p
									className="text-sm leading-relaxed"
									style={{ color: "var(--ds-text-subtle, #44546F)" }}
								>
									{value.description}
								</p>
							</div>
						))}
					</div>
				</section>
			</main>

			{/* Footer */}
			<footer
				className="border-t px-6 py-8 text-center"
				style={{
					backgroundColor: "var(--ds-surface-sunken, #F7F8F9)",
					borderColor: "var(--ds-border, #DFE1E6)",
				}}
			>
				<p
					className="text-sm"
					style={{ color: "var(--ds-text-subtlest, #626F86)" }}
				>
					This is an informational page about Apple Inc. created with VPK.
					Apple and all product names are trademarks of Apple Inc.
				</p>
			</footer>
		</div>
	);
}
