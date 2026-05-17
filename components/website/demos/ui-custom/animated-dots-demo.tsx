import { AnimatedDots } from "@/components/ui-custom/animated-dots";

export default function AnimatedDotsDemo() {
	return (
		<div className="flex flex-col gap-4">
			<span className="inline-flex items-baseline text-sm text-text-subtle">
				Thinking
				<AnimatedDots />
			</span>
			<span className="inline-flex items-baseline text-xs text-text-subtle">
				Loading
				<AnimatedDots className="[&>span]:text-xs" />
			</span>
		</div>
	);
}

export function AnimatedDotsDemoCustomColors() {
	return (
		<div className="flex flex-col gap-4">
			<span className="inline-flex items-baseline text-sm text-text-subtle">
				Ocean palette
				<AnimatedDots colors={["#0891b2", "#06b6d4", "#22d3ee"]} />
			</span>
			<span className="inline-flex items-baseline text-sm text-text-subtle">
				Warm palette
				<AnimatedDots colors={["#ef4444", "#f97316", "#eab308"]} />
			</span>
			<span className="inline-flex items-baseline text-sm text-text-subtle">
				Mono
				<AnimatedDots colors={["#6b7280", "#9ca3af", "#d1d5db"]} />
			</span>
		</div>
	);
}

export function AnimatedDotsDemoTiming() {
	return (
		<div className="flex flex-col gap-4">
			<span className="inline-flex items-baseline text-sm text-text-subtle">
				Fast (0.6s)
				<AnimatedDots duration={0.6} staggerDelay={0.1} />
			</span>
			<span className="inline-flex items-baseline text-sm text-text-subtle">
				Default (1.2s)
				<AnimatedDots />
			</span>
			<span className="inline-flex items-baseline text-sm text-text-subtle">
				Slow (2.4s)
				<AnimatedDots duration={2.4} staggerDelay={0.4} />
			</span>
		</div>
	);
}

export function AnimatedDotsDemoSizes() {
	return (
		<div className="flex flex-col gap-4">
			<span className="inline-flex items-baseline text-xs text-text-subtle">
				Extra small
				<AnimatedDots className="[&>span]:text-xs" />
			</span>
			<span className="inline-flex items-baseline text-sm text-text-subtle">
				Small (default)
				<AnimatedDots />
			</span>
			<span className="inline-flex items-baseline text-base text-text-subtle">
				Base
				<AnimatedDots className="[&>span]:text-base" />
			</span>
			<span className="inline-flex items-baseline text-lg text-text-subtle">
				Large
				<AnimatedDots className="[&>span]:text-lg" />
			</span>
		</div>
	);
}
