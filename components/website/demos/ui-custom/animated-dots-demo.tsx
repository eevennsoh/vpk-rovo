import { AnimatedDots } from "@/components/ui-custom/animated-dots";

export default function AnimatedDotsDemo() {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-1">
				<span className="text-xs text-text-subtlest">Neutral</span>
				<span className="inline-flex items-baseline text-sm text-text-subtlest">
					Thinking
					<AnimatedDots variant="neutral" />
				</span>
			</div>
			<div className="flex flex-col gap-1">
				<span className="text-xs text-text-subtlest">Color</span>
				<span className="inline-flex items-baseline text-sm text-text-subtlest">
					Thinking
					<AnimatedDots variant="color" />
				</span>
			</div>
		</div>
	);
}

export function AnimatedDotsDemoVariants() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-1">
				<span className="text-xs text-text-subtlest">Neutral — text subtlest</span>
				<span className="inline-flex items-baseline text-sm text-text-subtlest">
					Thinking
					<AnimatedDots variant="neutral" />
				</span>
			</div>
			<div className="flex flex-col gap-1">
				<span className="text-xs text-text-subtlest">Neutral — matching label color</span>
				<span className="inline-flex items-baseline text-sm text-text-subtle">
					Thinking
					<AnimatedDots variant="neutral" />
				</span>
			</div>
			<div className="flex flex-col gap-1">
				<span className="text-xs text-text-subtlest">Color — Rovo palette</span>
				<span className="inline-flex items-baseline text-sm text-text-subtlest">
					Thinking
					<AnimatedDots variant="color" />
				</span>
			</div>
		</div>
	);
}

export function AnimatedDotsDemoCustomColors() {
	return (
		<div className="flex flex-col gap-4">
			<span className="inline-flex items-baseline text-sm text-text-subtle">
				Ocean palette
				<AnimatedDots variant="color" colors={["#0891b2", "#06b6d4", "#22d3ee"]} />
			</span>
			<span className="inline-flex items-baseline text-sm text-text-subtle">
				Warm palette
				<AnimatedDots variant="color" colors={["#ef4444", "#f97316", "#eab308"]} />
			</span>
			<span className="inline-flex items-baseline text-sm text-text-subtle">
				Mono
				<AnimatedDots variant="color" colors={["#6b7280", "#9ca3af", "#d1d5db"]} />
			</span>
		</div>
	);
}

export function AnimatedDotsDemoTiming() {
	return (
		<div className="flex flex-col gap-4">
			<span className="inline-flex items-baseline text-sm text-text-subtlest">
				Fast (0.6s)
				<AnimatedDots duration={0.6} staggerDelay={0.1} />
			</span>
			<span className="inline-flex items-baseline text-sm text-text-subtlest">
				Default (1.2s)
				<AnimatedDots />
			</span>
			<span className="inline-flex items-baseline text-sm text-text-subtlest">
				Slow (2.4s)
				<AnimatedDots duration={2.4} staggerDelay={0.4} />
			</span>
		</div>
	);
}

export function AnimatedDotsDemoSizes() {
	return (
		<div className="flex flex-col gap-4">
			<span className="inline-flex items-baseline text-xs text-text-subtlest">
				Extra small
				<AnimatedDots className="[&>span]:text-xs" />
			</span>
			<span className="inline-flex items-baseline text-sm text-text-subtlest">
				Small (default)
				<AnimatedDots />
			</span>
			<span className="inline-flex items-baseline text-base text-text-subtlest">
				Base
				<AnimatedDots className="[&>span]:text-base" />
			</span>
			<span className="inline-flex items-baseline text-lg text-text-subtlest">
				Large
				<AnimatedDots className="[&>span]:text-lg" />
			</span>
		</div>
	);
}
