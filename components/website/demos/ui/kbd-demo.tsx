import { ArrowLeftIcon, ArrowRightIcon, CircleDashedIcon, SaveIcon } from "@/components/ui/vpk-icons";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function KbdDemo() {
	return (
		<div className="flex items-center gap-3">
			<KbdGroup>
				<Kbd>⌘</Kbd>
				<Kbd>K</Kbd>
			</KbdGroup>
			<KbdGroup>
				<Kbd>Ctrl</Kbd>
				<Kbd>C</Kbd>
			</KbdGroup>
		</div>
	);
}

export function KbdDemoArrowKeys() {
	return (
		<div className="flex items-center gap-2">
			<Kbd>↑</Kbd>
			<Kbd>↓</Kbd>
			<Kbd>←</Kbd>
			<Kbd>→</Kbd>
		</div>
	);
}

export function KbdDemoBasic() {
	return (
		<div className="flex items-center gap-2">
			<Kbd>Ctrl</Kbd>
			<Kbd>⌘K</Kbd>
			<Kbd>Ctrl + B</Kbd>
		</div>
	);
}

export function KbdDemoDefault() {
	return <Kbd>⌘</Kbd>;
}

export function KbdDemoGroup() {
	return (
		<KbdGroup>
			<Kbd>⌘</Kbd>
			<Kbd>K</Kbd>
		</KbdGroup>
	);
}

export function KbdDemoInputGroup() {
	return (
		<InputGroup>
			<InputGroupInput />
			<InputGroupAddon>
				<Kbd>Space</Kbd>
			</InputGroupAddon>
		</InputGroup>
	);
}

export function KbdDemoKbdGroup() {
	return (
		<KbdGroup>
			<Kbd>Ctrl</Kbd>
			<Kbd>Shift</Kbd>
			<Kbd>P</Kbd>
		</KbdGroup>
	);
}

export function KbdDemoModifierKeys() {
	return (
		<div className="flex items-center gap-2">
			<Kbd>⌘</Kbd>
			<Kbd>C</Kbd>
		</div>
	);
}

export function KbdDemoTooltip() {
	return (
		<Tooltip>
			<TooltipTrigger render={<Button size="icon-sm" variant="outline" />}>
				<SaveIcon />
			</TooltipTrigger>
			<TooltipContent className="pr-1.5">
				<div className="flex items-center gap-2">
					Save Changes <Kbd>S</Kbd>
				</div>
			</TooltipContent>
		</Tooltip>
	);
}

export function KbdDemoWithIconsAndText() {
	return (
		<KbdGroup>
			<Kbd>
				<ArrowLeftIcon />
				Left
			</Kbd>
			<Kbd>
				<CircleDashedIcon />
				Voice Enabled
			</Kbd>
		</KbdGroup>
	);
}

export function KbdDemoWithIcons() {
	return (
		<KbdGroup>
			<Kbd>
				<CircleDashedIcon />
			</Kbd>
			<Kbd>
				<ArrowLeftIcon />
			</Kbd>
			<Kbd>
				<ArrowRightIcon />
			</Kbd>
		</KbdGroup>
	);
}

export function KbdDemoWithSamp() {
	return (
		<Kbd>
			<samp>File</samp>
		</Kbd>
	);
}
