import type { Metadata } from "next";

const companyStats = [
	{
		label: "Founded",
		value: "1976",
		detail: "Started by Steve Jobs, Steve Wozniak, and Ronald Wayne in California.",
	},
	{
		label: "Headquarters",
		value: "Cupertino",
		detail: "Apple Park serves as the company’s circular campus and corporate headquarters.",
	},
	{
		label: "Core focus",
		value: "Hardware + software",
		detail: "Apple combines industrial design, operating systems, services, and silicon.",
	},
];

const milestones = [
	{
		year: "1976",
		title: "Apple is founded",
		description:
			"The company begins with the Apple I, establishing its early identity around personal computing and hands-on product craftsmanship.",
	},
	{
		year: "1984",
		title: "Macintosh redefines personal computing",
		description:
			"The Macintosh popularizes a more approachable graphical user interface and turns design into a major competitive advantage.",
	},
	{
		year: "2001",
		title: "The iPod era begins",
		description:
			"Apple pairs elegant hardware with the iTunes ecosystem, showing how devices and services become more powerful together.",
	},
	{
		year: "2007",
		title: "The iPhone changes the market",
		description:
			"Apple combines multitouch interaction, mobile software, and a strong developer platform to reshape the smartphone industry.",
	},
	{
		year: "2020",
		title: "Apple Silicon arrives",
		description:
			"Bringing chip design in-house strengthens performance, battery efficiency, and product integration across the Mac lineup.",
	},
];

const productEcosystem = [
	{
		name: "iPhone",
		summary: "Apple’s flagship device and one of the most influential consumer products in modern technology.",
		highlight: "Hardware, software, and services working as one",
	},
	{
		name: "Mac",
		summary: "A personal computing platform known for industrial design, creative workflows, and Apple Silicon performance.",
		highlight: "Desktop power with tight OS integration",
	},
	{
		name: "iPad",
		summary: "A flexible touch-first device spanning entertainment, sketching, education, and professional productivity.",
		highlight: "Portable canvas for work and creativity",
	},
	{
		name: "Wearables + Services",
		summary: "Apple Watch, AirPods, iCloud, Music, TV+, and more extend the company beyond single-device ownership.",
		highlight: "Ecosystem loyalty through continuity",
	},
];

const principles = [
	"Design-led product development with strong attention to material, interaction, and packaging.",
	"Vertical integration across chips, operating systems, devices, retail, and services.",
	"Premium brand positioning built around simplicity, trust, and aspirational product storytelling.",
	"A recurring emphasis on privacy, accessibility, and tightly controlled user experience standards.",
];

export const metadata: Metadata = {
	title: "A Document About Apple",
	description:
		"A concise document-style page about Apple Inc., covering its history, ecosystem, business model, and cultural impact.",
};

function SectionHeading({
	eyebrow,
	title,
	description,
}: Readonly<{
	eyebrow: string;
	title: string;
	description: string;
}>) {
	return (
		<div className="max-w-3xl space-y-3">
			<p className="text-xs font-medium uppercase tracking-[0.3em] text-sky-600 dark:text-sky-300">{eyebrow}</p>
			<h2 className="text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">{title}</h2>
			<p className="text-base leading-7 text-muted-foreground sm:text-lg">{description}</p>
		</div>
	);
}

