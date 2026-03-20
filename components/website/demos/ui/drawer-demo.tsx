"use client";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DrawerDemo() {
	return (
		<Drawer>
			<DrawerTrigger render={<Button variant="outline" size="sm" />}>
				Open drawer
			</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>Drawer title</DrawerTitle>
					<DrawerDescription>A bottom panel overlay.</DrawerDescription>
				</DrawerHeader>
			</DrawerContent>
		</Drawer>
	);
}

export function DrawerDemoDefault() {
	return (
		<Drawer>
			<DrawerTrigger render={<Button variant="outline">Open drawer</Button>} />
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>Drawer title</DrawerTitle>
					<DrawerDescription>
						This is a description of the drawer content.
					</DrawerDescription>
				</DrawerHeader>
				<DrawerFooter>
					<DrawerClose render={<Button variant="outline">Close</Button>} />
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

export function DrawerDemoRight() {
	return (
		<Drawer direction="right">
			<DrawerTrigger render={<Button variant="outline">Open right drawer</Button>} />
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>Right drawer</DrawerTitle>
					<DrawerDescription>
						This drawer slides in from the right side.
					</DrawerDescription>
				</DrawerHeader>
				<DrawerFooter>
					<DrawerClose render={<Button variant="outline">Close</Button>} />
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

export function DrawerDemoScrollableContent() {
	return (
		<Drawer direction="right">
			<DrawerTrigger render={<Button variant="outline" />}>Scrollable Content</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>Move Goal</DrawerTitle>
					<DrawerDescription>Set your daily activity goal.</DrawerDescription>
				</DrawerHeader>
				<div className="no-scrollbar flex flex-col gap-4 overflow-y-auto px-4 style-lyra:gap-2">
					{Array.from({ length: 10 }).map((_, index) => (
						<p
							key={index}
							className="style-lyra:leading-relaxed leading-normal"
						>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
							eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
							enim ad minim veniam, quis nostrud exercitation ullamco laboris
							nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
							in reprehenderit in voluptate velit esse cillum dolore eu fugiat
							nulla pariatur. Excepteur sint occaecat cupidatat non proident,
							sunt in culpa qui officia deserunt mollit anim id est laborum.
						</p>
					))}
				</div>
				<DrawerFooter>
					<Button>Submit</Button>
					<DrawerClose render={<Button variant="outline" />}>Cancel</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

export function DrawerDemoSides() {
	const DRAWER_SIDES = ["top", "right", "bottom", "left"] as const;

	return (
		<div className="flex flex-wrap gap-2">
			{DRAWER_SIDES.map((side) => (
				<Drawer
					key={side}
					direction={
						side === "bottom" ? undefined : (side as "top" | "right" | "left")
					}
				>
					<DrawerTrigger render={<Button variant="outline" className="capitalize" />}>{side}</DrawerTrigger>
					<DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[50vh] data-[vaul-drawer-direction=top]:max-h-[50vh]">
						<DrawerHeader>
							<DrawerTitle>Move Goal</DrawerTitle>
							<DrawerDescription>
								Set your daily activity goal.
							</DrawerDescription>
						</DrawerHeader>
				<div className="no-scrollbar flex flex-col gap-4 overflow-y-auto px-4 style-lyra:gap-2">
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
						<DrawerFooter>
							<Button>Submit</Button>
							<DrawerClose render={<Button variant="outline" />}>Cancel</DrawerClose>
						</DrawerFooter>
					</DrawerContent>
				</Drawer>
			))}
		</div>
	);
}

export function DrawerDemoWithForm() {
	return (
		<Drawer>
			<DrawerTrigger render={<Button variant="outline">Set goal</Button>} />
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>Set your daily goal</DrawerTitle>
					<DrawerDescription>
						Define what you want to achieve today.
					</DrawerDescription>
				</DrawerHeader>
				<div className="px-4">
					<div className="grid gap-1.5">
						<Label htmlFor="goal">Goal</Label>
						<Input id="goal" placeholder="e.g. Complete 5 tasks" />
					</div>
				</div>
				<DrawerFooter>
					<Button>Submit</Button>
					<DrawerClose render={<Button variant="outline">Cancel</Button>} />
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
