"use client"

import ArrowDownRightIcon from "@atlaskit/icon/core/arrow-down-right"
import ImageIcon from "@atlaskit/icon/core/image"

import { Icon } from "@/components/ui/icon"
import { Lozenge, LozengeDropdownTrigger } from "@/components/ui/lozenge"

export default function LozengeDemo() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Lozenge>Neutral</Lozenge>
			<Lozenge variant="success">Success</Lozenge>
			<Lozenge variant="information">Information</Lozenge>
			<Lozenge variant="discovery">Discovery</Lozenge>
		</div>
	)
}

export function LozengeDemoDefault() {
	return <Lozenge>Neutral</Lozenge>
}

export function LozengeDemoAppearances() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Lozenge variant="neutral">Neutral</Lozenge>
			<Lozenge variant="success">Success</Lozenge>
			<Lozenge variant="warning">Warning</Lozenge>
			<Lozenge variant="danger">Danger</Lozenge>
			<Lozenge variant="information">Information</Lozenge>
			<Lozenge variant="discovery">Discovery</Lozenge>
		</div>
	)
}

export function LozengeDemoBold() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Lozenge isBold>Neutral</Lozenge>
			<Lozenge variant="success" isBold>
				Success
			</Lozenge>
			<Lozenge variant="warning" isBold>
				Warning
			</Lozenge>
			<Lozenge variant="danger" isBold>
				Danger
			</Lozenge>
			<Lozenge variant="information" isBold>
				Information
			</Lozenge>
			<Lozenge variant="discovery" isBold>
				Discovery
			</Lozenge>
		</div>
	)
}

export function LozengeDemoAccentColors() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Lozenge variant="accent-red">Red</Lozenge>
			<Lozenge variant="accent-orange">Orange</Lozenge>
			<Lozenge variant="accent-yellow">Yellow</Lozenge>
			<Lozenge variant="accent-lime">Lime</Lozenge>
			<Lozenge variant="accent-green">Green</Lozenge>
			<Lozenge variant="accent-teal">Teal</Lozenge>
			<Lozenge variant="accent-blue">Blue</Lozenge>
			<Lozenge variant="accent-purple">Purple</Lozenge>
			<Lozenge variant="accent-magenta">Magenta</Lozenge>
			<Lozenge variant="accent-gray">Gray</Lozenge>
		</div>
	)
}

export function LozengeDemoSpacing() {
	return (
		<div className="flex flex-col items-start gap-3">
			<Lozenge variant="information">Default</Lozenge>
			<Lozenge variant="information" size="spacious">
				Spacious
			</Lozenge>
			<Lozenge
				variant="information"
				size="spacious"
				icon={
					<Icon
						render={<ImageIcon label="" size="small" />}
						aria-hidden
					/>
				}
			>
				Spacious with icon
			</Lozenge>
		</div>
	)
}

export function LozengeDemoWithIcon() {
	return (
		<Lozenge
			variant="success"
			icon={
				<Icon
					render={<ImageIcon label="" size="small" />}
					aria-hidden
				/>
			}
		>
			With icon
		</Lozenge>
	)
}

export function LozengeDemoTrailingMetric() {
	return (
		<div className="flex flex-col items-start gap-3">
			<Lozenge variant="success" metric="0.8">
				Completed
			</Lozenge>
			<Lozenge
				variant="danger"
				size="spacious"
				metric="0.3"
				icon={
					<Icon
						render={<ArrowDownRightIcon label="" size="small" />}
						aria-hidden
					/>
				}
			>
				Off track
			</Lozenge>
		</div>
	)
}

export function LozengeDemoMaxWidth() {
	return (
		<div className="flex flex-col items-start gap-3">
			<Lozenge variant="success">
				default max width with long text which truncates
			</Lozenge>
			<Lozenge maxWidth={100} variant="success">
				custom max width with long text which truncates
			</Lozenge>
		</div>
	)
}

export function LozengeDemoDropdownTrigger() {
	return (
		<LozengeDropdownTrigger variant="success">
			Success
		</LozengeDropdownTrigger>
	)
}

export function LozengeDemoDropdownTriggerAppearances() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<LozengeDropdownTrigger variant="success">Success</LozengeDropdownTrigger>
			<LozengeDropdownTrigger variant="warning">Warning</LozengeDropdownTrigger>
			<LozengeDropdownTrigger variant="danger">Danger</LozengeDropdownTrigger>
			<LozengeDropdownTrigger variant="information">Information</LozengeDropdownTrigger>
			<LozengeDropdownTrigger variant="discovery">Discovery</LozengeDropdownTrigger>
			<LozengeDropdownTrigger variant="neutral">Neutral</LozengeDropdownTrigger>
		</div>
	)
}

export function LozengeDemoUsage() {
	return (
		<div className="flex items-center gap-3">
			<span className="text-sm text-text">PROJ-123</span>
			<Lozenge variant="information">In progress</Lozenge>
		</div>
	)
}
