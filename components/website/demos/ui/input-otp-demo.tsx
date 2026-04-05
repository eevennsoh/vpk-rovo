"use client";

import { useState } from "react";
import { REGEXP_ONLY_DIGITS, REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { RefreshCwIcon } from "@/components/ui/vpk-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";

export default function InputOtpDemo() {
	return (
		<InputOTP maxLength={4}>
			<InputOTPGroup>
				<InputOTPSlot index={0} />
				<InputOTPSlot index={1} />
				<InputOTPSlot index={2} />
				<InputOTPSlot index={3} />
			</InputOTPGroup>
		</InputOTP>
	);
}

export function InputOtpDemo4Digits() {
	return (
		<Field>
			<FieldLabel htmlFor="four-digits">4 Digits</FieldLabel>
			<FieldDescription>Common pattern for PIN codes.</FieldDescription>
			<InputOTP id="four-digits" maxLength={4} pattern={REGEXP_ONLY_DIGITS}>
				<InputOTPGroup>
					<InputOTPSlot index={0} />
					<InputOTPSlot index={1} />
					<InputOTPSlot index={2} />
					<InputOTPSlot index={3} />
				</InputOTPGroup>
			</InputOTP>
		</Field>
	);
}

export function InputOtpDemoAlphanumeric() {
	return (
		<Field>
			<FieldLabel htmlFor="alphanumeric">Alphanumeric</FieldLabel>
			<FieldDescription>Accepts both letters and numbers.</FieldDescription>
			<InputOTP
				id="alphanumeric"
				maxLength={6}
				pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
			>
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
		</Field>
	);
}

export function InputOtpDemoDefault() {
	return (
		<InputOTP maxLength={6}>
			<InputOTPGroup>
				<InputOTPSlot index={0} />
				<InputOTPSlot index={1} />
				<InputOTPSlot index={2} />
				<InputOTPSlot index={3} />
				<InputOTPSlot index={4} />
				<InputOTPSlot index={5} />
			</InputOTPGroup>
		</InputOTP>
	);
}

export function InputOtpDemoDigitsOnly() {
	return (
		<Field>
			<FieldLabel htmlFor="digits-only">Digits Only</FieldLabel>
			<InputOTP id="digits-only" maxLength={6} pattern={REGEXP_ONLY_DIGITS}>
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
	);
}

export function InputOtpDemoDisabled() {
	return (
		<Field>
			<FieldLabel htmlFor="disabled">Disabled</FieldLabel>
			<InputOTP id="disabled" maxLength={6} disabled value="123456">
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
		</Field>
	);
}

export function InputOtpDemoForm() {
	return (
		<Card className="mx-auto max-w-md">
			<CardHeader>
				<CardTitle>Verify your login</CardTitle>
				<CardDescription>
					Enter the verification code we sent to your email address:{" "}
					<span className="font-medium">m@example.com</span>.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form>
					<Field>
						<div className="flex items-center justify-between">
							<FieldLabel htmlFor="otp-verification">
								Verification code
							</FieldLabel>
							<Button variant="outline" size="xs">
								<RefreshCwIcon data-icon="inline-start" />
								Resend Code
							</Button>
						</div>
						<InputOTP maxLength={6} id="otp-verification" required>
							<InputOTPGroup className="style-nova:*:data-[slot=input-otp-slot]:h-12 style-nova:*:data-[slot=input-otp-slot]:w-11 style-vega:*:data-[slot=input-otp-slot]:h-16 style-maia:*:data-[slot=input-otp-slot]:h-16 style-vega:*:data-[slot=input-otp-slot]:w-12 style-maia:*:data-[slot=input-otp-slot]:w-12 style-mira:*:data-[slot=input-otp-slot]:h-12 style-lyra:*:data-[slot=input-otp-slot]:h-12 style-lyra:*:data-[slot=input-otp-slot]:w-11 style-mira:*:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xl">
								<InputOTPSlot index={0} />
								<InputOTPSlot index={1} />
								<InputOTPSlot index={2} />
							</InputOTPGroup>
							<InputOTPSeparator />
							<InputOTPGroup className="style-nova:*:data-[slot=input-otp-slot]:h-12 style-nova:*:data-[slot=input-otp-slot]:w-11 style-vega:*:data-[slot=input-otp-slot]:h-16 style-maia:*:data-[slot=input-otp-slot]:h-16 style-vega:*:data-[slot=input-otp-slot]:w-12 style-maia:*:data-[slot=input-otp-slot]:w-12 style-mira:*:data-[slot=input-otp-slot]:h-12 style-lyra:*:data-[slot=input-otp-slot]:h-12 style-lyra:*:data-[slot=input-otp-slot]:w-11 style-mira:*:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xl">
								<InputOTPSlot index={3} />
								<InputOTPSlot index={4} />
								<InputOTPSlot index={5} />
							</InputOTPGroup>
						</InputOTP>
						<FieldDescription>
							<a href="#">I no longer have access to this email address.</a>
						</FieldDescription>
					</Field>
				</form>
			</CardContent>
			<CardFooter className="flex-col gap-2">
				<Button type="submit" className="w-full">
					Verify
				</Button>
				<div className="text-muted-foreground text-sm">
					Having trouble signing in?{" "}
					<a
						href="#"
						className="hover:text-primary underline underline-offset-4 transition-colors"
					>
						Contact support
					</a>
				</div>
			</CardFooter>
		</Card>
	);
}

export function InputOtpDemoInvalidState() {
	const [value, setValue] = useState("000000");

	return (
		<Field>
			<FieldLabel htmlFor="invalid">Invalid State</FieldLabel>
			<FieldDescription>
				Demo showing the invalid error state.
			</FieldDescription>
			<InputOTP id="invalid" maxLength={6} value={value} onChange={setValue}>
				<InputOTPGroup>
					<InputOTPSlot index={0} aria-invalid />
					<InputOTPSlot index={1} aria-invalid />
				</InputOTPGroup>
				<InputOTPSeparator />
				<InputOTPGroup>
					<InputOTPSlot index={2} aria-invalid />
					<InputOTPSlot index={3} aria-invalid />
				</InputOTPGroup>
				<InputOTPSeparator />
				<InputOTPGroup>
					<InputOTPSlot index={4} aria-invalid />
					<InputOTPSlot index={5} aria-invalid />
				</InputOTPGroup>
			</InputOTP>
			<FieldError errors={[{ message: "Invalid code. Please try again." }]} />
		</Field>
	);
}

export function InputOtpDemoPattern() {
	return (
		<InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS_AND_CHARS}>
			<InputOTPGroup>
				<InputOTPSlot index={0} />
				<InputOTPSlot index={1} />
				<InputOTPSlot index={2} />
				<InputOTPSlot index={3} />
				<InputOTPSlot index={4} />
				<InputOTPSlot index={5} />
			</InputOTPGroup>
		</InputOTP>
	);
}

export function InputOtpDemoSimple() {
	return (
		<Field>
			<FieldLabel htmlFor="simple">Simple</FieldLabel>
			<InputOTP id="simple" maxLength={6}>
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
		</Field>
	);
}

export function InputOtpDemoWithSeparator() {
	const [value, setValue] = useState("123456");

	return (
		<Field>
			<FieldLabel htmlFor="with-separator">With Separator</FieldLabel>
			<InputOTP
				id="with-separator"
				maxLength={6}
				value={value}
				onChange={setValue}
			>
				<InputOTPGroup>
					<InputOTPSlot index={0} />
					<InputOTPSlot index={1} />
				</InputOTPGroup>
				<InputOTPSeparator />
				<InputOTPGroup>
					<InputOTPSlot index={2} />
					<InputOTPSlot index={3} />
				</InputOTPGroup>
				<InputOTPSeparator />
				<InputOTPGroup>
					<InputOTPSlot index={4} />
					<InputOTPSlot index={5} />
				</InputOTPGroup>
			</InputOTP>
		</Field>
	);
}
