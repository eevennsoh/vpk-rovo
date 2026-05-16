"use client";

import { useState } from "react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet, FieldTitle } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "@/components/ui/native-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export default function FieldDemo() {
	return (
		<Field className="w-48">
			<FieldLabel>Username</FieldLabel>
			<Input placeholder="johndoe" />
			<FieldDescription>Choose a unique name.</FieldDescription>
		</Field>
	);
}

export function FieldDemoCheckboxFields() {
	return (
		<FieldGroup>
			<Field orientation="horizontal">
				<Checkbox id="checkbox-basic" defaultChecked />
				<FieldLabel htmlFor="checkbox-basic" className="font-normal">
					I agree to the terms and conditions
				</FieldLabel>
			</Field>
			<Field orientation="horizontal">
				<FieldLabel htmlFor="checkbox-right">
					Accept terms and conditions
				</FieldLabel>
				<Checkbox id="checkbox-right" />
			</Field>
			<Field orientation="horizontal">
				<Checkbox id="checkbox-with-desc" />
				<FieldContent>
					<FieldLabel htmlFor="checkbox-with-desc">
						Subscribe to newsletter
					</FieldLabel>
					<FieldDescription>
						Receive weekly updates about new features and promotions.
					</FieldDescription>
				</FieldContent>
			</Field>
			<FieldLabel htmlFor="checkbox-with-title">
				<Field orientation="horizontal">
					<Checkbox id="checkbox-with-title" />
					<FieldContent>
						<FieldTitle>Enable Touch ID</FieldTitle>
						<FieldDescription>
							Enable Touch ID to quickly unlock your device.
						</FieldDescription>
					</FieldContent>
				</Field>
			</FieldLabel>
			<FieldSet>
				<FieldLegend variant="label">Preferences</FieldLegend>
				<FieldDescription>
					Select all that apply to customize your experience.
				</FieldDescription>
				<FieldGroup className="gap-3">
					<Field orientation="horizontal">
						<Checkbox id="pref-dark" />
						<FieldLabel htmlFor="pref-dark" className="font-normal">
							Dark mode
						</FieldLabel>
					</Field>
					<Field orientation="horizontal">
						<Checkbox id="pref-compact" />
						<FieldLabel htmlFor="pref-compact" className="font-normal">
							Compact view
						</FieldLabel>
					</Field>
					<Field orientation="horizontal">
						<Checkbox id="pref-notifications" />
						<FieldLabel htmlFor="pref-notifications" className="font-normal">
							Enable notifications
						</FieldLabel>
					</Field>
				</FieldGroup>
			</FieldSet>
			<Field data-invalid orientation="horizontal">
				<Checkbox id="checkbox-invalid" aria-invalid />
				<FieldLabel htmlFor="checkbox-invalid" className="font-normal">
					Invalid checkbox
				</FieldLabel>
			</Field>
			<Field data-disabled orientation="horizontal">
				<Checkbox id="checkbox-disabled-field" disabled />
				<FieldLabel htmlFor="checkbox-disabled-field" className="font-normal">
					Disabled checkbox
				</FieldLabel>
			</Field>
		</FieldGroup>
	);
}

export function FieldDemoDefault() {
	return (
		<Field>
			<FieldLabel htmlFor="username">Username</FieldLabel>
			<Input id="username" placeholder="Enter username" />
			<FieldDescription>This is your public display name.</FieldDescription>
		</Field>
	);
}

export function FieldDemoError() {
	return (
		<Field data-invalid="true">
			<FieldLabel htmlFor="required-field">Required field</FieldLabel>
			<Input id="required-field" placeholder="Enter value" aria-invalid="true" />
			<FieldError errors={[{ message: "This field is required" }]} />
		</Field>
	);
}

export function FieldDemoFieldset() {
	return (
		<FieldSet>
			<FieldLegend>Contact information</FieldLegend>
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor="first-name">First name</FieldLabel>
					<Input id="first-name" placeholder="First name" />
				</Field>
				<Field>
					<FieldLabel htmlFor="last-name">Last name</FieldLabel>
					<Input id="last-name" placeholder="Last name" />
				</Field>
				<Field>
					<FieldLabel htmlFor="fieldset-email">Email</FieldLabel>
					<Input id="fieldset-email" type="email" placeholder="Email" />
				</Field>
			</FieldGroup>
		</FieldSet>
	);
}

