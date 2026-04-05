"use client";

import { type FormEvent, useState } from "react";
import { ChevronDownIcon, GlobeIcon } from "@/components/ui/vpk-icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Combobox, ComboboxChip, ComboboxChips, ComboboxChipsInput, ComboboxCollection, ComboboxContent, ComboboxEmpty, ComboboxGroup, ComboboxInput, ComboboxItem, ComboboxLabel, ComboboxList, ComboboxSeparator, ComboboxTrigger, ComboboxValue, useComboboxAnchor } from "@/components/ui/combobox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SonnerToast, type SonnerToastAppearance } from "@/components/ui/sonner";

function showComboboxToast(title: string, appearance: SonnerToastAppearance = "neutral") {
	toast.custom((id) => (
		<SonnerToast
			appearance={appearance}
			title={title}
			dismissible
			onDismiss={() => toast.dismiss(id)}
		/>
	));
}

export default function ComboboxDemo() {
	return (
		<Combobox>
			<ComboboxInput placeholder="Select framework..." className="w-48" />
			<ComboboxContent>
				<ComboboxItem value="react">React</ComboboxItem>
				<ComboboxItem value="vue">Vue</ComboboxItem>
				<ComboboxItem value="angular">Angular</ComboboxItem>
				<ComboboxItem value="svelte">Svelte</ComboboxItem>
			</ComboboxContent>
		</Combobox>
	);
}

