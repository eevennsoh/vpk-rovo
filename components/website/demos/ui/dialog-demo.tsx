"use client";

import { useState } from "react";
import { InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldSeparator, FieldSet, FieldTitle } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function DialogDemo() {
	return (
		<Dialog>
			<DialogTrigger render={<Button variant="outline" size="sm" />}>
				Open dialog
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Dialog title</DialogTitle>
					<DialogDescription>This is a dialog description.</DialogDescription>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	);
}

export function DialogDemoChatSettings() {
	const themes = [
		{ value: "system", label: "System" },
		{ value: "light", label: "Light" },
		{ value: "dark", label: "Dark" },
	];

	const accents = [
		{ value: "default", label: "Default" },
		{ value: "blue", label: "Blue" },
		{ value: "green", label: "Green" },
		{ value: "purple", label: "Purple" },
		{ value: "orange", label: "Orange" },
	];

	const spokenLanguages = [
		{ value: "en", label: "English" },
		{ value: "es", label: "Spanish" },
		{ value: "fr", label: "French" },
		{ value: "de", label: "German" },
		{ value: "ja", label: "Japanese" },
		{ value: "zh", label: "Chinese" },
	];

	const voices = [
		{ value: "samantha", label: "Samantha" },
		{ value: "alex", label: "Alex" },
		{ value: "aria", label: "Aria" },
		{ value: "nova", label: "Nova" },
	];

	const [tab, setTab] = useState("general");
	const [theme, setTheme] = useState("system");
	const [accentColor, setAccentColor] = useState("default");
	const [spokenLanguage, setSpokenLanguage] = useState("en");
	const [voice, setVoice] = useState("samantha");

	return (
		<Dialog>
			<DialogTrigger render={<Button variant="outline" />}>
				Chat Settings
			</DialogTrigger>
			<DialogContent className="min-w-md">
				<DialogHeader>
					<DialogTitle>Chat Settings</DialogTitle>
					<DialogDescription>
						Customize your chat settings: theme, accent color, spoken
						language, voice, personality, and custom instructions.
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-4">
					<NativeSelect
						value={tab}
						onChange={(e) => setTab(e.target.value)}
						className="w-full md:hidden"
					>
						<NativeSelectOption value="general">General</NativeSelectOption>
						<NativeSelectOption value="notifications">
							Notifications
						</NativeSelectOption>
						<NativeSelectOption value="personalization">
							Personalization
						</NativeSelectOption>
						<NativeSelectOption value="security">Security</NativeSelectOption>
					</NativeSelect>
					<Tabs value={tab} onValueChange={setTab}>
						<TabsList className="hidden w-full md:flex">
							<TabsTrigger value="general">General</TabsTrigger>
							<TabsTrigger value="notifications">Notifications</TabsTrigger>
							<TabsTrigger value="personalization">
								Personalization
							</TabsTrigger>
							<TabsTrigger value="security">Security</TabsTrigger>
						</TabsList>
						<div className="style-nova:p-4 style-vega:p-6 style-maia:p-6 style-mira:p-4 style-lyra:p-4 style-vega:min-h-[550px] style-maia:min-h-[550px] style-mira:min-h-[450px] style-lyra:min-h-[450px] style-nova:min-h-[460px] style-nova:rounded-lg style-vega:rounded-lg style-maia:rounded-xl style-mira:rounded-md style-lyra:rounded-none border [&_[data-slot=select-trigger]]:min-w-[125px]">
							<TabsContent value="general">
								<FieldSet>
									<FieldGroup>
										<Field orientation="horizontal">
											<FieldLabel htmlFor="theme">Theme</FieldLabel>
											<Select
												items={themes}
												value={theme}
												onValueChange={(value) => setTheme(value as string)}
											>
												<SelectTrigger id="theme">
													<SelectValue />
												</SelectTrigger>
												<SelectContent align="end">
													<SelectGroup>
														{themes.map((theme) => (
															<SelectItem
																key={theme.value}
																value={theme.value}
															>
																{theme.label}
															</SelectItem>
														))}
													</SelectGroup>
												</SelectContent>
											</Select>
										</Field>
										<FieldSeparator />
										<Field orientation="horizontal">
											<FieldLabel htmlFor="accent-color">
												Accent Color
											</FieldLabel>
											<Select
												items={accents}
												value={accentColor}
												onValueChange={(value) =>
													setAccentColor(value as string)
												}
											>
												<SelectTrigger id="accent-color">
													<SelectValue />
												</SelectTrigger>
												<SelectContent align="end">
													<SelectGroup>
														{accents.map((accent) => (
															<SelectItem
																key={accent.value}
																value={accent.value}
															>
																{accent.label}
															</SelectItem>
														))}
													</SelectGroup>
												</SelectContent>
											</Select>
										</Field>
										<FieldSeparator />
										<Field orientation="responsive">
											<FieldContent>
												<FieldLabel htmlFor="spoken-language">
													Spoken Language
												</FieldLabel>
												<FieldDescription>
													For best results, select the language you mainly
													speak. If it&apos;s not listed, it may still be
													supported via auto-detection.
												</FieldDescription>
											</FieldContent>
											<Select
												items={spokenLanguages}
												value={spokenLanguage}
												onValueChange={(value) =>
													setSpokenLanguage(value as string)
												}
											>
												<SelectTrigger id="spoken-language">
													<SelectValue />
												</SelectTrigger>
												<SelectContent align="end">
													<SelectGroup>
														{spokenLanguages.map((language) => (
															<SelectItem
																key={language.value}
																value={language.value}
															>
																{language.label}
															</SelectItem>
														))}
													</SelectGroup>
												</SelectContent>
											</Select>
										</Field>
										<FieldSeparator />
										<Field orientation="horizontal">
											<FieldLabel htmlFor="voice">Voice</FieldLabel>
											<Select
												items={voices}
												value={voice}
												onValueChange={(value) => setVoice(value as string)}
											>
												<SelectTrigger id="voice">
													<SelectValue />
												</SelectTrigger>
												<SelectContent align="end">
													<SelectGroup>
														{voices.map((voice) => (
															<SelectItem
																key={voice.value}
																value={voice.value}
															>
																{voice.label}
															</SelectItem>
														))}
													</SelectGroup>
												</SelectContent>
											</Select>
										</Field>
									</FieldGroup>
								</FieldSet>
							</TabsContent>
							<TabsContent value="notifications">
								<FieldGroup>
									<FieldSet>
										<FieldLabel>Responses</FieldLabel>
										<FieldDescription>
											Get notified when ChatGPT responds to requests that take
											time, like research or image generation.
										</FieldDescription>
										<FieldGroup data-slot="checkbox-group">
											<Field orientation="horizontal">
												<Checkbox id="push" defaultChecked disabled />
												<FieldLabel htmlFor="push" className="font-normal">
													Push notifications
												</FieldLabel>
											</Field>
										</FieldGroup>
									</FieldSet>
									<FieldSeparator />
									<FieldSet>
										<FieldLabel>Tasks</FieldLabel>
										<FieldDescription>
											Get notified when tasks you&apos;ve created have
											updates. <a href="#">Manage tasks</a>
										</FieldDescription>
										<FieldGroup data-slot="checkbox-group">
											<Field orientation="horizontal">
												<Checkbox id="push-tasks" />
												<FieldLabel
													htmlFor="push-tasks"
													className="font-normal"
												>
													Push notifications
												</FieldLabel>
											</Field>
											<Field orientation="horizontal">
												<Checkbox id="email-tasks" />
												<FieldLabel
													htmlFor="email-tasks"
													className="font-normal"
												>
													Email notifications
												</FieldLabel>
											</Field>
										</FieldGroup>
									</FieldSet>
								</FieldGroup>
							</TabsContent>
							<TabsContent value="personalization">
								<FieldGroup>
									<Field orientation="responsive">
										<FieldLabel htmlFor="nickname">Nickname</FieldLabel>
										<InputGroup>
											<InputGroupInput
												id="nickname"
												placeholder="Broski"
												className="@md/field-group:max-w-[200px]"
											/>
											<InputGroupAddon align="inline-end">
												<Tooltip>
													<TooltipTrigger
														render={<InputGroupButton size="icon-xs" />}
													>
														<InfoIcon />
													</TooltipTrigger>
													<TooltipContent className="flex items-center gap-2">
														Used to identify you in the chat. <Kbd>N</Kbd>
													</TooltipContent>
												</Tooltip>
											</InputGroupAddon>
										</InputGroup>
									</Field>
									<FieldSeparator />
									<Field
										orientation="responsive"
										className="@md/field-group:flex-col @2xl/field-group:flex-row"
									>
										<FieldContent>
											<FieldLabel htmlFor="about">More about you</FieldLabel>
											<FieldDescription>
												Tell us more about yourself. This will be used to help
												us personalize your experience.
											</FieldDescription>
										</FieldContent>
										<Textarea
											id="about"
											placeholder="I'm a software engineer..."
											className="min-h-[120px] @md/field-group:min-w-full @2xl/field-group:min-w-[300px]"
										/>
									</Field>
									<FieldSeparator />
									<FieldLabel>
										<Field orientation="horizontal">
											<FieldContent>
												<FieldLabel htmlFor="customization">
													Enable customizations
												</FieldLabel>
												<FieldDescription>
													Enable customizations to make ChatGPT more
													personalized.
												</FieldDescription>
											</FieldContent>
											<Switch id="customization" defaultChecked />
										</Field>
									</FieldLabel>
								</FieldGroup>
							</TabsContent>
							<TabsContent value="security">
								<FieldGroup>
									<Field orientation="horizontal">
										<FieldContent>
											<FieldLabel htmlFor="2fa">
												Multi-factor authentication
											</FieldLabel>
											<FieldDescription>
												Enable multi-factor authentication to secure your
												account. If you do not have a two-factor
												authentication device, you can use a one-time code
												sent to your email.
											</FieldDescription>
										</FieldContent>
										<Switch id="2fa" />
									</Field>
									<FieldSeparator />
									<Field orientation="horizontal">
										<FieldContent>
											<FieldTitle>Log out</FieldTitle>
											<FieldDescription>
												Log out of your account on this device.
											</FieldDescription>
										</FieldContent>
										<Button variant="outline" size="sm">
											Log Out
										</Button>
									</Field>
									<FieldSeparator />
									<Field orientation="horizontal">
										<FieldContent>
											<FieldTitle>Log out of all devices</FieldTitle>
											<FieldDescription>
												This will log you out of all devices, including the
												current session. It may take up to 30 minutes for the
												changes to take effect.
											</FieldDescription>
										</FieldContent>
										<Button variant="outline" size="sm">
											Log Out All
										</Button>
									</Field>
								</FieldGroup>
							</TabsContent>
						</div>
					</Tabs>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export function DialogDemoCustomWidth() {
	return (
		<Dialog>
			<DialogTrigger render={<Button variant="outline" />}>
				Wide dialog
			</DialogTrigger>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Wider dialog</DialogTitle>
					<DialogDescription>
						This dialog uses a custom width class for wider content.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter showCloseButton />
			</DialogContent>
		</Dialog>
	);
}

export function DialogDemoDefault() {
	return (
		<Dialog>
			<DialogTrigger render={<Button variant="outline" />}>
				Open dialog
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Dialog title</DialogTitle>
					<DialogDescription>
						This is a basic dialog with a title and description.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter showCloseButton />
			</DialogContent>
		</Dialog>
	);
}

export function DialogDemoForm() {
	return (
		<Dialog>
			<DialogTrigger render={<Button variant="outline" />}>
				Edit profile
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit profile</DialogTitle>
					<DialogDescription>
						Make changes to your profile here.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-2">
					<div className="grid gap-2">
						<Label htmlFor="name">Name</Label>
						<Input id="name" placeholder="Enter your name" />
					</div>
					<div className="grid gap-2">
						<Label htmlFor="email">Email</Label>
						<Input id="email" type="email" placeholder="Enter your email" />
					</div>
				</div>
				<DialogFooter>
					<DialogClose render={<Button variant="outline" />}>
						Cancel
					</DialogClose>
					<Button>Save changes</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function DialogDemoNoCloseButton() {
	return (
		<Dialog>
			<DialogTrigger render={<Button variant="outline" />}>
				No Close Button
			</DialogTrigger>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>No Close Button</DialogTitle>
					<DialogDescription>
						This dialog doesn&apos;t have a close button in the top-right
						corner.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<DialogClose render={<Button variant="outline" />}>
						Close
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function DialogDemoNoClose() {
	return (
		<Dialog>
			<DialogTrigger render={<Button variant="outline" />}>
				Open dialog
			</DialogTrigger>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>No close button</DialogTitle>
					<DialogDescription>
						This dialog has no close button in the top-right corner.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter showCloseButton />
			</DialogContent>
		</Dialog>
	);
}

export function DialogDemoScrollableContent() {
	return (
		<Dialog>
			<DialogTrigger render={<Button variant="outline" />}>
				Scrollable Content
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Scrollable Content</DialogTitle>
					<DialogDescription>
						This is a dialog with scrollable content.
					</DialogDescription>
				</DialogHeader>
				<div className="style-nova:-mx-4 style-nova:px-4 no-scrollbar style-vega:px-6 style-mira:px-4 style-maia:px-6 style-vega:-mx-6 style-maia:-mx-6 style-mira:-mx-4 style-lyra:-mx-4 style-lyra:px-4 flex max-h-[70vh] flex-col gap-4 overflow-y-auto style-lyra:gap-2">
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
			</DialogContent>
		</Dialog>
	);
}

export function DialogDemoWithForm() {
	return (
		<Dialog>
			<form>
				<DialogTrigger render={<Button variant="outline" />}>
					Edit Profile
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit profile</DialogTitle>
						<DialogDescription>
							Make changes to your profile here. Click save when you&apos;re
							done. Your profile will be updated immediately.
						</DialogDescription>
					</DialogHeader>
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor="name-1">Name</FieldLabel>
							<Input id="name-1" name="name" defaultValue="Pedro Duarte" />
						</Field>
						<Field>
							<FieldLabel htmlFor="username-1">Username</FieldLabel>
							<Input
								id="username-1"
								name="username"
								defaultValue="@peduarte"
							/>
						</Field>
					</FieldGroup>
					<DialogFooter>
						<DialogClose render={<Button variant="outline" />}>
							Cancel
						</DialogClose>
						<Button type="submit">Save changes</Button>
					</DialogFooter>
				</DialogContent>
			</form>
		</Dialog>
	);
}

export function DialogDemoWithStickyFooter() {
	return (
		<Dialog>
			<DialogTrigger render={<Button variant="outline" />}>
				Sticky Footer
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Scrollable Content</DialogTitle>
					<DialogDescription>
						This is a dialog with scrollable content.
					</DialogDescription>
				</DialogHeader>
				<div className="style-nova:-mx-4 style-nova:px-4 no-scrollbar style-vega:px-6 style-mira:px-4 style-maia:px-6 style-vega:-mx-6 style-maia:-mx-6 style-mira:-mx-4 style-lyra:-mx-4 style-lyra:px-4 flex max-h-[70vh] flex-col gap-4 overflow-y-auto style-lyra:gap-2">
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
				<DialogFooter>
					<DialogClose render={<Button variant="outline" />}>
						Close
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function DialogDemoWarning() {
	return (
		<Dialog>
			<DialogTrigger render={<Button variant="outline" />}>
				Warning dialog
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle variant="warning">Cannot complete action</DialogTitle>
					<DialogDescription>
						You are about to permanently delete this page and all of its
						contents. This action is not reversible.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<DialogClose render={<Button variant="outline" />}>
						Cancel
					</DialogClose>
					<Button>Continue</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function DialogDemoDestructive() {
	return (
		<Dialog>
			<DialogTrigger render={<Button variant="outline" />}>
				Destructive dialog
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle variant="destructive">
						Delete this repository?
					</DialogTitle>
					<DialogDescription>
						This repository will be permanently deleted, including all issues,
						pull requests, and settings. This cannot be undone.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<DialogClose render={<Button variant="outline" />}>
						Cancel
					</DialogClose>
					<Button variant="destructive">Delete repository</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function DialogDemoWidths() {
	const sizes = [
		{ value: "sm" as const, label: "Small (400px)" },
		{ value: "md" as const, label: "Medium (600px)" },
		{ value: "lg" as const, label: "Large (800px)" },
		{ value: "xl" as const, label: "X-Large" },
	];

	return (
		<div className="flex flex-wrap items-center gap-2">
			{sizes.map(({ value, label }) => (
				<Dialog key={value}>
					<DialogTrigger render={<Button variant="outline" size="sm" />}>
						{label}
					</DialogTrigger>
					<DialogContent size={value}>
						<DialogHeader>
							<DialogTitle>{label}</DialogTitle>
							<DialogDescription>
								This dialog uses the &ldquo;{value}&rdquo; size preset.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter showCloseButton />
					</DialogContent>
				</Dialog>
			))}
		</div>
	);
}
