"use client";

import { ChartBarIcon, ChartLineIcon, ChartPieIcon } from "@/components/ui/vpk-icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SelectDemo() {
	return (
		<Select defaultValue="apple">
			<SelectTrigger>
				<SelectValue placeholder="Pick a fruit" />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					<SelectItem value="apple">Apple</SelectItem>
					<SelectItem value="banana">Banana</SelectItem>
					<SelectItem value="cherry">Cherry</SelectItem>
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}

export function SelectDemoBasic() {
	const items = [
		{ label: "Select a fruit", value: null },
		{ label: "Apple", value: "apple" },
		{ label: "Banana", value: "banana" },
		{ label: "Blueberry", value: "blueberry" },
		{ label: "Grapes", value: "grapes" },
		{ label: "Pineapple", value: "pineapple" },
	];
	return (
		<Select items={items}>
			<SelectTrigger>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					{items.map((item) => (
						<SelectItem key={item.value} value={item.value}>
							{item.label}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}

export function SelectDemoDefault() {
	return (
		<Select>
			<SelectTrigger>
				<SelectValue placeholder="Select a fruit" />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					<SelectItem value="apple">Apple</SelectItem>
					<SelectItem value="banana">Banana</SelectItem>
					<SelectItem value="cherry">Cherry</SelectItem>
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}

export function SelectDemoDisabled() {
	const items = [
		{ label: "Select a fruit", value: null },
		{ label: "Apple", value: "apple" },
		{ label: "Banana", value: "banana" },
		{ label: "Blueberry", value: "blueberry" },
		{ label: "Grapes", value: "grapes", disabled: true },
		{ label: "Pineapple", value: "pineapple" },
	];
	return (
		<Select items={items} disabled>
			<SelectTrigger>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					{items.map((item) => (
						<SelectItem
							key={item.value}
							value={item.value}
							disabled={item.disabled}
						>
							{item.label}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}

export function SelectDemoGrouped() {
	return (
		<Select>
			<SelectTrigger>
				<SelectValue placeholder="Select a food" />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					<SelectLabel>Fruits</SelectLabel>
					<SelectItem value="apple">Apple</SelectItem>
					<SelectItem value="banana">Banana</SelectItem>
					<SelectItem value="cherry">Cherry</SelectItem>
				</SelectGroup>
				<SelectGroup>
					<SelectLabel>Vegetables</SelectLabel>
					<SelectItem value="carrot">Carrot</SelectItem>
					<SelectItem value="broccoli">Broccoli</SelectItem>
					<SelectItem value="spinach">Spinach</SelectItem>
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}

export function SelectDemoInDialog() {
	const items = [
		{ label: "Select a fruit", value: null },
		{ label: "Apple", value: "apple" },
		{ label: "Banana", value: "banana" },
		{ label: "Blueberry", value: "blueberry" },
		{ label: "Grapes", value: "grapes" },
		{ label: "Pineapple", value: "pineapple" },
	];
	return (
		<Dialog>
			<DialogTrigger render={<Button variant="outline" />}>
				Open Dialog
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Select Demo</DialogTitle>
					<DialogDescription>
						Use the select below to choose a fruit.
					</DialogDescription>
				</DialogHeader>
				<Select items={items}>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							{items.map((item) => (
								<SelectItem key={item.value} value={item.value}>
									{item.label}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
			</DialogContent>
		</Dialog>
	);
}

export function SelectDemoInlineWithInputNativeselect() {
	const items = [
		{ label: "Filter", value: null },
		{ label: "All", value: "all" },
		{ label: "Active", value: "active" },
		{ label: "Inactive", value: "inactive" },
	];
	return (
		<div className="flex items-center gap-2">
			<Input placeholder="Search..." className="flex-1" />
			<Select items={items}>
				<SelectTrigger className="w-[140px]">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						{items.map((item) => (
							<SelectItem key={item.value} value={item.value}>
								{item.label}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
			<NativeSelect className="w-[140px]">
				<NativeSelectOption value="">Sort by</NativeSelectOption>
				<NativeSelectOption value="name">Name</NativeSelectOption>
				<NativeSelectOption value="date">Date</NativeSelectOption>
				<NativeSelectOption value="status">Status</NativeSelectOption>
			</NativeSelect>
		</div>
	);
}

export function SelectDemoInvalid() {
	const items = [
		{ label: "Select a fruit", value: null },
		{ label: "Apple", value: "apple" },
		{ label: "Banana", value: "banana" },
		{ label: "Blueberry", value: "blueberry" },
		{ label: "Grapes", value: "grapes" },
		{ label: "Pineapple", value: "pineapple" },
	];
	return (
		<div className="flex flex-col gap-4">
			<Select items={items}>
				<SelectTrigger aria-invalid="true">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						{items.map((item) => (
							<SelectItem key={item.value} value={item.value}>
								{item.label}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
			<Field data-invalid>
				<FieldLabel htmlFor="select-fruit-invalid">Favorite Fruit</FieldLabel>
				<Select items={items}>
					<SelectTrigger id="select-fruit-invalid" aria-invalid>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							{items.map((item) => (
								<SelectItem key={item.value} value={item.value}>
									{item.label}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
				<FieldError errors={[{ message: "Please select a valid fruit." }]} />
			</Field>
		</div>
	);
}

export function SelectDemoItemAligned() {
	const items = [
		{ label: "Select a fruit", value: null },
		{ label: "Apple", value: "apple" },
		{ label: "Banana", value: "banana" },
		{ label: "Blueberry", value: "blueberry" },
		{ label: "Grapes", value: "grapes", disabled: true },
		{ label: "Pineapple", value: "pineapple" },
	];
	return (
		<Select items={items}>
			<SelectTrigger>
				<SelectValue />
			</SelectTrigger>
			<SelectContent alignItemWithTrigger={true}>
				<SelectGroup>
					{items.map((item) => (
						<SelectItem
							key={item.value}
							value={item.value}
							disabled={item.disabled}
						>
							{item.label}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}

export function SelectDemoLargeList() {
	const items = [
		{ label: "Select an item", value: null },
		...Array.from({ length: 100 }).map((_, i) => ({
			label: `Item ${i}`,
			value: `item-${i}`,
		})),
	];
	return (
		<Select items={items}>
			<SelectTrigger>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					{items.map((item) => (
						<SelectItem key={item.value} value={item.value}>
							{item.label}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}

export function SelectDemoMultipleSelection() {
	const items = [
		{ label: "Apple", value: "apple" },
		{ label: "Banana", value: "banana" },
		{ label: "Blueberry", value: "blueberry" },
		{ label: "Grapes", value: "grapes" },
		{ label: "Pineapple", value: "pineapple" },
		{ label: "Strawberry", value: "strawberry" },
		{ label: "Watermelon", value: "watermelon" },
	];
	return (
		<Select items={items} multiple defaultValue={[]}>
			<SelectTrigger className="w-72">
				<SelectValue>
					{(value: string[]) => {
						if (value.length === 0) {
							return "Select fruits";
						}
						if (value.length === 1) {
							return items.find((item) => item.value === value[0])?.label;
						}
						return `${value.length} fruits selected`;
					}}
				</SelectValue>
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					{items.map((item) => (
						<SelectItem key={item.value} value={item.value}>
							{item.label}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}

export function SelectDemoSides() {
	const items = [
		{ label: "Select", value: null },
		{ label: "Apple", value: "apple" },
		{ label: "Banana", value: "banana" },
		{ label: "Blueberry", value: "blueberry" },
	];
	return (
		<div className="flex flex-wrap justify-center gap-2">
			{(
				[
					"inline-start",
					"left",
					"top",
					"bottom",
					"right",
					"inline-end",
				] as const
			).map((side) => (
				<Select key={side} items={items}>
					<SelectTrigger className="w-28 capitalize">
						<SelectValue placeholder={side.replace("-", " ")} />
					</SelectTrigger>
					<SelectContent side={side} alignItemWithTrigger={false}>
						<SelectGroup>
							{items.map((item) => (
								<SelectItem key={item.value} value={item.value}>
									{item.label}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
			))}
		</div>
	);
}

export function SelectDemoSizes() {
	const items = [
		{ label: "Select a fruit", value: null },
		{ label: "Apple", value: "apple" },
		{ label: "Banana", value: "banana" },
		{ label: "Blueberry", value: "blueberry" },
	];
	return (
		<div className="flex flex-col gap-4">
			<Select items={items}>
				<SelectTrigger size="sm">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						{items.map((item) => (
							<SelectItem key={item.value} value={item.value}>
								{item.label}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
			<Select items={items}>
				<SelectTrigger size="default">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						{items.map((item) => (
							<SelectItem key={item.value} value={item.value}>
								{item.label}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
		</div>
	);
}

export function SelectDemoSmall() {
	return (
		<Select>
			<SelectTrigger size="sm">
				<SelectValue placeholder="Select a fruit" />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					<SelectItem value="apple">Apple</SelectItem>
					<SelectItem value="banana">Banana</SelectItem>
					<SelectItem value="cherry">Cherry</SelectItem>
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}

const SUBSCRIPTION_PLANS = [
	{ name: "Free", price: "$0/mo", description: "For individuals getting started" },
	{ name: "Pro", price: "$19/mo", description: "For professionals and small teams" },
	{ name: "Enterprise", price: "$49/mo", description: "For large organizations" },
] as const;

function SelectPlanItem({ plan }: Readonly<{ plan: (typeof SUBSCRIPTION_PLANS)[number] }>) {
	return (
		<Item>
			<ItemContent>
				<ItemTitle>{plan.name}</ItemTitle>
				<ItemDescription>
					{plan.price} — {plan.description}
				</ItemDescription>
			</ItemContent>
		</Item>
	);
}

export function SelectDemoSubscriptionPlan() {
	return (
		<Select
			defaultValue={SUBSCRIPTION_PLANS[0]}
			itemToStringValue={(plan: (typeof SUBSCRIPTION_PLANS)[number]) => plan.name}
		>
			<SelectTrigger className="h-auto! w-72">
				<SelectValue>
					{(value: (typeof SUBSCRIPTION_PLANS)[number]) => <SelectPlanItem plan={value} />}
				</SelectValue>
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					{SUBSCRIPTION_PLANS.map((plan) => (
						<SelectItem key={plan.name} value={plan}>
							<SelectPlanItem plan={plan} />
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}

export function SelectDemoWithButton() {
	const items = [
		{ label: "Select a fruit", value: null },
		{ label: "Apple", value: "apple" },
		{ label: "Banana", value: "banana" },
		{ label: "Blueberry", value: "blueberry" },
	];
	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-2">
				<Select items={items}>
					<SelectTrigger size="sm">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							{items.map((item) => (
								<SelectItem key={item.value} value={item.value}>
									{item.label}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
				<Button variant="outline" size="sm">
					Submit
				</Button>
			</div>
			<div className="flex items-center gap-2">
				<Select items={items}>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							{items.map((item) => (
								<SelectItem key={item.value} value={item.value}>
									{item.label}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
				<Button variant="outline">Submit</Button>
			</div>
		</div>
	);
}

export function SelectDemoWithField() {
	const items = [
		{ label: "Select a fruit", value: null },
		{ label: "Apple", value: "apple" },
		{ label: "Banana", value: "banana" },
		{ label: "Blueberry", value: "blueberry" },
		{ label: "Grapes", value: "grapes" },
		{ label: "Pineapple", value: "pineapple" },
	];
	return (
		<Field>
			<FieldLabel htmlFor="select-fruit">Favorite Fruit</FieldLabel>
			<Select items={items}>
				<SelectTrigger id="select-fruit">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						{items.map((item) => (
							<SelectItem key={item.value} value={item.value}>
								{item.label}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
			<FieldDescription>
				Choose your favorite fruit from the list.
			</FieldDescription>
		</Field>
	);
}

export function SelectDemoWithGroupsLabels() {
	const fruits = [
		{ label: "Apple", value: "apple" },
		{ label: "Banana", value: "banana" },
		{ label: "Blueberry", value: "blueberry" },
	];
	const vegetables = [
		{ label: "Carrot", value: "carrot" },
		{ label: "Broccoli", value: "broccoli" },
		{ label: "Spinach", value: "spinach" },
	];
	const allItems = [
		{ label: "Select a fruit", value: null },
		...fruits,
		...vegetables,
	];
	return (
		<Select items={allItems}>
			<SelectTrigger>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					<SelectLabel>Fruits</SelectLabel>
					{fruits.map((item) => (
						<SelectItem key={item.value} value={item.value}>
							{item.label}
						</SelectItem>
					))}
				</SelectGroup>
				<SelectSeparator />
				<SelectGroup>
					<SelectLabel>Vegetables</SelectLabel>
					{vegetables.map((item) => (
						<SelectItem key={item.value} value={item.value}>
							{item.label}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}

export function SelectDemoWithIcons() {
	const items = [
		{
			label: (
				<>
					<ChartLineIcon />
					Chart Type
				</>
			),
			value: null,
		},
		{
			label: (
				<>
					<ChartLineIcon />
					Line
				</>
			),
			value: "line",
		},
		{
			label: (
				<>
					<ChartBarIcon />
					Bar
				</>
			),
			value: "bar",
		},
		{
			label: (
				<>
					<ChartPieIcon />
					Pie
				</>
			),
			value: "pie",
		},
	];
	return (
		<div className="flex flex-col gap-4">
			<Select items={items}>
				<SelectTrigger size="sm">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						{items.map((item) => (
							<SelectItem key={item.value} value={item.value}>
								{item.label}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
			<Select items={items}>
				<SelectTrigger size="default">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						{items.map((item) => (
							<SelectItem key={item.value} value={item.value}>
								{item.label}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
		</div>
	);
}
