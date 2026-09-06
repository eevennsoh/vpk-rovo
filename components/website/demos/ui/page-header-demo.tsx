"use client"

import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal"

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Icon } from "@/components/ui/icon"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/ui/page-header"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"

function PageHeaderBreadcrumbs({
	ariaLabel,
	current,
}: Readonly<{ ariaLabel: string; current: string }>) {
	return (
		<Breadcrumb aria-label={ariaLabel}>
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbLink href="#">Teams</BreadcrumbLink>
				</BreadcrumbItem>
				<BreadcrumbSeparator />
				<BreadcrumbItem>
					<BreadcrumbPage>{current}</BreadcrumbPage>
				</BreadcrumbItem>
			</BreadcrumbList>
		</Breadcrumb>
	)
}

function PageHeaderDemoSimple({ ariaLabel }: Readonly<{ ariaLabel: string }>) {
	return (
		<PageHeader
			title="How to use the page header component"
			breadcrumbs={
				<PageHeaderBreadcrumbs ariaLabel={ariaLabel} current="Design System" />
			}
		/>
	)
}

export default function PageHeaderDemo() {
	return <PageHeaderDemoSimple ariaLabel="Preview hierarchy" />
}

export function PageHeaderDemoDefault() {
	return <PageHeaderDemoSimple ariaLabel="Default example hierarchy" />
}

export function PageHeaderDemoComplex() {
	return (
		<PageHeader
			title="Introducing the Design System Team"
			description="Manage the team, share its work, and refine the page content."
			breadcrumbs={
				<PageHeaderBreadcrumbs ariaLabel="Team hierarchy" current="Design System Team" />
			}
			actions={
				<ButtonGroup variant="separated" aria-label="Content actions">
					<Button>Edit page</Button>
					<Button variant="outline">Share</Button>
					<Button variant="outline" size="icon" aria-label="More actions">
						<Icon render={<ShowMoreHorizontalIcon label="" />} />
					</Button>
				</ButtonGroup>
			}
			bottomBar={
				<div className="flex flex-wrap items-center gap-2">
					<Input aria-label="Filter" placeholder="Filter" className="w-50" />
					<Select>
						<SelectTrigger className="w-50" aria-label="Choose a team">
							<SelectValue placeholder="Choose an option" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="design-system">Design System</SelectItem>
							<SelectItem value="platform">Platform</SelectItem>
						</SelectContent>
					</Select>
				</div>
			}
		/>
	)
}
