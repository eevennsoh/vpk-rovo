import { ArrowRightIcon } from "@/components/ui/vpk-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";

export default function SpinnerDemo() {
	return <Spinner size="xl" />;
}

export function SpinnerDemoBasic() {
	return (
		<div className="flex items-center gap-6">
			<Spinner />
			<Spinner size="xl" />
		</div>
	);
}

export function SpinnerDemoDefault() {
	return <Spinner />;
}

export function SpinnerDemoInBadges() {
	return (
		<div className="flex flex-wrap items-center justify-center gap-4">
			<Badge>
				<Spinner data-icon="inline-start" />
				Badge
			</Badge>
			<Badge variant="secondary">
				<Spinner data-icon="inline-start" />
				Badge
			</Badge>
			<Badge variant="destructive">
				<Spinner data-icon="inline-start" />
				Badge
			</Badge>
			<Badge variant="outline">
				<Spinner data-icon="inline-start" />
				Badge
			</Badge>
		</div>
	);
}

export function SpinnerDemoInButtons() {
	return (
		<div className="flex flex-wrap items-center gap-4">
			<Button>
				<Spinner data-icon="inline-start" /> Submit
			</Button>
			<Button disabled>
				<Spinner data-icon="inline-start" /> Disabled
			</Button>
			<Button variant="outline" disabled>
				<Spinner data-icon="inline-start" /> Outline
			</Button>
			<Button variant="outline" size="icon" disabled>
				<Spinner data-icon="inline-start" />
				<span className="sr-only">Loading...</span>
			</Button>
		</div>
	);
}

export function SpinnerDemoInEmptyState() {
	return (
		<Empty className="min-h-[300px]">
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<Spinner />
				</EmptyMedia>
				<EmptyTitle>No projects yet</EmptyTitle>
				<EmptyDescription>
					You haven&apos;t created any projects yet. Get started by creating
					your first project.
				</EmptyDescription>
			</EmptyHeader>
			<EmptyContent>
				<div className="flex gap-2">
					<Button render={<a href="#" />} nativeButton={false}>
						Create project
					</Button>
					<Button variant="outline">Import project</Button>
				</div>
				<Button
					variant="link"
					render={<a href="#" />}
					nativeButton={false}
					className="text-muted-foreground"
				>
					Learn more{" "}
					<ArrowRightIcon
					/>
				</Button>
			</EmptyContent>
		</Empty>
	);
}

export function SpinnerDemoInInputGroup() {
	return (
		<Field>
			<FieldLabel htmlFor="input-group-spinner">Input Group</FieldLabel>
			<InputGroup>
				<InputGroupInput id="input-group-spinner" />
				<InputGroupAddon>
					<Spinner />
				</InputGroupAddon>
			</InputGroup>
		</Field>
	);
}

export function SpinnerDemoSizes() {
	return (
		<div className="flex items-center gap-4">
			<Spinner size="xs" />
			<Spinner size="sm" />
			<Spinner />
			<Spinner size="lg" />
			<Spinner size="xl" />
		</div>
	);
}