export function ComboboxDemoBasic() {
	const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"] as const;

	return (
		<Combobox items={frameworks}>
			<ComboboxInput placeholder="Select a framework" />
			<ComboboxContent>
				<ComboboxEmpty>No items found.</ComboboxEmpty>
				<ComboboxList>
					{(item) => (
						<ComboboxItem key={item} value={item}>
							{item}
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}

export function ComboboxDemoDefault() {
	return (
		<Combobox>
			<ComboboxInput showTrigger placeholder="Search framework..." />
			<ComboboxContent>
				<ComboboxList>
					<ComboboxItem value="react">React</ComboboxItem>
					<ComboboxItem value="vue">Vue</ComboboxItem>
					<ComboboxItem value="angular">Angular</ComboboxItem>
					<ComboboxItem value="svelte">Svelte</ComboboxItem>
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}

export function ComboboxDemoDisabledItems() {
	const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"] as const;
	const disabledFrameworks = ["Nuxt.js", "Remix"];

	return (
		<Combobox items={frameworks}>
			<ComboboxInput placeholder="Select a framework" />
			<ComboboxContent>
				<ComboboxEmpty>No items found.</ComboboxEmpty>
				<ComboboxList>
					{(item) => (
						<ComboboxItem
							key={item}
							value={item}
							disabled={disabledFrameworks.includes(item)}
						>
							{item}
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}

export function ComboboxDemoDisabled() {
	const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"] as const;

	return (
		<Combobox items={frameworks}>
			<ComboboxInput placeholder="Select a framework" disabled />
			<ComboboxContent>
				<ComboboxEmpty>No items found.</ComboboxEmpty>
				<ComboboxList>
					{(item) => (
						<ComboboxItem key={item} value={item}>
							{item}
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}

export function ComboboxDemoFormWithCombobox() {
	const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"] as const;

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.target as HTMLFormElement);
		const framework = formData.get("framework") as string;
		showComboboxToast(`You selected ${framework} as your framework.`, "success");
	};

	return (
		<Card className="w-full max-w-sm" size="sm">
			<CardContent>
				<form
					id="form-with-combobox"
					className="w-full"
					onSubmit={handleSubmit}
				>
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor="framework">Framework</FieldLabel>
							<Combobox items={frameworks}>
								<ComboboxInput
									id="framework"
									name="framework"
									placeholder="Select a framework"
									required
								/>
								<ComboboxContent>
									<ComboboxEmpty>No items found.</ComboboxEmpty>
									<ComboboxList>
										{(item) => (
											<ComboboxItem key={item} value={item}>
												{item}
											</ComboboxItem>
										)}
									</ComboboxList>
								</ComboboxContent>
							</Combobox>
						</Field>
					</FieldGroup>
				</form>
			</CardContent>
			<CardFooter>
				<Button type="submit" form="form-with-combobox">
					Submit
				</Button>
			</CardFooter>
		</Card>
	);
}

export function ComboboxDemoGrouped() {
	return (
		<Combobox>
			<ComboboxInput showTrigger placeholder="Search framework..." />
			<ComboboxContent>
				<ComboboxList>
					<ComboboxGroup>
						<ComboboxLabel>Frontend</ComboboxLabel>
						<ComboboxItem value="react">React</ComboboxItem>
						<ComboboxItem value="vue">Vue</ComboboxItem>
						<ComboboxItem value="angular">Angular</ComboboxItem>
					</ComboboxGroup>
					<ComboboxGroup>
						<ComboboxLabel>Backend</ComboboxLabel>
						<ComboboxItem value="express">Express</ComboboxItem>
						<ComboboxItem value="fastify">Fastify</ComboboxItem>
						<ComboboxItem value="nest">NestJS</ComboboxItem>
					</ComboboxGroup>
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}

export function ComboboxDemoInDialog() {
	const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"] as const;

	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button variant="outline" />}>
				Open Dialog
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Select Framework</DialogTitle>
					<DialogDescription>
						Choose your preferred framework from the list below.
					</DialogDescription>
				</DialogHeader>
				<Field>
					<FieldLabel htmlFor="framework-dialog" className="sr-only">
						Framework
					</FieldLabel>
					<Combobox items={frameworks}>
						<ComboboxInput
							id="framework-dialog"
							placeholder="Select a framework"
						/>
						<ComboboxContent>
							<ComboboxEmpty>No items found.</ComboboxEmpty>
							<ComboboxList>
								{(item) => (
									<ComboboxItem key={item} value={item}>
										{item}
									</ComboboxItem>
								)}
							</ComboboxList>
						</ComboboxContent>
					</Combobox>
				</Field>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => setOpen(false)}
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={() => {
							showComboboxToast("Framework selected.", "success");
							setOpen(false);
						}}
					>
						Confirm
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function ComboboxDemoInPopup() {
	const countries = [
		{ code: "", value: "", continent: "", label: "Select country" },
		{ code: "af", value: "afghanistan", label: "Afghanistan", continent: "Asia" },
		{ code: "al", value: "albania", label: "Albania", continent: "Europe" },
		{ code: "dz", value: "algeria", label: "Algeria", continent: "Africa" },
		{ code: "au", value: "australia", label: "Australia", continent: "Oceania" },
		{ code: "br", value: "brazil", label: "Brazil", continent: "South America" },
		{ code: "ca", value: "canada", label: "Canada", continent: "North America" },
		{ code: "cn", value: "china", label: "China", continent: "Asia" },
		{ code: "fr", value: "france", label: "France", continent: "Europe" },
		{ code: "de", value: "germany", label: "Germany", continent: "Europe" },
		{ code: "in", value: "india", label: "India", continent: "Asia" },
		{ code: "jp", value: "japan", label: "Japan", continent: "Asia" },
		{ code: "mx", value: "mexico", label: "Mexico", continent: "North America" },
		{ code: "ng", value: "nigeria", label: "Nigeria", continent: "Africa" },
		{ code: "gb", value: "united-kingdom", label: "United Kingdom", continent: "Europe" },
		{ code: "us", value: "united-states", label: "United States", continent: "North America" },
	];

	return (
		<Combobox items={countries} defaultValue={countries[0]}>
			<ComboboxTrigger
				render={
					<Button
						variant="outline"
						className="w-64 justify-between font-normal"
					/>
				}
			>
				<ComboboxValue />
			</ComboboxTrigger>
			<ComboboxContent>
				<ComboboxInput showTrigger={false} placeholder="Search" />
				<ComboboxEmpty>No items found.</ComboboxEmpty>
				<ComboboxList>
					{(item) => (
						<ComboboxItem key={item.code} value={item}>
							{item.label}
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}

export function ComboboxDemoInvalid() {
	const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"] as const;

	return (
		<div className="flex flex-col gap-4">
			<Combobox items={frameworks}>
				<ComboboxInput placeholder="Select a framework" aria-invalid="true" />
				<ComboboxContent>
					<ComboboxEmpty>No items found.</ComboboxEmpty>
					<ComboboxList>
						{(item) => (
							<ComboboxItem key={item} value={item}>
								{item}
							</ComboboxItem>
						)}
					</ComboboxList>
				</ComboboxContent>
			</Combobox>
			<Field data-invalid>
				<FieldLabel htmlFor="combobox-framework-invalid">
					Framework
				</FieldLabel>
				<Combobox items={frameworks}>
					<ComboboxInput
						id="combobox-framework-invalid"
						placeholder="Select a framework"
						aria-invalid
					/>
					<ComboboxContent>
						<ComboboxEmpty>No items found.</ComboboxEmpty>
						<ComboboxList>
							{(item) => (
								<ComboboxItem key={item} value={item}>
									{item}
								</ComboboxItem>
							)}
						</ComboboxList>
					</ComboboxContent>
				</Combobox>
				<FieldDescription>Please select a valid framework.</FieldDescription>
				<FieldError errors={[{ message: "This field is required." }]} />
			</Field>
		</div>
	);
}

export function ComboboxDemoLargeList() {
	const largeListItems = Array.from({ length: 100 }, (_, i) => `Item ${i + 1}`);

	return (
		<Combobox items={largeListItems}>
			<ComboboxInput placeholder="Search from 100 items" />
			<ComboboxContent>
				<ComboboxEmpty>No items found.</ComboboxEmpty>
				<ComboboxList>
					{(item) => (
						<ComboboxItem key={item} value={item}>
							{item}
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}

export function ComboboxDemoMultipleDisabled() {
	const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"] as const;
	const anchor = useComboboxAnchor();

	return (
		<Combobox
			multiple
			autoHighlight
			items={frameworks}
			defaultValue={[frameworks[0], frameworks[1]]}
			disabled
		>
			<ComboboxChips ref={anchor}>
				<ComboboxValue>
					{(values) => (
						<>
							{values.map((value: string) => (
								<ComboboxChip key={value}>{value}</ComboboxChip>
							))}
							<ComboboxChipsInput disabled />
						</>
					)}
				</ComboboxValue>
			</ComboboxChips>
			<ComboboxContent anchor={anchor}>
				<ComboboxEmpty>No items found.</ComboboxEmpty>
				<ComboboxList>
					{(item) => (
						<ComboboxItem key={item} value={item}>
							{item}
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}

export function ComboboxDemoMultipleInvalid() {
	const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"] as const;
	const anchor1 = useComboboxAnchor();
	const anchor2 = useComboboxAnchor();

	return (
		<div className="flex flex-col gap-4">
			<Combobox
				multiple
				autoHighlight
				items={frameworks}
				defaultValue={[frameworks[0], frameworks[1]]}
			>
				<ComboboxChips ref={anchor1}>
					<ComboboxValue>
						{(values) => (
							<>
								{values.map((value: string) => (
									<ComboboxChip key={value}>{value}</ComboboxChip>
								))}
								<ComboboxChipsInput aria-invalid="true" />
							</>
						)}
					</ComboboxValue>
				</ComboboxChips>
				<ComboboxContent anchor={anchor1}>
					<ComboboxEmpty>No items found.</ComboboxEmpty>
					<ComboboxList>
						{(item) => (
							<ComboboxItem key={item} value={item}>
								{item}
							</ComboboxItem>
						)}
					</ComboboxList>
				</ComboboxContent>
			</Combobox>
			<Field data-invalid>
				<FieldLabel htmlFor="combobox-multiple-invalid">
					Frameworks
				</FieldLabel>
				<Combobox
					multiple
					autoHighlight
					items={frameworks}
					defaultValue={[frameworks[0], frameworks[1], frameworks[2]]}
				>
					<ComboboxChips ref={anchor2}>
						<ComboboxValue>
							{(values) => (
								<>
									{values.map((value: string) => (
										<ComboboxChip key={value}>{value}</ComboboxChip>
									))}
									<ComboboxChipsInput
										id="combobox-multiple-invalid"
										aria-invalid
									/>
								</>
							)}
						</ComboboxValue>
					</ComboboxChips>
					<ComboboxContent anchor={anchor2}>
						<ComboboxEmpty>No items found.</ComboboxEmpty>
						<ComboboxList>
							{(item) => (
								<ComboboxItem key={item} value={item}>
									{item}
								</ComboboxItem>
							)}
						</ComboboxList>
					</ComboboxContent>
				</Combobox>
				<FieldDescription>
					Please select at least one framework.
				</FieldDescription>
				<FieldError errors={[{ message: "This field is required." }]} />
			</Field>
		</div>
	);
}

export function ComboboxDemoMultipleNoRemove() {
	const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"] as const;
	const anchor = useComboboxAnchor();

	return (
		<Combobox
			multiple
			autoHighlight
			items={frameworks}
			defaultValue={[frameworks[0], frameworks[1]]}
		>
			<ComboboxChips ref={anchor}>
				<ComboboxValue>
					{(values) => (
						<>
							{values.map((value: string) => (
								<ComboboxChip key={value} showRemove={false}>
									{value}
								</ComboboxChip>
							))}
							<ComboboxChipsInput />
						</>
					)}
				</ComboboxValue>
			</ComboboxChips>
			<ComboboxContent anchor={anchor}>
				<ComboboxEmpty>No items found.</ComboboxEmpty>
				<ComboboxList>
					{(item) => (
						<ComboboxItem key={item} value={item}>
							{item}
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}

export function ComboboxDemoMultiple() {
	const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"] as const;
	const anchor = useComboboxAnchor();

	return (
		<Combobox
			multiple
			autoHighlight
			items={frameworks}
			defaultValue={[frameworks[0]]}
		>
			<ComboboxChips ref={anchor}>
				<ComboboxValue>
					{(values) => (
						<>
							{values.map((value: string) => (
								<ComboboxChip key={value}>{value}</ComboboxChip>
							))}
							<ComboboxChipsInput />
						</>
					)}
				</ComboboxValue>
			</ComboboxChips>
			<ComboboxContent anchor={anchor}>
				<ComboboxEmpty>No items found.</ComboboxEmpty>
				<ComboboxList>
					{(item) => (
						<ComboboxItem key={item} value={item}>
							{item}
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}

export function ComboboxDemoSides() {
	const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"] as const;

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
				<Combobox key={side} items={frameworks}>
					<ComboboxInput
						placeholder={side.replace("-", " ")}
						className="w-32 **:data-[slot=input-group-control]:capitalize"
					/>
					<ComboboxContent side={side}>
						<ComboboxEmpty>No items found.</ComboboxEmpty>
						<ComboboxList>
							{(item) => (
								<ComboboxItem key={item} value={item}>
									{item}
								</ComboboxItem>
							)}
						</ComboboxList>
					</ComboboxContent>
				</Combobox>
			))}
		</div>
	);
}

export function ComboboxDemoWithAutoHighlight() {
	const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"] as const;

	return (
		<Combobox items={frameworks} autoHighlight>
			<ComboboxInput placeholder="Select a framework" />
			<ComboboxContent>
				<ComboboxEmpty>No items found.</ComboboxEmpty>
				<ComboboxList>
					{(item) => (
						<ComboboxItem key={item} value={item}>
							{item}
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}

export function ComboboxDemoWithClearButton() {
	const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"] as const;

	return (
		<Combobox items={frameworks} defaultValue={frameworks[0]}>
			<ComboboxInput placeholder="Select a framework" showClear />
			<ComboboxContent>
				<ComboboxEmpty>No items found.</ComboboxEmpty>
				<ComboboxList>
					{(item) => (
						<ComboboxItem key={item} value={item}>
							{item}
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}

export function ComboboxDemoWithCustomItemRendering() {
	const countries = [
		{ code: "au", value: "australia", label: "Australia", continent: "Oceania" },
		{ code: "br", value: "brazil", label: "Brazil", continent: "South America" },
		{ code: "ca", value: "canada", label: "Canada", continent: "North America" },
		{ code: "cn", value: "china", label: "China", continent: "Asia" },
		{ code: "fr", value: "france", label: "France", continent: "Europe" },
		{ code: "de", value: "germany", label: "Germany", continent: "Europe" },
		{ code: "in", value: "india", label: "India", continent: "Asia" },
		{ code: "jp", value: "japan", label: "Japan", continent: "Asia" },
		{ code: "mx", value: "mexico", label: "Mexico", continent: "North America" },
		{ code: "ng", value: "nigeria", label: "Nigeria", continent: "Africa" },
		{ code: "gb", value: "united-kingdom", label: "United Kingdom", continent: "Europe" },
		{ code: "us", value: "united-states", label: "United States", continent: "North America" },
	];

	return (
		<Combobox
			items={countries}
			itemToStringValue={(country: (typeof countries)[number]) =>
				country.label
			}
		>
			<ComboboxInput placeholder="Search countries..." />
			<ComboboxContent>
				<ComboboxEmpty>No countries found.</ComboboxEmpty>
				<ComboboxList>
					{(country) => (
						<ComboboxItem key={country.code} value={country}>
							<Item size="xs" className="p-0">
								<ItemContent>
									<ItemTitle className="whitespace-nowrap">
										{country.label}
									</ItemTitle>
									<ItemDescription>
										{country.continent} ({country.code})
									</ItemDescription>
								</ItemContent>
							</Item>
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}

export function ComboboxDemoWithGroupsAndSeparator() {
	const timezones = [
		{
			value: "Americas",
			items: [
				"(GMT-5) New York",
				"(GMT-8) Los Angeles",
				"(GMT-6) Chicago",
				"(GMT-5) Toronto",
				"(GMT-8) Vancouver",
				"(GMT-3) Sao Paulo",
			],
		},
		{
			value: "Europe",
			items: [
				"(GMT+0) London",
				"(GMT+1) Paris",
				"(GMT+1) Berlin",
				"(GMT+1) Rome",
				"(GMT+1) Madrid",
				"(GMT+1) Amsterdam",
			],
		},
		{
			value: "Asia/Pacific",
			items: [
				"(GMT+9) Tokyo",
				"(GMT+8) Shanghai",
				"(GMT+8) Singapore",
				"(GMT+4) Dubai",
				"(GMT+11) Sydney",
				"(GMT+9) Seoul",
			],
		},
	] as const;

	return (
		<Combobox items={timezones}>
			<ComboboxInput placeholder="Select a timezone" />
			<ComboboxContent>
				<ComboboxEmpty>No timezones found.</ComboboxEmpty>
				<ComboboxList>
					{(group) => (
						<ComboboxGroup key={group.value} items={group.items}>
							<ComboboxLabel>{group.value}</ComboboxLabel>
							<ComboboxCollection>
								{(item) => (
									<ComboboxItem key={item} value={item}>
										{item}
									</ComboboxItem>
								)}
							</ComboboxCollection>
							<ComboboxSeparator />
						</ComboboxGroup>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}

export function ComboboxDemoWithGroups() {
	const timezones = [
		{
			value: "Americas",
			items: [
				"(GMT-5) New York",
				"(GMT-8) Los Angeles",
				"(GMT-6) Chicago",
				"(GMT-5) Toronto",
				"(GMT-8) Vancouver",
				"(GMT-3) Sao Paulo",
			],
		},
		{
			value: "Europe",
			items: [
				"(GMT+0) London",
				"(GMT+1) Paris",
				"(GMT+1) Berlin",
				"(GMT+1) Rome",
				"(GMT+1) Madrid",
				"(GMT+1) Amsterdam",
			],
		},
		{
			value: "Asia/Pacific",
			items: [
				"(GMT+9) Tokyo",
				"(GMT+8) Shanghai",
				"(GMT+8) Singapore",
				"(GMT+4) Dubai",
				"(GMT+11) Sydney",
				"(GMT+9) Seoul",
			],
		},
	] as const;

	return (
		<Combobox items={timezones}>
			<ComboboxInput placeholder="Select a timezone" />
			<ComboboxContent>
				<ComboboxEmpty>No timezones found.</ComboboxEmpty>
				<ComboboxList>
					{(group) => (
						<ComboboxGroup key={group.value} items={group.items}>
							<ComboboxLabel>{group.value}</ComboboxLabel>
							<ComboboxCollection>
								{(item) => (
									<ComboboxItem key={item} value={item}>
										{item}
									</ComboboxItem>
								)}
							</ComboboxCollection>
						</ComboboxGroup>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}

export function ComboboxDemoWithIconAddon() {
	const timezones = [
		{
			value: "Americas",
			items: [
				"(GMT-5) New York",
				"(GMT-8) Los Angeles",
				"(GMT-6) Chicago",
				"(GMT-5) Toronto",
				"(GMT-8) Vancouver",
				"(GMT-3) Sao Paulo",
			],
		},
		{
			value: "Europe",
			items: [
				"(GMT+0) London",
				"(GMT+1) Paris",
				"(GMT+1) Berlin",
				"(GMT+1) Rome",
				"(GMT+1) Madrid",
				"(GMT+1) Amsterdam",
			],
		},
		{
			value: "Asia/Pacific",
			items: [
				"(GMT+9) Tokyo",
				"(GMT+8) Shanghai",
				"(GMT+8) Singapore",
				"(GMT+4) Dubai",
				"(GMT+11) Sydney",
				"(GMT+9) Seoul",
			],
		},
	] as const;

	return (
		<Combobox items={timezones}>
			<ComboboxInput placeholder="Select a timezone">
				<InputGroupAddon>
					<GlobeIcon />
				</InputGroupAddon>
			</ComboboxInput>
			<ComboboxContent alignOffset={-28} className="w-60">
				<ComboboxEmpty>No timezones found.</ComboboxEmpty>
				<ComboboxList>
					{(group) => (
						<ComboboxGroup key={group.value} items={group.items}>
							<ComboboxLabel>{group.value}</ComboboxLabel>
							<ComboboxCollection>
								{(item) => (
									<ComboboxItem key={item} value={item}>
										{item}
									</ComboboxItem>
								)}
							</ComboboxCollection>
						</ComboboxGroup>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}

export function ComboboxDemoWithOtherInputs() {
	const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"] as const;
	const items = [
		{ label: "Select a framework", value: null },
		{ label: "React", value: "react" },
		{ label: "Vue", value: "vue" },
		{ label: "Angular", value: "angular" },
		{ label: "Svelte", value: "svelte" },
		{ label: "Solid", value: "solid" },
		{ label: "Preact", value: "preact" },
		{ label: "Next.js", value: "next.js" },
	];

	return (
		<>
			<Combobox items={frameworks}>
				<ComboboxInput placeholder="Select a framework" className="w-52" />
				<ComboboxContent>
					<ComboboxEmpty>No items found.</ComboboxEmpty>
					<ComboboxList>
						{(item) => (
							<ComboboxItem key={item} value={item}>
								{item}
							</ComboboxItem>
						)}
					</ComboboxList>
				</ComboboxContent>
			</Combobox>
			<Select items={items}>
				<SelectTrigger className="w-52">
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
			<Button
				variant="outline"
				className="text-muted-foreground w-52 justify-between font-normal"
			>
				Select a framework
				<ChevronDownIcon />
			</Button>
			<Input placeholder="Select a framework" className="w-52" />
			<InputGroup className="w-52">
				<InputGroupInput placeholder="Select a framework" />
				<InputGroupAddon align="inline-end">
					<ChevronDownIcon />
				</InputGroupAddon>
			</InputGroup>
		</>
	);
}
