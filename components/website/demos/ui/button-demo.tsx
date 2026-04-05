"use client";

import AddIcon from "@atlaskit/icon/core/add";
import EditIcon from "@atlaskit/icon/core/edit";
import SearchIcon from "@atlaskit/icon/core/search";
import { ArrowLeftCircleIcon, ArrowRightIcon } from "@/components/ui/vpk-icons";
import { Button } from "@/components/ui/button";

export default function ButtonDemo() {
	return (
		<div className="flex items-center gap-2">
			<Button>Primary</Button>
			<Button variant="outline">Outline</Button>
			<Button variant="ghost">Ghost</Button>
		</div>
	);
}

export function ButtonDemoDefault() {
	return <Button>Default</Button>;
}

export function ButtonDemoDestructive() {
	return <Button variant="destructive">Destructive</Button>;
}

export function ButtonDemoDisabled() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Button disabled>Default</Button>
			<Button variant="secondary" disabled>Secondary</Button>
			<Button variant="outline" disabled>Outline</Button>
			<Button variant="ghost" disabled>Ghost</Button>
			<Button variant="destructive" disabled>Destructive</Button>
			<Button variant="link" disabled>Link</Button>
		</div>
	);
}

export function ButtonDemoFullWidth() {
	return (
		<div className="flex w-full max-w-sm flex-col gap-2">
			<Button className="w-full">Full width default</Button>
			<Button variant="outline" className="w-full">Full width outline</Button>
			<Button variant="secondary" className="w-full">Full width secondary</Button>
		</div>
	);
}

export function ButtonDemoGhost() {
	return <Button variant="ghost">Ghost</Button>;
}

export function ButtonDemoIconLeft() {
	return (
		<>
			<div className="flex flex-wrap items-center gap-2">
				<Button size="xs">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Default
				</Button>
				<Button size="xs" variant="secondary">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Secondary
				</Button>
				<Button size="xs" variant="outline">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Outline
				</Button>
				<Button size="xs" variant="ghost">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Ghost
				</Button>
				<Button size="xs" variant="destructive">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Destructive
				</Button>
				<Button size="xs" variant="link">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Link
				</Button>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Button size="sm">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Default
				</Button>
				<Button size="sm" variant="secondary">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Secondary
				</Button>
				<Button size="sm" variant="outline">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Outline
				</Button>
				<Button size="sm" variant="ghost">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Ghost
				</Button>
				<Button size="sm" variant="destructive">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Destructive
				</Button>
				<Button size="sm" variant="link">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Link
				</Button>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Button>
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Default
				</Button>
				<Button variant="secondary">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Secondary
				</Button>
				<Button variant="outline">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Outline
				</Button>
				<Button variant="ghost">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Ghost
				</Button>
				<Button variant="destructive">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Destructive
				</Button>
				<Button variant="link">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Link
				</Button>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Button size="lg">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Default
				</Button>
				<Button size="lg" variant="secondary">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Secondary
				</Button>
				<Button size="lg" variant="outline">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Outline
				</Button>
				<Button size="lg" variant="ghost">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Ghost
				</Button>
				<Button size="lg" variant="destructive">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Destructive
				</Button>
				<Button size="lg" variant="link">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Link
				</Button>
			</div>
		</>
	);
}

export function ButtonDemoIconOnly() {
	return (
		<>
			<div className="flex flex-wrap items-center gap-2">
				<Button size="icon-xs">
					<ArrowRightIcon />
				</Button>
				<Button size="icon-xs" variant="secondary">
					<ArrowRightIcon />
				</Button>
				<Button size="icon-xs" variant="outline">
					<ArrowRightIcon />
				</Button>
				<Button size="icon-xs" variant="ghost">
					<ArrowRightIcon />
				</Button>
				<Button size="icon-xs" variant="destructive">
					<ArrowRightIcon />
				</Button>
				<Button size="icon-xs" variant="link">
					<ArrowRightIcon />
				</Button>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Button size="icon-sm">
					<ArrowRightIcon />
				</Button>
				<Button size="icon-sm" variant="secondary">
					<ArrowRightIcon />
				</Button>
				<Button size="icon-sm" variant="outline">
					<ArrowRightIcon />
				</Button>
				<Button size="icon-sm" variant="ghost">
					<ArrowRightIcon />
				</Button>
				<Button size="icon-sm" variant="destructive">
					<ArrowRightIcon />
				</Button>
				<Button size="icon-sm" variant="link">
					<ArrowRightIcon />
				</Button>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Button size="icon">
					<ArrowRightIcon />
				</Button>
				<Button size="icon" variant="secondary">
					<ArrowRightIcon />
				</Button>
				<Button size="icon" variant="outline">
					<ArrowRightIcon />
				</Button>
				<Button size="icon" variant="ghost">
					<ArrowRightIcon />
				</Button>
				<Button size="icon" variant="destructive">
					<ArrowRightIcon />
				</Button>
				<Button size="icon" variant="link">
					<ArrowRightIcon />
				</Button>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Button size="icon-lg">
					<ArrowRightIcon />
				</Button>
				<Button size="icon-lg" variant="secondary">
					<ArrowRightIcon />
				</Button>
				<Button size="icon-lg" variant="outline">
					<ArrowRightIcon />
				</Button>
				<Button size="icon-lg" variant="ghost">
					<ArrowRightIcon />
				</Button>
				<Button size="icon-lg" variant="destructive">
					<ArrowRightIcon />
				</Button>
				<Button size="icon-lg" variant="link">
					<ArrowRightIcon />
				</Button>
			</div>
		</>
	);
}

