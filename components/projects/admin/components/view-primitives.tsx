import type { ComponentProps, ReactNode } from "react";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export function AdminPageShell({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-6 sm:px-8">
			{children}
		</div>
	);
}

interface AdminViewHeaderProps {
	title: string;
	description?: string;
	action?: ReactNode;
}

export function AdminViewHeader({
	title,
	description,
	action,
}: Readonly<AdminViewHeaderProps>) {
	return (
		<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
			<div className="flex min-w-0 flex-col gap-2">
				<h1 className="text-text" style={{ font: token("font.heading.large") }}>
					{title}
				</h1>
				{description ? (
					<p className="max-w-[900px] text-sm text-text-subtlest">
						{description}
					</p>
				) : null}
			</div>
			{action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
		</div>
	);
}

interface AdminSectionHeadingProps {
	children: ReactNode;
	className?: string;
}

export function AdminSectionHeading({
	children,
	className,
}: Readonly<AdminSectionHeadingProps>) {
	return (
		<h2 className={cn("text-text", className)} style={{ font: token("font.heading.small") }}>
			{children}
		</h2>
	);
}

interface AdminCardProps extends ComponentProps<typeof Card> {
	children: ReactNode;
}

export function AdminCard({ children, className, ...props }: Readonly<AdminCardProps>) {
	return (
		<Card
			className={cn("rounded-lg border border-border bg-surface-raised shadow-none", className)}
			{...props}
		>
			{children}
		</Card>
	);
}

interface AdminMetricCardProps {
	label: string;
	value: string;
	description?: string;
}

export function AdminMetricCard({
	label,
	value,
	description,
}: Readonly<AdminMetricCardProps>) {
	return (
		<AdminCard className="min-w-[188px] flex-1">
			<CardContent className="flex flex-col gap-2">
				<span className="text-text" style={{ font: token("font.heading.xlarge") }}>
					{value}
				</span>
				<span className="text-xs text-text-subtlest">{label}</span>
				{description ? <span className="text-xs text-text-subtle">{description}</span> : null}
			</CardContent>
		</AdminCard>
	);
}

interface AdminToggleRowProps {
	label: string;
	description?: string;
	checked?: boolean;
	defaultChecked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
}

export function AdminToggleRow({
	label,
	description,
	checked,
	defaultChecked,
	onCheckedChange,
}: Readonly<AdminToggleRowProps>) {
	const switchProps =
		checked !== undefined
			? { checked, onCheckedChange }
			: { defaultChecked, onCheckedChange };

	return (
		<div className="flex items-center justify-between gap-4 px-4 py-3">
			<div className="min-w-0">
				<div className="text-sm font-semibold text-text">{label}</div>
				{description ? (
					<div className="mt-1 text-xs text-text-subtlest">{description}</div>
				) : null}
			</div>
			<Switch label={label} {...switchProps} />
		</div>
	);
}

export function AdminCardHeader({
	title,
	action,
}: Readonly<{
	title: string;
	action?: ReactNode;
}>) {
	return (
		<CardHeader className={cn(action && "grid-cols-[1fr_auto]")}>
			<CardTitle className="text-text" style={{ font: token("font.heading.small") }}>
				{title}
			</CardTitle>
			{action ? <div className="col-start-2 row-span-2 row-start-1">{action}</div> : null}
		</CardHeader>
	);
}