export default function ApplePage() {
	return (
		<main className="min-h-screen bg-background text-foreground">
			<section className="relative isolate overflow-hidden border-b border-border">
				<div className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,rgba(2,6,23,0.95),rgba(15,23,42,0.9)_35%,rgba(255,255,255,1)_100%)] dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.98),rgba(2,6,23,0.92)_45%,rgba(3,7,18,1)_100%)]" />
				<div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.22),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.18),transparent_22%)]" />
				<div className="mx-auto flex max-w-7xl flex-col gap-14 px-6 py-18 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-12 lg:py-24">
					<div className="max-w-4xl space-y-8">
						<div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm text-white/85 backdrop-blur">
							<span className="h-2 w-2 rounded-full bg-sky-300" />
							Reference document
						</div>
						<div className="space-y-5 text-white">
							<h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-balance sm:text-6xl lg:text-7xl">
								A document about Apple: history, products, strategy, and influence.
							</h1>
							<p className="max-w-2xl text-lg leading-8 text-white/72 sm:text-xl">
								Apple Inc. is best known for combining hardware, software, silicon, services, and retail into a tightly
								controlled ecosystem. This page gives a clear summary of how the company grew, what it sells, and why it
								continues to shape expectations across consumer technology.
							</p>
						</div>
						<div className="grid gap-4 sm:grid-cols-3">
							{companyStats.map((stat) => (
								<div
									key={stat.label}
									className="rounded-3xl border border-white/12 bg-white/8 p-5 text-white shadow-[0_24px_80px_rgba(15,23,42,0.28)] backdrop-blur"
								>
									<p className="text-sm text-white/60">{stat.label}</p>
									<p className="mt-2 text-2xl font-semibold tracking-tight">{stat.value}</p>
									<p className="mt-3 text-sm leading-6 text-white/72">{stat.detail}</p>
								</div>
							))}
						</div>
					</div>

					<div className="w-full max-w-md">
						<div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/12 p-6 text-white shadow-[0_24px_100px_rgba(15,23,42,0.4)] backdrop-blur-xl">
							<div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sky-300/30 blur-3xl" />
							<div className="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
							<div className="relative space-y-6">
								<div className="flex items-start justify-between gap-4">
									<div>
										<p className="text-sm uppercase tracking-[0.24em] text-white/55">Snapshot</p>
										<p className="mt-3 text-3xl font-semibold tracking-tight">Apple Inc.</p>
									</div>
									<div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/10 text-2xl">
										
									</div>
								</div>
								<div className="grid gap-3 sm:grid-cols-2">
									<div className="rounded-2xl bg-white/10 p-4">
										<p className="text-sm text-white/60">Industry</p>
										<p className="mt-1 font-semibold">Consumer technology</p>
									</div>
									<div className="rounded-2xl bg-white/10 p-4">
										<p className="text-sm text-white/60">Known for</p>
										<p className="mt-1 font-semibold">Integrated ecosystem</p>
									</div>
								</div>
								<p className="text-sm leading-6 text-white/72">
									Apple stands out not just for individual devices, but for how its products, services, retail presence,
									and operating systems reinforce one another.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12 lg:py-20">
				<SectionHeading
					eyebrow="Overview"
					title="Why Apple matters"
					description="Apple is widely studied as a company that blends product design, software strategy, supply chain excellence, retail execution, and brand storytelling into one coherent business model."
				/>
				<div className="mt-10 grid gap-5 lg:grid-cols-[1.35fr_0.95fr]">
					<div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
						<p className="text-base leading-8 text-card-foreground sm:text-lg">
							From the early Macintosh to the iPhone era and the move to Apple Silicon, the company has repeatedly
							focused on controlling the full experience: device design, operating system behavior, silicon performance,
							retail presentation, and services revenue. This level of integration helps Apple create products that feel
							consistent, polished, and easy to adopt across categories.
						</p>
					</div>
					<div className="rounded-[2rem] border border-border bg-muted/40 p-8 shadow-sm">
						<p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">Brand position</p>
						<ul className="mt-5 space-y-4 text-base leading-7 text-foreground">
							<li>• Premium pricing supported by perceived quality and trust.</li>
							<li>• Strong customer retention through ecosystem convenience.</li>
							<li>• Global influence on product design and interface expectations.</li>
						</ul>
					</div>
				</div>
			</section>

			<section className="border-y border-border bg-muted/30">
				<div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12 lg:py-20">
					<SectionHeading
						eyebrow="Milestones"
						title="A short timeline of Apple’s growth"
						description="Apple’s history is often described through a sequence of category-defining launches that each strengthened the company’s larger platform."
					/>
					<div className="mt-10 grid gap-5 lg:grid-cols-2">
						{milestones.map((milestone) => (
							<article key={milestone.year} className="rounded-[2rem] border border-border bg-background p-6 shadow-sm">
								<div className="flex items-start gap-4">
									<div className="mt-1 flex h-12 min-w-12 items-center justify-center rounded-2xl bg-sky-100 text-sm font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
										{milestone.year}
									</div>
									<div>
										<h3 className="text-2xl font-semibold tracking-tight">{milestone.title}</h3>
										<p className="mt-3 text-base leading-7 text-muted-foreground">{milestone.description}</p>
									</div>
								</div>
							</article>
						))}
					</div>
				</div>
			</section>

			<section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12 lg:py-20">
				<SectionHeading
					eyebrow="Ecosystem"
					title="Products that reinforce each other"
					description="Apple’s competitive strength is not limited to one device. Its product categories support each other through shared accounts, operating systems, chips, services, and continuity features."
				/>
				<div className="mt-10 grid gap-5 md:grid-cols-2">
					{productEcosystem.map((product) => (
						<article
							key={product.name}
							className="group rounded-[2rem] border border-border bg-card p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1"
						>
							<p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">{product.highlight}</p>
							<h3 className="mt-4 text-2xl font-semibold tracking-tight text-card-foreground">{product.name}</h3>
							<p className="mt-3 text-base leading-7 text-muted-foreground">{product.summary}</p>
						</article>
					))}
				</div>
			</section>

			<section className="border-t border-border bg-slate-950 text-white dark:bg-slate-950">
				<div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-12 lg:py-20">
					<div className="space-y-6">
						<SectionHeading
							eyebrow="Strategy"
							title="What defines Apple as a business"
							description="Apple’s strategy is often summarized as end-to-end control: shaping the industrial design, chip roadmap, user interface, services layer, and distribution model together."
						/>
					</div>
					<div className="space-y-4">
						{principles.map((principle) => (
							<div key={principle} className="rounded-3xl border border-white/10 bg-white/5 p-5">
								<p className="text-base leading-7 text-white/78">{principle}</p>
							</div>
						))}
					</div>
				</div>
			</section>
		</main>
	);
}