export function ButtonDemoIconRight() {
	return (
		<>
			<div className="flex flex-wrap items-center gap-2">
				<Button size="xs">
					Default{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
				<Button size="xs" variant="secondary">
					Secondary{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
				<Button size="xs" variant="outline">
					Outline{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
				<Button size="xs" variant="ghost">
					Ghost{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
				<Button size="xs" variant="destructive">
					Destructive{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
				<Button size="xs" variant="link">
					Link{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Button size="sm">
					Default
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
				<Button size="sm" variant="secondary">
					Secondary{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
				<Button size="sm" variant="outline">
					Outline{" "}
					<ArrowRightIcon />
				</Button>
				<Button size="sm" variant="ghost">
					Ghost{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
				<Button size="sm" variant="destructive">
					Destructive{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
				<Button size="sm" variant="link">
					Link{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Button>
					Default{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
				<Button variant="secondary">
					Secondary{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
				<Button variant="outline">
					Outline{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
				<Button variant="ghost">
					Ghost{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
				<Button variant="destructive">
					Destructive{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
				<Button variant="link">
					Link{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Button size="lg">
					Default{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
				<Button size="lg" variant="secondary">
					Secondary{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
				<Button size="lg" variant="outline">
					Outline{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
				<Button size="lg" variant="ghost">
					Ghost{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
				<Button size="lg" variant="destructive">
					Destructive{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
				<Button size="lg" variant="link">
					Link{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
			</div>
		</>
	);
}

export function ButtonDemoInvalidStates() {
	return (
		<>
			<div className="flex flex-wrap items-center gap-2">
				<Button size="xs" aria-invalid="true">
					Default
				</Button>
				<Button size="xs" variant="secondary" aria-invalid="true">
					Secondary
				</Button>
				<Button size="xs" variant="outline" aria-invalid="true">
					Outline
				</Button>
				<Button size="xs" variant="ghost" aria-invalid="true">
					Ghost
				</Button>
				<Button size="xs" variant="destructive" aria-invalid="true">
					Destructive
				</Button>
				<Button size="xs" variant="link" aria-invalid="true">
					Link
				</Button>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Button size="sm" aria-invalid="true">
					Default
				</Button>
				<Button size="sm" variant="secondary" aria-invalid="true">
					Secondary
				</Button>
				<Button size="sm" variant="outline" aria-invalid="true">
					Outline
				</Button>
				<Button size="sm" variant="ghost" aria-invalid="true">
					Ghost
				</Button>
				<Button size="sm" variant="destructive" aria-invalid="true">
					Destructive
				</Button>
				<Button size="sm" variant="link" aria-invalid="true">
					Link
				</Button>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Button aria-invalid="true">Default</Button>
				<Button variant="secondary" aria-invalid="true">
					Secondary
				</Button>
				<Button variant="outline" aria-invalid="true">
					Outline
				</Button>
				<Button variant="ghost" aria-invalid="true">
					Ghost
				</Button>
				<Button variant="destructive" aria-invalid="true">
					Destructive
				</Button>
				<Button variant="link" aria-invalid="true">
					Link
				</Button>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Button size="lg" aria-invalid="true">
					Default
				</Button>
				<Button size="lg" variant="secondary" aria-invalid="true">
					Secondary
				</Button>
				<Button size="lg" variant="outline" aria-invalid="true">
					Outline
				</Button>
				<Button size="lg" variant="ghost" aria-invalid="true">
					Ghost
				</Button>
				<Button size="lg" variant="destructive" aria-invalid="true">
					Destructive
				</Button>
				<Button size="lg" variant="link" aria-invalid="true">
					Link
				</Button>
			</div>
		</>
	);
}

export function ButtonDemoLink() {
	return <Button variant="link">Link</Button>;
}

export function ButtonDemoLoading() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Button isLoading>Loading</Button>
			<Button variant="outline" isLoading>
				Loading
			</Button>
			<Button variant="secondary" isLoading>
				Loading
			</Button>
			<Button variant="warning" isLoading>
				Loading
			</Button>
			<Button variant="discovery" isLoading>
				Loading
			</Button>
		</div>
	);
}

export function ButtonDemoOutline() {
	return <Button variant="outline">Outline</Button>;
}

export function ButtonDemoSecondary() {
	return <Button variant="secondary">Secondary</Button>;
}

export function ButtonDemoSelected() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Button aria-pressed="true">Default</Button>
			<Button variant="outline" aria-pressed="true">
				Outline
			</Button>
			<Button variant="ghost" aria-pressed="true">
				Ghost
			</Button>
			<Button variant="warning" aria-pressed="true">
				Warning
			</Button>
			<Button variant="discovery" aria-pressed="true">
				Discovery
			</Button>
		</div>
	);
}

export function ButtonDemoSizes() {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center gap-2">
				<Button size="xs">Extra small</Button>
				<Button size="sm">Small</Button>
				<Button size="default">Default</Button>
				<Button size="lg">Large</Button>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Button size="icon-xs" variant="outline">
					<AddIcon label="Add" />
				</Button>
				<Button size="icon-sm" variant="outline">
					<AddIcon label="Add" />
				</Button>
				<Button size="icon" variant="outline">
					<AddIcon label="Add" />
				</Button>
				<Button size="icon-lg" variant="outline">
					<AddIcon label="Add" />
				</Button>
			</div>
		</div>
	);
}

export function ButtonDemoUsage() {
	return (
		<div className="flex flex-wrap items-center gap-4">
			<div className="flex items-center gap-2">
				<Button variant="outline">Cancel</Button>
				<Button>
					Submit{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
			</div>
			<div className="flex items-center gap-2">
				<Button variant="destructive">Delete</Button>
				<Button size="icon">
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
			</div>
			<Button render={<a href="#" />} nativeButton={false}>
				Link
			</Button>
		</div>
	);
}

export function ButtonDemoVariantsAndSizes() {
	return (
		<>
			<div className="flex flex-wrap items-center gap-2">
				<Button size="xs">Default</Button>
				<Button size="xs" variant="secondary">
					Secondary
				</Button>
				<Button size="xs" variant="outline">
					Outline
				</Button>
				<Button size="xs" variant="ghost">
					Ghost
				</Button>
				<Button size="xs" variant="destructive">
					Destructive
				</Button>
				<Button size="xs" variant="link">
					Link
				</Button>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Button size="sm">Default</Button>
				<Button size="sm" variant="secondary">
					Secondary
				</Button>
				<Button size="sm" variant="outline">
					Outline
				</Button>
				<Button size="sm" variant="ghost">
					Ghost
				</Button>
				<Button size="sm" variant="destructive">
					Destructive
				</Button>
				<Button size="sm" variant="link">
					Link
				</Button>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Button>Default</Button>
				<Button variant="secondary">Secondary</Button>
				<Button variant="outline">Outline</Button>
				<Button variant="ghost">Ghost</Button>
				<Button variant="destructive">Destructive</Button>
				<Button variant="link">Link</Button>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Button size="lg">Default</Button>
				<Button size="lg" variant="secondary">
					Secondary
				</Button>
				<Button size="lg" variant="outline">
					Outline
				</Button>
				<Button size="lg" variant="ghost">
					Ghost
				</Button>
				<Button size="lg" variant="destructive">
					Destructive
				</Button>
				<Button size="lg" variant="link">
					Link
				</Button>
			</div>
		</>
	);
}

export function ButtonDemoVariants() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Button variant="default">Default</Button>
			<Button variant="secondary">Secondary</Button>
			<Button variant="outline">Outline</Button>
			<Button variant="ghost">Ghost</Button>
			<Button variant="destructive">Destructive</Button>
			<Button variant="warning">Warning</Button>
			<Button variant="discovery">Discovery</Button>
			<Button variant="link">Link</Button>
		</div>
	);
}

export function ButtonDemoWithIcon() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Button>
				<AddIcon label="" data-icon="inline-start" />
				Add item
			</Button>
			<Button variant="outline">
				Edit
				<EditIcon label="" data-icon="inline-end" />
			</Button>
			<Button size="icon" variant="ghost">
				<SearchIcon label="Search" />
			</Button>
		</div>
	);
}
