"use client";

import { token } from "@/lib/tokens";

const HEADING_TOKENS = [
	{ token: "font.heading.xxlarge", label: "XXLarge" },
	{ token: "font.heading.xlarge", label: "XLarge" },
	{ token: "font.heading.large", label: "Large" },
	{ token: "font.heading.medium", label: "Medium" },
	{ token: "font.heading.small", label: "Small" },
	{ token: "font.heading.xsmall", label: "XSmall" },
	{ token: "font.heading.xxsmall", label: "XXSmall" },
] as const;

const BODY_TOKENS = [
	{ token: "font.body.large", label: "Large" },
	{ token: "font.body", label: "Default" },
	{ token: "font.body.small", label: "Small" },
] as const;

export default function TypographyDemo() {
	return (
		<div className="flex flex-col w-full max-w-2xl" style={{ gap: token("space.400") }}>
			<section className="flex flex-col" style={{ gap: token("space.200") }}>
				<h3 className="text-text-subtle text-xs font-semibold uppercase tracking-wider">
					Heading Tokens
				</h3>
				<div className="flex flex-col" style={{ gap: token("space.150") }}>
					{HEADING_TOKENS.map((h) => (
						<div
							key={h.token}
							className="flex items-baseline justify-between"
							style={{
								paddingBlock: token("space.100"),
								borderBottom: `1px solid ${token("color.border")}`,
							}}
						>
							<span
								className="text-text"
								style={{ font: token(h.token) }}
							>
								{h.label}
							</span>
							<code className="text-text-subtlest text-xs font-mono shrink-0 ml-4">
								{h.token}
							</code>
						</div>
					))}
				</div>
			</section>

			<section className="flex flex-col" style={{ gap: token("space.200") }}>
				<h3 className="text-text-subtle text-xs font-semibold uppercase tracking-wider">
					Body Tokens
				</h3>
				<div className="flex flex-col" style={{ gap: token("space.150") }}>
					{BODY_TOKENS.map((b) => (
						<div
							key={b.token}
							className="flex items-baseline justify-between"
							style={{
								paddingBlock: token("space.100"),
								borderBottom: `1px solid ${token("color.border")}`,
							}}
						>
							<span
								className="text-text"
								style={{ font: token(b.token) }}
							>
								The quick brown fox jumps over the lazy dog
							</span>
							<code className="text-text-subtlest text-xs font-mono shrink-0 ml-4">
								{b.token}
							</code>
						</div>
					))}
				</div>
			</section>
		</div>
	);
}
