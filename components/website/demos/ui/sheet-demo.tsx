"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export default function SheetDemo() {
	return (
		<Sheet>
			<SheetTrigger render={<Button variant="outline" size="sm" />}>
				Open sheet
			</SheetTrigger>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Sheet title</SheetTitle>
					<SheetDescription>A side panel overlay.</SheetDescription>
				</SheetHeader>
			</SheetContent>
		</Sheet>
	);
}

export function SheetDemoDefault() {
	return (
		<Sheet>
			<SheetTrigger render={<Button variant="outline">Open sheet</Button>} />
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Sheet title</SheetTitle>
					<SheetDescription>
						This is a description of the sheet content. Make changes to your
						profile here.
					</SheetDescription>
				</SheetHeader>
				<div className="p-4">
					<p className="text-muted-foreground text-sm">
						Your sheet content goes here. You can place any elements inside.
					</p>
				</div>
			</SheetContent>
		</Sheet>
	);
}

export function SheetDemoLeft() {
	return (
		<Sheet>
			<SheetTrigger render={<Button variant="outline">Open left sheet</Button>} />
			<SheetContent side="left">
				<SheetHeader>
					<SheetTitle>Left sheet</SheetTitle>
					<SheetDescription>
						This sheet slides in from the left side.
					</SheetDescription>
				</SheetHeader>
				<div className="p-4">
					<p className="text-muted-foreground text-sm">
						Navigation or sidebar content could go here.
					</p>
				</div>
			</SheetContent>
		</Sheet>
	);
}

export function SheetDemoNoCloseButton() {
	return (
		<Sheet>
			<SheetTrigger render={<Button variant="outline" />}>
				No Close Button
			</SheetTrigger>
			<SheetContent showCloseButton={false}>
				<SheetHeader>
					<SheetTitle>No Close Button</SheetTitle>
					<SheetDescription>
						This sheet doesn&apos;t have a close button in the top-right
						corner. You can only close it using the button below.
					</SheetDescription>
				</SheetHeader>
			</SheetContent>
		</Sheet>
	);
}

export function SheetDemoNoClose() {
	return (
		<Sheet>
			<SheetTrigger render={<Button variant="outline">Open sheet</Button>} />
			<SheetContent showCloseButton={false}>
				<SheetHeader>
					<SheetTitle>No close button</SheetTitle>
					<SheetDescription>
						This sheet has no close button. Click the overlay to dismiss.
					</SheetDescription>
				</SheetHeader>
				<div className="p-4">
					<p className="text-muted-foreground text-sm">
						Use this variant when the sheet should only be dismissed by clicking
						outside or pressing Escape.
					</p>
				</div>
			</SheetContent>
		</Sheet>
	);
}

export function SheetDemoSides() {
	const SHEET_SIDES = ["top", "right", "bottom", "left"] as const;

	return (
		<div className="flex flex-wrap gap-2">
			{SHEET_SIDES.map((side) => (
				<Sheet key={side}>
					<SheetTrigger
						render={<Button variant="outline" className="capitalize" />}
					>
						{side}
					</SheetTrigger>
					<SheetContent
						side={side}
						className="data-[side=bottom]:max-h-[50vh] data-[side=top]:max-h-[50vh]"
					>
						<SheetHeader>
							<SheetTitle>Edit profile</SheetTitle>
							<SheetDescription>
								Make changes to your profile here. Click save when you&apos;re
								done.
							</SheetDescription>
						</SheetHeader>
						<div className="no-scrollbar style-vega:px-4 style-maia:px-6 style-mira:px-6 style-lyra:px-4 style-nova:px-4 flex flex-col gap-4 overflow-y-auto style-lyra:gap-2">
							{Array.from({ length: 10 }).map((_, index) => (
								<p
									key={index}
									className="style-lyra:leading-relaxed leading-normal"
								>
									Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
									do eiusmod tempor incididunt ut labore et dolore magna
									aliqua. Ut enim ad minim veniam, quis nostrud exercitation
									ullamco laboris nisi ut aliquip ex ea commodo consequat.
									Duis aute irure dolor in reprehenderit in voluptate velit
									esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
									occaecat cupidatat non proident, sunt in culpa qui officia
									deserunt mollit anim id est laborum.
								</p>
							))}
						</div>
						<SheetFooter>
							<Button type="submit">Save changes</Button>
							<SheetClose render={<Button variant="outline" />}>
								Cancel
							</SheetClose>
						</SheetFooter>
					</SheetContent>
				</Sheet>
			))}
		</div>
	);
}

export function SheetDemoTop() {
	return (
		<Sheet>
			<SheetTrigger render={<Button variant="outline">Open top sheet</Button>} />
			<SheetContent side="top">
				<SheetHeader>
					<SheetTitle>Top sheet</SheetTitle>
					<SheetDescription>
						This sheet slides in from the top.
					</SheetDescription>
				</SheetHeader>
				<div className="p-4">
					<p className="text-muted-foreground text-sm">
						Notification banners or alerts could go here.
					</p>
				</div>
			</SheetContent>
		</Sheet>
	);
}

export function SheetDemoWithForm() {
	return (
		<Sheet>
			<SheetTrigger render={<Button variant="outline" />}>Open</SheetTrigger>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Edit profile</SheetTitle>
					<SheetDescription>
						Make changes to your profile here. Click save when you&apos;re
						done.
					</SheetDescription>
				</SheetHeader>
				<div className="style-vega:px-4 style-maia:px-6 style-mira:px-6 style-lyra:px-4 style-nova:px-4">
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor="sheet-demo-name">Name</FieldLabel>
							<Input id="sheet-demo-name" defaultValue="Pedro Duarte" />
						</Field>
						<Field>
							<FieldLabel htmlFor="sheet-demo-username">Username</FieldLabel>
							<Input id="sheet-demo-username" defaultValue="@peduarte" />
						</Field>
					</FieldGroup>
				</div>
				<SheetFooter>
					<Button type="submit">Save changes</Button>
					<SheetClose render={<Button variant="outline" />}>Close</SheetClose>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
