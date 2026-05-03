import type { ReactNode, SVGProps } from "react";

interface PixelIconProps extends Omit<SVGProps<SVGSVGElement>, "viewBox" | "xmlns" | "fill"> {
	label?: string;
}

function PixelIcon({
	children,
	className,
	label = "",
	...props
}: PixelIconProps & { children: ReactNode }) {
	const hasLabel = label.length > 0;
	return (
		<svg
			aria-hidden={hasLabel ? undefined : true}
			aria-label={hasLabel ? label : undefined}
			className={className}
			fill="currentColor"
			height={24}
			role={hasLabel ? "img" : "presentation"}
			viewBox="0 0 24 24"
			width={24}
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			{children}
		</svg>
	);
}

export function PixelArrowRightIcon(props: PixelIconProps) {
	return (
		<PixelIcon {...props}>
			<path d="M4 11v2h16v-2zm12 2v2h2v-2zm-2 2v2h2v-2zm-2 2v2h2v-2zm4-6V9h2v2z" />
			<path d="M14 15V7h2v8zm-2 2V5h2v12z" />
		</PixelIcon>
	);
}

export function PixelCloseIcon(props: PixelIconProps) {
	return (
		<PixelIcon {...props}>
			<rect x="4" y="4" width="2.28573" height="2.28573" />
			<rect x="6.28516" y="6.28564" width="2.28573" height="2.28573" />
			<rect x="8.57129" y="8.57178" width="2.28573" height="2.28573" />
			<rect x="10.8555" y="10.8569" width="2.28573" height="2.28573" />
			<rect x="13.1436" y="13.1431" width="2.28573" height="2.28573" />
			<rect x="15.4287" y="15.4282" width="2.28573" height="2.28573" />
			<rect x="17.7148" y="17.7144" width="2.28573" height="2.28573" />
			<rect x="13.1436" y="8.57178" width="2.28573" height="2.28573" />
			<rect x="15.4287" y="6.28564" width="2.28573" height="2.28573" />
			<rect x="17.7148" y="4" width="2.28573" height="2.28573" />
			<rect x="8.57129" y="13.1431" width="2.28573" height="2.28573" />
			<rect x="6.28516" y="15.4282" width="2.28573" height="2.28573" />
			<rect x="4" y="17.7144" width="2.28573" height="2.28573" />
		</PixelIcon>
	);
}

export function PixelConfigureIcon(props: PixelIconProps) {
	return (
		<PixelIcon {...props}>
			<path d="M10 22H6V20H10V22ZM6 20H4V18H2V16H4V14H6V20ZM12 16H22V18H12V20H10V14H12V16ZM10 14H6V12H10V14ZM18 12H14V10H18V12ZM12 8H2V6H12V4H14V10H12V8ZM20 6H22V8H20V10H18V4H20V6ZM18 4H14V2H18V4Z" />
		</PixelIcon>
	);
}

export function PixelDarkIcon(props: PixelIconProps) {
	return (
		<PixelIcon {...props}>
			<path d="M15 22H9V16H15V22ZM11 20H13V18H11V20ZM9 16H7V14H9V16ZM17 16H15V14H17V16ZM7 14H5V8H7V14ZM19 14H17V8H19V14ZM9 8H7V6H9V8ZM17 8H15V6H17V8ZM15 6H9V4H15V6Z" />
		</PixelIcon>
	);
}

export function PixelIngestIcon(props: PixelIconProps) {
	return (
		<PixelIcon {...props}>
			<path d="M8 3H16V5H8V3ZM8 7H16V9H8V7Z" />
			<path d="M8 7H10V11H8V7ZM3 11H8V13H3V11ZM3 13H5V15H3V13ZM5 15H7V17H5V15ZM7 17H9V19H7V17ZM9 19H11V21H9V19ZM11 21H13V23H11V21ZM13 19H15V21H13V19ZM15 17H17V19H15V17ZM17 15H19V17H17V15ZM19 11H21V15H19V11ZM16 11H19V13H16V11ZM14 7H16V11H14V7Z" />
		</PixelIcon>
	);
}

export function PixelLightIcon(props: PixelIconProps) {
	return (
		<PixelIcon {...props}>
			<path d="M15 22H9V16H15V22ZM11 20H13V18H11V20ZM9 16H7V14H9V16ZM17 16H15V14H17V16ZM7 14H5V8H7V14ZM19 14H17V8H19V14ZM3 12H0V10H3V12ZM24 12H21V10H24V12ZM9 8H7V6H9V8ZM17 8H15V6H17V8ZM5 6H3V4H5V6ZM15 6H9V4H15V6ZM21 6H19V4H21V6ZM3 4H1V2H3V4ZM23 4H21V2H23V4ZM13 3H11V0H13V3Z" />
		</PixelIcon>
	);
}

export function PixelRefreshIcon(props: PixelIconProps) {
	return (
		<PixelIcon {...props}>
			<path d="M10 16H20V18H10V22H8V20H6V18H4V16H6V14H8V12H10V16ZM22 16H20V11H22V16ZM4 13H2V8H4V13ZM16 4H18V6H20V8H18V10H16V12H14V8H4V6H14V2H16V4Z" />
		</PixelIcon>
	);
}

export function PixelSystemIcon(props: PixelIconProps) {
	return (
		<PixelIcon {...props}>
			<path d="M11 17V19H13V17H11ZM4 15H2V5H4V15ZM22 15H20V5H22V15ZM20 5H4V3H20V5ZM15 19H18V21H6V19H9V17H4V15H20V17H15V19Z" />
		</PixelIcon>
	);
}

export function PixelResetIcon(props: PixelIconProps) {
	return (
		<PixelIcon {...props}>
			<path d="M16 17H20V19H16V23H14V21H12V19H10V17H12V15H14V13H16V17ZM8 19H4V17H8V19ZM4 17H2V14H4V17ZM22 17H20V14H22V17ZM6 14H4V12H6V14ZM10 14H8V12H6V10H4V8H10V14ZM20 14H18V12H20V14ZM19 10H13V8H15V6H17V4H19V10ZM10 6H8V3H10V6ZM15 6H13V3H15V6ZM13 3H10V1H13V3Z" />
		</PixelIcon>
	);
}

export function PixelVaultIcon(props: PixelIconProps) {
	return (
		<PixelIcon {...props}>
			<path d="M3 2H21V4H3V2ZM3 7H21V9H3V7ZM1 4H3V7H1V4ZM21 4H23V7H21V4ZM19 9H21V20H19V9ZM3 9H5V20H3V9ZM5 20H19V22H5V20ZM9 11H15V13H9V11Z" />
		</PixelIcon>
	);
}
