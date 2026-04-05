"use client";

import { type ReactNode } from "react";
import { CircleAlertIcon } from "@/components/ui/vpk-icons";
import Link from "next/link";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";

export default function NavigationMenuDemo() {
	return (
		<NavigationMenu>
			<NavigationMenuList>
				<NavigationMenuItem>
					<NavigationMenuLink href="#">Home</NavigationMenuLink>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuLink href="#">About</NavigationMenuLink>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuLink href="#">Contact</NavigationMenuLink>
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>
	);
}

function ListItem({
	title,
	href,
	children,
}: Readonly<{ title: string; href: string; children: ReactNode }>) {
	return (
		<li>
			<NavigationMenuLink href={href}>
				<div className="text-sm font-medium leading-none">{title}</div>
				<p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
					{children}
				</p>
			</NavigationMenuLink>
		</li>
	);
}

const components = [
	{
		title: "Alert Dialog",
		href: "/docs/primitives/alert-dialog",
		description: "A modal dialog that interrupts the user with important content and expects a response.",
	},
	{
		title: "Hover Card",
		href: "/docs/primitives/hover-card",
		description: "For sighted users to preview content available behind a link.",
	},
	{
		title: "Progress",
		href: "/docs/primitives/progress",
		description: "Displays an indicator showing the completion progress of a task.",
	},
	{
		title: "Scroll Area",
		href: "/docs/primitives/scroll-area",
		description: "Visually or semantically separates content.",
	},
	{
		title: "Tabs",
		href: "/docs/primitives/tabs",
		description: "A set of layered sections of content, known as tab panels.",
	},
	{
		title: "Tooltip",
		href: "/docs/primitives/tooltip",
		description: "A popup that displays information related to an element.",
	},
];

export function NavigationMenuDemoBasic() {
	return (
		<NavigationMenu>
			<NavigationMenuList>
				<NavigationMenuItem>
					<NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
					<NavigationMenuContent>
						<ul className="w-96">
							<ListItem href="/docs" title="Introduction">
								Re-usable components built with Tailwind CSS.
							</ListItem>
							<ListItem href="/docs/installation" title="Installation">
								How to install dependencies and structure your app.
							</ListItem>
							<ListItem href="/docs/primitives/typography" title="Typography">
								Styles for headings, paragraphs, lists...etc
							</ListItem>
						</ul>
					</NavigationMenuContent>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuTrigger>Components</NavigationMenuTrigger>
					<NavigationMenuContent>
						<ul className="grid w-[400px] gap-2 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
							{components.map((component) => (
								<ListItem
									key={component.title}
									title={component.title}
									href={component.href}
								>
									{component.description}
								</ListItem>
							))}
						</ul>
					</NavigationMenuContent>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuTrigger>With Icon</NavigationMenuTrigger>
					<NavigationMenuContent>
						<ul className="grid w-[200px]">
							<li>
								<NavigationMenuLink
									render={
										<Link href="#" className="flex-row items-center gap-2" />
									}
								>
									<CircleAlertIcon />
									Backlog
								</NavigationMenuLink>
								<NavigationMenuLink
									render={
										<Link href="#" className="flex-row items-center gap-2" />
									}
								>
									<CircleAlertIcon />
									To Do
								</NavigationMenuLink>
								<NavigationMenuLink
									render={
										<Link href="#" className="flex-row items-center gap-2" />
									}
								>
									<CircleAlertIcon />
									Done
								</NavigationMenuLink>
							</li>
						</ul>
					</NavigationMenuContent>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuLink
						render={<Link href="/docs" />}
						className={navigationMenuTriggerStyle()}
					>
						Documentation
					</NavigationMenuLink>
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>
	);
}

export function NavigationMenuDemoDefault() {
	return (
		<NavigationMenu>
			<NavigationMenuList>
				<NavigationMenuItem>
					<NavigationMenuLink href="#">Home</NavigationMenuLink>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuLink href="#">About</NavigationMenuLink>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuLink href="#">Contact</NavigationMenuLink>
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>
	);
}

export function NavigationMenuDemoWithTrigger() {
	return (
		<NavigationMenu>
			<NavigationMenuList>
				<NavigationMenuItem>
					<NavigationMenuTrigger>Products</NavigationMenuTrigger>
					<NavigationMenuContent>
						<div className="grid w-48 gap-1 p-2">
							<NavigationMenuLink href="#">Analytics</NavigationMenuLink>
							<NavigationMenuLink href="#">Automation</NavigationMenuLink>
							<NavigationMenuLink href="#">Integrations</NavigationMenuLink>
						</div>
					</NavigationMenuContent>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuLink href="#">Pricing</NavigationMenuLink>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuLink href="#">Docs</NavigationMenuLink>
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>
	);
}