export function FieldDemoHorizontalFields() {
	const basicItems = [
		{ label: "Select a fruit", value: null },
		{ label: "Apple", value: "apple" },
		{ label: "Banana", value: "banana" },
		{ label: "Orange", value: "orange" },
	];

	return (
		<FieldGroup className="**:data-[slot=field-content]:min-w-48">
			<Field orientation="horizontal">
				<FieldContent>
					<FieldLabel htmlFor="horizontal-input">Username</FieldLabel>
					<FieldDescription>Enter your preferred username.</FieldDescription>
				</FieldContent>
				<Input id="horizontal-input" placeholder="johndoe" />
			</Field>
			<Field orientation="horizontal">
				<FieldContent>
					<FieldLabel htmlFor="horizontal-textarea">Bio</FieldLabel>
					<FieldDescription>
						Write a short description about yourself.
					</FieldDescription>
				</FieldContent>
				<Textarea
					id="horizontal-textarea"
					placeholder="Tell us about yourself..."
				/>
			</Field>
			<Field orientation="horizontal">
				<FieldContent>
					<FieldLabel htmlFor="horizontal-switch">
						Email Notifications
					</FieldLabel>
					<FieldDescription>
						Receive email updates about your account.
					</FieldDescription>
				</FieldContent>
				<Switch id="horizontal-switch" />
			</Field>
			<Field orientation="horizontal">
				<FieldContent>
					<FieldLabel htmlFor="horizontal-select">Favorite Fruit</FieldLabel>
					<FieldDescription>Choose your favorite fruit.</FieldDescription>
				</FieldContent>
				<Select items={basicItems}>
					<SelectTrigger id="horizontal-select">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							{basicItems.map((item) => (
								<SelectItem key={item.value} value={item.value}>
									{item.label}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
			</Field>
			<Field orientation="horizontal">
				<FieldContent>
					<FieldLabel htmlFor="horizontal-native-select">Country</FieldLabel>
					<FieldDescription>Select your country.</FieldDescription>
				</FieldContent>
				<NativeSelect id="horizontal-native-select">
					<NativeSelectOption value="">Select a country</NativeSelectOption>
					<NativeSelectOption value="us">United States</NativeSelectOption>
					<NativeSelectOption value="uk">United Kingdom</NativeSelectOption>
					<NativeSelectOption value="ca">Canada</NativeSelectOption>
				</NativeSelect>
			</Field>
			<Field orientation="horizontal">
				<FieldContent>
					<FieldLabel htmlFor="horizontal-slider">Volume</FieldLabel>
					<FieldDescription>Adjust the volume level.</FieldDescription>
				</FieldContent>
				<Slider id="horizontal-slider" defaultValue={[50]} max={100} />
			</Field>
		</FieldGroup>
	);
}

export function FieldDemoHorizontal() {
	return (
		<Field orientation="horizontal">
			<FieldLabel htmlFor="horizontal-input">Label</FieldLabel>
			<Input id="horizontal-input" placeholder="Horizontal field" />
		</Field>
	);
}

export function FieldDemoInputFields() {
	return (
		<FieldGroup>
			<Field>
				<FieldLabel htmlFor="input-basic">Basic Input</FieldLabel>
				<Input id="input-basic" placeholder="Enter text" />
			</Field>
			<Field>
				<FieldLabel htmlFor="input-with-desc">
					Input with Description
				</FieldLabel>
				<Input id="input-with-desc" placeholder="Enter your username" />
				<FieldDescription>
					Choose a unique username for your account.
				</FieldDescription>
			</Field>
			<Field>
				<FieldLabel htmlFor="input-desc-first">Email Address</FieldLabel>
				<FieldDescription>
					We&apos;ll never share your email with anyone.
				</FieldDescription>
				<Input
					id="input-desc-first"
					type="email"
					placeholder="email@example.com"
				/>
			</Field>
			<Field>
				<FieldLabel htmlFor="input-required">
					Required Field <span className="text-destructive">*</span>
				</FieldLabel>
				<Input
					id="input-required"
					placeholder="This field is required"
					required
				/>
				<FieldDescription>This field must be filled out.</FieldDescription>
			</Field>
			<Field>
				<FieldLabel htmlFor="input-disabled">Disabled Input</FieldLabel>
				<Input id="input-disabled" placeholder="Cannot edit" disabled />
				<FieldDescription>This field is currently disabled.</FieldDescription>
			</Field>
			<Field>
				<FieldLabel htmlFor="input-badge">
					Input with Badge{" "}
					<Badge variant="secondary" className="ml-auto">
						Recommended
					</Badge>
				</FieldLabel>
				<Input id="input-badge" placeholder="Enter value" />
			</Field>
			<Field data-invalid>
				<FieldLabel htmlFor="input-invalid">Invalid Input</FieldLabel>
				<Input
					id="input-invalid"
					placeholder="This field has an error"
					aria-invalid
				/>
				<FieldDescription>
					This field contains validation errors.
				</FieldDescription>
			</Field>
			<Field data-disabled>
				<FieldLabel htmlFor="input-disabled-field">Disabled Field</FieldLabel>
				<Input id="input-disabled-field" placeholder="Cannot edit" disabled />
				<FieldDescription>This field is currently disabled.</FieldDescription>
			</Field>
		</FieldGroup>
	);
}

export function FieldDemoNativeSelectFields() {
	return (
		<FieldGroup>
			<Field>
				<FieldLabel htmlFor="native-select-basic">
					Basic Native Select
				</FieldLabel>
				<NativeSelect id="native-select-basic">
					<NativeSelectOption value="">Choose an option</NativeSelectOption>
					<NativeSelectOption value="option1">Option 1</NativeSelectOption>
					<NativeSelectOption value="option2">Option 2</NativeSelectOption>
					<NativeSelectOption value="option3">Option 3</NativeSelectOption>
				</NativeSelect>
			</Field>
			<Field>
				<FieldLabel htmlFor="native-select-country">Country</FieldLabel>
				<NativeSelect id="native-select-country">
					<NativeSelectOption value="">
						Select your country
					</NativeSelectOption>
					<NativeSelectOption value="us">United States</NativeSelectOption>
					<NativeSelectOption value="uk">United Kingdom</NativeSelectOption>
					<NativeSelectOption value="ca">Canada</NativeSelectOption>
				</NativeSelect>
				<FieldDescription>
					Select the country where you currently reside.
				</FieldDescription>
			</Field>
			<Field>
				<FieldLabel htmlFor="native-select-timezone">Timezone</FieldLabel>
				<FieldDescription>
					Choose your local timezone for accurate scheduling.
				</FieldDescription>
				<NativeSelect id="native-select-timezone">
					<NativeSelectOption value="">Select timezone</NativeSelectOption>
					<NativeSelectOption value="utc">UTC</NativeSelectOption>
					<NativeSelectOption value="est">Eastern Time</NativeSelectOption>
					<NativeSelectOption value="pst">Pacific Time</NativeSelectOption>
				</NativeSelect>
			</Field>
			<Field>
				<FieldLabel htmlFor="native-select-grouped">
					Grouped Options
				</FieldLabel>
				<NativeSelect id="native-select-grouped">
					<NativeSelectOption value="">Select a region</NativeSelectOption>
					<NativeSelectOptGroup label="North America">
						<NativeSelectOption value="us">United States</NativeSelectOption>
						<NativeSelectOption value="ca">Canada</NativeSelectOption>
						<NativeSelectOption value="mx">Mexico</NativeSelectOption>
					</NativeSelectOptGroup>
					<NativeSelectOptGroup label="Europe">
						<NativeSelectOption value="uk">United Kingdom</NativeSelectOption>
						<NativeSelectOption value="fr">France</NativeSelectOption>
						<NativeSelectOption value="de">Germany</NativeSelectOption>
					</NativeSelectOptGroup>
				</NativeSelect>
				<FieldDescription>
					Native select with grouped options using optgroup.
				</FieldDescription>
			</Field>
			<Field data-invalid>
				<FieldLabel htmlFor="native-select-invalid">
					Invalid Native Select
				</FieldLabel>
				<NativeSelect id="native-select-invalid" aria-invalid>
					<NativeSelectOption value="">
						This field has an error
					</NativeSelectOption>
					<NativeSelectOption value="option1">Option 1</NativeSelectOption>
					<NativeSelectOption value="option2">Option 2</NativeSelectOption>
					<NativeSelectOption value="option3">Option 3</NativeSelectOption>
				</NativeSelect>
				<FieldDescription>
					This field contains validation errors.
				</FieldDescription>
			</Field>
			<Field data-disabled>
				<FieldLabel htmlFor="native-select-disabled-field">
					Disabled Field
				</FieldLabel>
				<NativeSelect id="native-select-disabled-field" disabled>
					<NativeSelectOption value="">Cannot select</NativeSelectOption>
					<NativeSelectOption value="option1">Option 1</NativeSelectOption>
					<NativeSelectOption value="option2">Option 2</NativeSelectOption>
					<NativeSelectOption value="option3">Option 3</NativeSelectOption>
				</NativeSelect>
				<FieldDescription>This field is currently disabled.</FieldDescription>
			</Field>
		</FieldGroup>
	);
}

export function FieldDemoOtpInputFields() {
	const [value, setValue] = useState("");
	const [pinValue, setPinValue] = useState("");

	return (
		<FieldGroup>
			<Field>
				<FieldLabel htmlFor="otp-basic">Verification Code</FieldLabel>
				<InputOTP id="otp-basic" maxLength={6}>
					<InputOTPGroup>
						<InputOTPSlot index={0} />
						<InputOTPSlot index={1} />
						<InputOTPSlot index={2} />
						<InputOTPSlot index={3} />
						<InputOTPSlot index={4} />
						<InputOTPSlot index={5} />
					</InputOTPGroup>
				</InputOTP>
			</Field>
			<Field>
				<FieldLabel htmlFor="otp-with-desc">Enter OTP</FieldLabel>
				<InputOTP
					id="otp-with-desc"
					maxLength={6}
					value={value}
					onChange={setValue}
				>
					<InputOTPGroup>
						<InputOTPSlot index={0} />
						<InputOTPSlot index={1} />
						<InputOTPSlot index={2} />
						<InputOTPSlot index={3} />
						<InputOTPSlot index={4} />
						<InputOTPSlot index={5} />
					</InputOTPGroup>
				</InputOTP>
				<FieldDescription>
					Enter the 6-digit code sent to your email.
				</FieldDescription>
			</Field>
			<Field>
				<FieldLabel htmlFor="otp-separator">
					Two-Factor Authentication
				</FieldLabel>
				<InputOTP id="otp-separator" maxLength={6}>
					<InputOTPGroup>
						<InputOTPSlot index={0} />
						<InputOTPSlot index={1} />
						<InputOTPSlot index={2} />
					</InputOTPGroup>
					<InputOTPSeparator />
					<InputOTPGroup>
						<InputOTPSlot index={3} />
						<InputOTPSlot index={4} />
						<InputOTPSlot index={5} />
					</InputOTPGroup>
				</InputOTP>
				<FieldDescription>
					Enter the code from your authenticator app.
				</FieldDescription>
			</Field>
			<Field>
				<FieldLabel htmlFor="otp-pin">PIN Code</FieldLabel>
				<InputOTP
					id="otp-pin"
					maxLength={4}
					pattern={REGEXP_ONLY_DIGITS}
					value={pinValue}
					onChange={setPinValue}
				>
					<InputOTPGroup>
						<InputOTPSlot index={0} />
						<InputOTPSlot index={1} />
						<InputOTPSlot index={2} />
						<InputOTPSlot index={3} />
					</InputOTPGroup>
				</InputOTP>
				<FieldDescription>
					Enter your 4-digit PIN (numbers only).
				</FieldDescription>
			</Field>
			<Field data-invalid>
				<FieldLabel htmlFor="otp-invalid">Invalid OTP</FieldLabel>
				<InputOTP id="otp-invalid" maxLength={6}>
					<InputOTPGroup>
						<InputOTPSlot index={0} aria-invalid />
						<InputOTPSlot index={1} aria-invalid />
						<InputOTPSlot index={2} aria-invalid />
						<InputOTPSlot index={3} aria-invalid />
						<InputOTPSlot index={4} aria-invalid />
						<InputOTPSlot index={5} aria-invalid />
					</InputOTPGroup>
				</InputOTP>
				<FieldDescription>
					This OTP field contains validation errors.
				</FieldDescription>
			</Field>
			<Field data-disabled>
				<FieldLabel htmlFor="otp-disabled-field">Disabled OTP</FieldLabel>
				<InputOTP id="otp-disabled-field" maxLength={6} disabled>
					<InputOTPGroup>
						<InputOTPSlot index={0} />
						<InputOTPSlot index={1} />
						<InputOTPSlot index={2} />
						<InputOTPSlot index={3} />
						<InputOTPSlot index={4} />
						<InputOTPSlot index={5} />
					</InputOTPGroup>
				</InputOTP>
				<FieldDescription>
					This OTP field is currently disabled.
				</FieldDescription>
			</Field>
		</FieldGroup>
	);
}

export function FieldDemoRadioFields() {
	return (
		<FieldGroup>
			<FieldSet>
				<FieldLegend variant="label">Subscription Plan</FieldLegend>
				<RadioGroup defaultValue="free">
					<Field orientation="horizontal">
						<RadioGroupItem value="free" id="radio-free" />
						<FieldLabel htmlFor="radio-free" className="font-normal">
							Free Plan
						</FieldLabel>
					</Field>
					<Field orientation="horizontal">
						<RadioGroupItem value="pro" id="radio-pro" />
						<FieldLabel htmlFor="radio-pro" className="font-normal">
							Pro Plan
						</FieldLabel>
					</Field>
					<Field orientation="horizontal">
						<RadioGroupItem value="enterprise" id="radio-enterprise" />
						<FieldLabel htmlFor="radio-enterprise" className="font-normal">
							Enterprise
						</FieldLabel>
					</Field>
				</RadioGroup>
			</FieldSet>
			<FieldSet>
				<FieldLegend variant="label">Battery Level</FieldLegend>
				<FieldDescription>
					Choose your preferred battery level.
				</FieldDescription>
				<RadioGroup>
					<Field orientation="horizontal">
						<RadioGroupItem value="high" id="battery-high" />
						<FieldLabel htmlFor="battery-high">High</FieldLabel>
					</Field>
					<Field orientation="horizontal">
						<RadioGroupItem value="medium" id="battery-medium" />
						<FieldLabel htmlFor="battery-medium">Medium</FieldLabel>
					</Field>
					<Field orientation="horizontal">
						<RadioGroupItem value="low" id="battery-low" />
						<FieldLabel htmlFor="battery-low">Low</FieldLabel>
					</Field>
				</RadioGroup>
			</FieldSet>
			<RadioGroup className="gap-6">
				<Field orientation="horizontal">
					<RadioGroupItem value="option1" id="radio-content-1" />
					<FieldContent>
						<FieldLabel htmlFor="radio-content-1">Enable Touch ID</FieldLabel>
						<FieldDescription>
							Enable Touch ID to quickly unlock your device.
						</FieldDescription>
					</FieldContent>
				</Field>
				<Field orientation="horizontal">
					<RadioGroupItem value="option2" id="radio-content-2" />
					<FieldContent>
						<FieldLabel htmlFor="radio-content-2">
							Enable Touch ID and Face ID to make it even faster to unlock
							your device. This is a long label to test the layout.
						</FieldLabel>
						<FieldDescription>
							Enable Touch ID to quickly unlock your device.
						</FieldDescription>
					</FieldContent>
				</Field>
			</RadioGroup>
			<RadioGroup className="gap-3">
				<FieldLabel htmlFor="radio-title-1">
					<Field orientation="horizontal">
						<RadioGroupItem value="title1" id="radio-title-1" />
						<FieldContent>
							<FieldTitle>Enable Touch ID</FieldTitle>
							<FieldDescription>
								Enable Touch ID to quickly unlock your device.
							</FieldDescription>
						</FieldContent>
					</Field>
				</FieldLabel>
				<FieldLabel htmlFor="radio-title-2">
					<Field orientation="horizontal">
						<RadioGroupItem value="title2" id="radio-title-2" />
						<FieldContent>
							<FieldTitle>
								Enable Touch ID and Face ID to make it even faster to unlock
								your device. This is a long label to test the layout.
							</FieldTitle>
							<FieldDescription>
								Enable Touch ID to quickly unlock your device.
							</FieldDescription>
						</FieldContent>
					</Field>
				</FieldLabel>
			</RadioGroup>
			<FieldSet>
				<FieldLegend variant="label">Invalid Radio Group</FieldLegend>
				<RadioGroup>
					<Field data-invalid orientation="horizontal">
						<RadioGroupItem
							value="invalid1"
							id="radio-invalid-1"
							aria-invalid
						/>
						<FieldLabel htmlFor="radio-invalid-1">
							Invalid Option 1
						</FieldLabel>
					</Field>
					<Field data-invalid orientation="horizontal">
						<RadioGroupItem
							value="invalid2"
							id="radio-invalid-2"
							aria-invalid
						/>
						<FieldLabel htmlFor="radio-invalid-2">
							Invalid Option 2
						</FieldLabel>
					</Field>
				</RadioGroup>
			</FieldSet>
			<FieldSet>
				<FieldLegend variant="label">Disabled Radio Group</FieldLegend>
				<RadioGroup disabled>
					<Field data-disabled orientation="horizontal">
						<RadioGroupItem
							value="disabled1"
							id="radio-disabled-1"
							disabled
						/>
						<FieldLabel htmlFor="radio-disabled-1">
							Disabled Option 1
						</FieldLabel>
					</Field>
					<Field data-disabled orientation="horizontal">
						<RadioGroupItem
							value="disabled2"
							id="radio-disabled-2"
							disabled
						/>
						<FieldLabel htmlFor="radio-disabled-2">
							Disabled Option 2
						</FieldLabel>
					</Field>
				</RadioGroup>
			</FieldSet>
		</FieldGroup>
	);
}

export function FieldDemoSelectFields() {
	const basicItems = [
		{ label: "Choose an option", value: null },
		{ label: "Option 1", value: "option1" },
		{ label: "Option 2", value: "option2" },
		{ label: "Option 3", value: "option3" },
	];
	const countryItems = [
		{ label: "Select your country", value: null },
		{ label: "United States", value: "us" },
		{ label: "United Kingdom", value: "uk" },
		{ label: "Canada", value: "ca" },
	];
	const timezoneItems = [
		{ label: "Select timezone", value: null },
		{ label: "UTC", value: "utc" },
		{ label: "Eastern Time", value: "est" },
		{ label: "Pacific Time", value: "pst" },
	];
	const invalidItems = [
		{ label: "This field has an error", value: null },
		{ label: "Option 1", value: "option1" },
		{ label: "Option 2", value: "option2" },
		{ label: "Option 3", value: "option3" },
	];
	const disabledItems = [
		{ label: "Cannot select", value: null },
		{ label: "Option 1", value: "option1" },
		{ label: "Option 2", value: "option2" },
		{ label: "Option 3", value: "option3" },
	];

	return (
		<FieldGroup>
			<Field>
				<FieldLabel htmlFor="select-basic">Basic Select</FieldLabel>
				<Select items={basicItems}>
					<SelectTrigger id="select-basic">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							{basicItems.map((item) => (
								<SelectItem key={item.value} value={item.value}>
									{item.label}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
			</Field>
			<Field>
				<FieldLabel htmlFor="select-country">Country</FieldLabel>
				<Select items={countryItems}>
					<SelectTrigger id="select-country">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							{countryItems.map((item) => (
								<SelectItem key={item.value} value={item.value}>
									{item.label}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
				<FieldDescription>
					Select the country where you currently reside.
				</FieldDescription>
			</Field>
			<Field>
				<FieldLabel htmlFor="select-timezone">Timezone</FieldLabel>
				<FieldDescription>
					Choose your local timezone for accurate scheduling.
				</FieldDescription>
				<Select items={timezoneItems}>
					<SelectTrigger id="select-timezone">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							{timezoneItems.map((item) => (
								<SelectItem key={item.value} value={item.value}>
									{item.label}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
			</Field>
			<Field data-invalid>
				<FieldLabel htmlFor="select-invalid">Invalid Select</FieldLabel>
				<Select items={invalidItems}>
					<SelectTrigger id="select-invalid" aria-invalid>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							{invalidItems.map((item) => (
								<SelectItem key={item.value} value={item.value}>
									{item.label}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
				<FieldDescription>
					This field contains validation errors.
				</FieldDescription>
			</Field>
			<Field data-disabled>
				<FieldLabel htmlFor="select-disabled-field">
					Disabled Field
				</FieldLabel>
				<Select items={disabledItems} disabled>
					<SelectTrigger id="select-disabled-field">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							{disabledItems.map((item) => (
								<SelectItem key={item.value} value={item.value}>
									{item.label}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
				<FieldDescription>This field is currently disabled.</FieldDescription>
			</Field>
		</FieldGroup>
	);
}

export function FieldDemoSliderFields() {
	const [volume, setVolume] = useState([50]);
	const [brightness, setBrightness] = useState([75]);
	const [temperature, setTemperature] = useState([0.3, 0.7]);
	const [priceRange, setPriceRange] = useState([25, 75]);
	const [colorBalance, setColorBalance] = useState([10, 20, 70]);

	return (
		<FieldGroup>
			<Field>
				<FieldLabel htmlFor="slider-volume">Volume</FieldLabel>
				<Slider
					id="slider-volume"
					value={volume}
					onValueChange={(value) => setVolume(value as number[])}
					max={100}
					step={1}
				/>
			</Field>
			<Field>
				<FieldLabel htmlFor="slider-brightness">Screen Brightness</FieldLabel>
				<Slider
					id="slider-brightness"
					value={brightness}
					onValueChange={(value) => setBrightness(value as number[])}
					max={100}
					step={5}
				/>
				<FieldDescription>
					Current brightness: {brightness[0]}%
				</FieldDescription>
			</Field>
			<Field>
				<FieldLabel htmlFor="slider-quality">Video Quality</FieldLabel>
				<FieldDescription>
					Higher quality uses more bandwidth.
				</FieldDescription>
				<Slider
					id="slider-quality"
					defaultValue={[720]}
					max={1080}
					min={360}
					step={360}
				/>
			</Field>
			<Field>
				<FieldLabel htmlFor="slider-temperature">
					Temperature Range
				</FieldLabel>
				<Slider
					id="slider-temperature"
					value={temperature}
					onValueChange={(value) => setTemperature(value as number[])}
					min={0}
					max={1}
					step={0.1}
				/>
				<FieldDescription>
					Range: {temperature[0].toFixed(1)} - {temperature[1].toFixed(1)}
				</FieldDescription>
			</Field>
			<Field>
				<FieldLabel htmlFor="slider-price-range">Price Range</FieldLabel>
				<Slider
					id="slider-price-range"
					value={priceRange}
					onValueChange={(value) => setPriceRange(value as number[])}
					max={100}
					step={5}
				/>
				<FieldDescription>
					${priceRange[0]} - ${priceRange[1]}
				</FieldDescription>
			</Field>
			<Field>
				<FieldLabel htmlFor="slider-color-balance">Color Balance</FieldLabel>
				<Slider
					id="slider-color-balance"
					value={colorBalance}
					onValueChange={(value) => setColorBalance(value as number[])}
					max={100}
					step={10}
				/>
				<FieldDescription>
					Red: {colorBalance[0]}%, Green: {colorBalance[1]}%, Blue:{" "}
					{colorBalance[2]}%
				</FieldDescription>
			</Field>
			<Field data-invalid>
				<FieldLabel htmlFor="slider-invalid">Invalid Slider</FieldLabel>
				<Slider
					id="slider-invalid"
					defaultValue={[30]}
					max={100}
					aria-invalid
				/>
				<FieldDescription>
					This slider has validation errors.
				</FieldDescription>
			</Field>
			<Field data-disabled>
				<FieldLabel htmlFor="slider-disabled-field">
					Disabled Slider
				</FieldLabel>
				<Slider
					id="slider-disabled-field"
					defaultValue={[50]}
					max={100}
					disabled
				/>
				<FieldDescription>
					This slider is currently disabled.
				</FieldDescription>
			</Field>
		</FieldGroup>
	);
}

export function FieldDemoSwitchFields() {
	return (
		<FieldGroup>
			<Field orientation="horizontal">
				<FieldContent>
					<FieldLabel htmlFor="switch-airplane">Airplane Mode</FieldLabel>
					<FieldDescription>
						Turn on airplane mode to disable all connections.
					</FieldDescription>
				</FieldContent>
				<Switch id="switch-airplane" />
			</Field>
			<Field orientation="horizontal">
				<FieldLabel htmlFor="switch-dark">Dark Mode</FieldLabel>
				<Switch id="switch-dark" />
			</Field>
			<Field orientation="horizontal">
				<Switch id="switch-marketing" />
				<FieldContent>
					<FieldLabel htmlFor="switch-marketing">Marketing Emails</FieldLabel>
					<FieldDescription>
						Receive emails about new products, features, and more.
					</FieldDescription>
				</FieldContent>
			</Field>
			<Field>
				<FieldLabel>Privacy Settings</FieldLabel>
				<FieldDescription>Manage your privacy preferences.</FieldDescription>
				<Field orientation="horizontal">
					<Switch id="switch-profile" defaultChecked />
					<FieldContent>
						<FieldLabel htmlFor="switch-profile" className="font-normal">
							Make profile visible to others
						</FieldLabel>
					</FieldContent>
				</Field>
				<Field orientation="horizontal">
					<Switch id="switch-email" />
					<FieldContent>
						<FieldLabel htmlFor="switch-email" className="font-normal">
							Show email on profile
						</FieldLabel>
					</FieldContent>
				</Field>
			</Field>
			<Field data-invalid orientation="horizontal">
				<FieldContent>
					<FieldLabel htmlFor="switch-invalid">Invalid Switch</FieldLabel>
					<FieldDescription>
						This switch has validation errors.
					</FieldDescription>
				</FieldContent>
				<Switch id="switch-invalid" aria-invalid />
			</Field>
			<Field data-disabled orientation="horizontal">
				<FieldContent>
					<FieldLabel htmlFor="switch-disabled-field">
						Disabled Switch
					</FieldLabel>
					<FieldDescription>
						This switch is currently disabled.
					</FieldDescription>
				</FieldContent>
				<Switch id="switch-disabled-field" disabled />
			</Field>
		</FieldGroup>
	);
}

export function FieldDemoTextareaFields() {
	return (
		<FieldGroup>
			<Field>
				<FieldLabel htmlFor="textarea-basic">Basic Textarea</FieldLabel>
				<Textarea id="textarea-basic" placeholder="Enter your message" />
			</Field>
			<Field>
				<FieldLabel htmlFor="textarea-comments">Comments</FieldLabel>
				<Textarea
					id="textarea-comments"
					placeholder="Share your thoughts..."
					className="min-h-[100px]"
				/>
				<FieldDescription>Maximum 500 characters allowed.</FieldDescription>
			</Field>
			<Field>
				<FieldLabel htmlFor="textarea-bio">Bio</FieldLabel>
				<FieldDescription>
					Tell us about yourself in a few sentences.
				</FieldDescription>
				<Textarea
					id="textarea-bio"
					placeholder="I am a..."
					className="min-h-[120px]"
				/>
			</Field>
			<Field>
				<FieldLabel htmlFor="textarea-desc-after">Message</FieldLabel>
				<Textarea id="textarea-desc-after" placeholder="Enter your message" />
				<FieldDescription>
					Enter your message so it is long enough to test the layout.
				</FieldDescription>
			</Field>
			<Field data-invalid>
				<FieldLabel htmlFor="textarea-invalid">Invalid Textarea</FieldLabel>
				<Textarea
					id="textarea-invalid"
					placeholder="This field has an error"
					aria-invalid
				/>
				<FieldDescription>
					This field contains validation errors.
				</FieldDescription>
			</Field>
			<Field data-disabled>
				<FieldLabel htmlFor="textarea-disabled-field">
					Disabled Field
				</FieldLabel>
				<Textarea
					id="textarea-disabled-field"
					placeholder="Cannot edit"
					disabled
				/>
				<FieldDescription>This field is currently disabled.</FieldDescription>
			</Field>
		</FieldGroup>
	);
}

export function FieldDemoTextField() {
	return (
		<Field>
			<FieldLabel htmlFor="text-field-basic">Username</FieldLabel>
			<Input id="text-field-basic" placeholder="Enter username" />
			<FieldDescription>Your unique display name.</FieldDescription>
		</Field>
	);
}

export function FieldDemoTextFieldDisabled() {
	return (
		<Field data-disabled>
			<FieldLabel htmlFor="text-field-disabled">Email</FieldLabel>
			<Input id="text-field-disabled" type="email" placeholder="Email" disabled />
		</Field>
	);
}

export function FieldDemoTextFieldInvalid() {
	return (
		<Field data-invalid>
			<FieldLabel htmlFor="text-field-invalid">Email</FieldLabel>
			<Input id="text-field-invalid" type="email" placeholder="Email" aria-invalid />
			<FieldError>Please enter a valid email address.</FieldError>
		</Field>
	);
}

export function FieldDemoTextFieldVariants() {
	return (
		<FieldGroup>
			<Field>
				<FieldLabel htmlFor="text-field-default">Default</FieldLabel>
				<Input id="text-field-default" variant="default" placeholder="Default variant" />
			</Field>
			<Field>
				<FieldLabel htmlFor="text-field-subtle">Subtle</FieldLabel>
				<Input id="text-field-subtle" variant="subtle" placeholder="Subtle variant" />
			</Field>
		</FieldGroup>
	);
}

export function FieldDemoTextarea() {
	return (
		<Field>
			<FieldLabel htmlFor="textarea-basic">Message</FieldLabel>
			<Textarea id="textarea-basic" placeholder="Type your message here." />
			<FieldDescription>Enter your message and press submit.</FieldDescription>
		</Field>
	);
}

export function FieldDemoTextareaDisabled() {
	return (
		<Field data-disabled>
			<FieldLabel htmlFor="textarea-demo-disabled">Message</FieldLabel>
			<Textarea id="textarea-demo-disabled" placeholder="Type your message here." disabled />
		</Field>
	);
}

export function FieldDemoTextareaInvalid() {
	return (
		<Field data-invalid>
			<FieldLabel htmlFor="textarea-demo-invalid">Message</FieldLabel>
			<Textarea id="textarea-demo-invalid" placeholder="Type your message here." aria-invalid />
			<FieldError>Message is required.</FieldError>
		</Field>
	);
}

export function FieldDemoForm() {
	return (
		<form className="w-full">
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor="form-name">Name</FieldLabel>
					<Input id="form-name" type="text" placeholder="John Doe" />
				</Field>
				<Field>
					<FieldLabel htmlFor="form-email">Email</FieldLabel>
					<Input id="form-email" type="email" placeholder="john@example.com" />
					<FieldDescription>We&apos;ll never share your email with anyone.</FieldDescription>
				</Field>
				<Field>
					<FieldLabel htmlFor="form-message">Message</FieldLabel>
					<Textarea id="form-message" placeholder="Your message..." />
				</Field>
			</FieldGroup>
		</form>
	);
}

export function FieldDemoInputTypes() {
	return (
		<FieldGroup>
			<Field>
				<FieldLabel htmlFor="input-type-password">Password</FieldLabel>
				<Input id="input-type-password" type="password" placeholder="Password" />
			</Field>
			<Field>
				<FieldLabel htmlFor="input-type-tel">Phone</FieldLabel>
				<Input id="input-type-tel" type="tel" placeholder="+1 (555) 123-4567" />
			</Field>
			<Field>
				<FieldLabel htmlFor="input-type-url">URL</FieldLabel>
				<Input id="input-type-url" type="url" placeholder="https://example.com" />
			</Field>
			<Field>
				<FieldLabel htmlFor="input-type-search">Search</FieldLabel>
				<Input id="input-type-search" type="search" placeholder="Search" />
			</Field>
			<Field>
				<FieldLabel htmlFor="input-type-number">Number</FieldLabel>
				<Input id="input-type-number" type="number" placeholder="123" />
			</Field>
			<Field>
				<FieldLabel htmlFor="input-type-date">Date</FieldLabel>
				<Input id="input-type-date" type="date" />
			</Field>
			<Field>
				<FieldLabel htmlFor="input-type-file">File</FieldLabel>
				<Input id="input-type-file" type="file" />
			</Field>
		</FieldGroup>
	);
}
