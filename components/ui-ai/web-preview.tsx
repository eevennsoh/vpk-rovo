"use client";

import type { ComponentProps, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
	type ChromiumPreviewControls,
	ChromiumPreviewBody,
	isChromiumPreviewUrl,
} from "@/components/ui-ai/web-preview-chromium";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronDownIcon } from "@/components/ui/vpk-icons";
import { cn } from "@/lib/utils";
import { API_ENDPOINTS } from "@/lib/api-config";
import {
	createContext,
	useCallback,
	use,
	useMemo,
	useState,
} from "react";

export type WebPreviewEngine = "auto" | "iframe" | "chromium";
export type WebPreviewNavigationAction = "back" | "forward" | "reload";

const DEFAULT_CHROMIUM_CONTROLS: ChromiumPreviewControls = {
	back: null,
	forward: null,
	reload: null,
	canGoBack: false,
	canGoForward: false,
	busy: false,
};

export interface WebPreviewContextValue {
	url: string;
	setUrl: (url: string) => void;
	consoleOpen: boolean;
	setConsoleOpen: (open: boolean) => void;
	proxy: boolean;
	engine: WebPreviewEngine;
	chromiumControls: ChromiumPreviewControls;
	setChromiumControls: (controls: ChromiumPreviewControls | null) => void;
}

const WebPreviewContext = createContext<WebPreviewContextValue | null>(null);

function useWebPreview() {
	const context = use(WebPreviewContext);
	if (!context) {
		throw new Error("WebPreview components must be used within a WebPreview");
	}
	return context;
}

export type WebPreviewProps = ComponentProps<"div"> & {
	defaultUrl?: string;
	onUrlChange?: (url: string) => void;
	proxy?: boolean;
	engine?: WebPreviewEngine;
};

export function WebPreview({
	className,
	children,
	defaultUrl = "",
	engine = "auto",
	onUrlChange,
	proxy = false,
	...props
}: Readonly<WebPreviewProps>) {
	const [url, setUrl] = useState(defaultUrl);
	const [consoleOpen, setConsoleOpen] = useState(false);
	const [chromiumControls, setChromiumControlsState] = useState(
		DEFAULT_CHROMIUM_CONTROLS
	);

	const handleUrlChange = useCallback(
		(newUrl: string) => {
			setUrl(newUrl);
			onUrlChange?.(newUrl);
		},
		[onUrlChange]
	);

	const setChromiumControls = useCallback(
		(nextControls: ChromiumPreviewControls | null) => {
			setChromiumControlsState(nextControls ?? DEFAULT_CHROMIUM_CONTROLS);
		},
		[]
	);

	const contextValue = useMemo<WebPreviewContextValue>(
		() => ({
			chromiumControls,
			consoleOpen,
			engine,
			proxy,
			setChromiumControls,
			setConsoleOpen,
			setUrl: handleUrlChange,
			url,
		}),
		[
			chromiumControls,
			consoleOpen,
			engine,
			handleUrlChange,
			proxy,
			setChromiumControls,
			url,
		]
	);

	return (
		<WebPreviewContext value={contextValue}>
			<div
				className={cn(
					"flex size-full flex-col rounded-lg border bg-card",
					className
				)}
				{...props}
			>
				{children}
			</div>
		</WebPreviewContext>
	);
}

export type WebPreviewNavigationProps = ComponentProps<"div">;

export function WebPreviewNavigation({
	className,
	children,
	...props
}: Readonly<WebPreviewNavigationProps>) {
	return (
		<div
			className={cn("flex items-center gap-1 border-b p-2", className)}
			{...props}
		>
			{children}
		</div>
	);
}

export type WebPreviewNavigationButtonProps = ComponentProps<typeof Button> & {
	tooltip?: string;
	action?: WebPreviewNavigationAction;
};

export function WebPreviewNavigationButton({
	action,
	onClick,
	disabled,
	tooltip,
	children,
	...props
}: Readonly<WebPreviewNavigationButtonProps>) {
	const { chromiumControls } = useWebPreview();
	const actionHandler = action ? chromiumControls[action] : null;
	const actionDisabled =
		action === "back"
			? !chromiumControls.canGoBack
			: action === "forward"
				? !chromiumControls.canGoForward
				: action === "reload"
					? !actionHandler
					: false;

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger
					render={
						<Button
							className="h-8 w-8 p-0 hover:text-foreground"
							disabled={disabled ?? actionDisabled}
							onClick={
								onClick ??
								(actionHandler
									? () => {
											void actionHandler();
										}
									: undefined)
							}
							size="sm"
							variant="ghost"
							{...props}
						/>
					}
				>
					{children}
				</TooltipTrigger>
				<TooltipContent>
					<p>{tooltip}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

export type WebPreviewUrlProps = ComponentProps<typeof Input>;
type WebPreviewUrlChangeHandler = NonNullable<WebPreviewUrlProps["onChange"]>;
type WebPreviewUrlKeyDownHandler = NonNullable<WebPreviewUrlProps["onKeyDown"]>;

export function WebPreviewUrl({
	value,
	onChange,
	onKeyDown,
	...props
}: Readonly<WebPreviewUrlProps>) {
	const { url, setUrl } = useWebPreview();
	const [prevUrl, setPrevUrl] = useState(url);
	const [inputValue, setInputValue] = useState(url);

	// Sync input value with context URL when it changes externally (derived state pattern)
	if (url !== prevUrl) {
		setPrevUrl(url);
		setInputValue(url);
	}

	const handleChange = useCallback<WebPreviewUrlChangeHandler>(
		(event) => {
			setInputValue(event.target.value);
			onChange?.(event);
		},
		[onChange]
	);

	const handleKeyDown = useCallback<WebPreviewUrlKeyDownHandler>(
		(event) => {
			if (event.key === "Enter") {
				setUrl(event.currentTarget.value);
			}
			onKeyDown?.(event);
		},
		[setUrl, onKeyDown]
	);

	return (
		<Input
			className="h-8 flex-1 text-sm"
			onChange={onChange ?? handleChange}
			onKeyDown={handleKeyDown}
			placeholder="Enter URL..."
			value={value ?? inputValue}
			{...props}
		/>
	);
}

export type WebPreviewBodyProps = ComponentProps<"iframe"> & {
	loading?: ReactNode;
};

export function WebPreviewBody({
	className,
	loading,
	src,
	...props
}: Readonly<WebPreviewBodyProps>) {
	const { url, proxy, engine, setChromiumControls, setUrl } = useWebPreview();
	const rawTargetUrl = src ?? url;
	const resolvedEngine =
		engine === "auto"
			? isChromiumPreviewUrl(rawTargetUrl ?? "")
				? "chromium"
				: "iframe"
			: engine;

	const resolvedSrc = useMemo(() => {
		const raw = rawTargetUrl;
		if (!raw) return undefined;
		if (resolvedEngine === "iframe" && proxy && /^https?:\/\//i.test(raw)) {
			return API_ENDPOINTS.webProxy(raw);
		}
		return raw;
	}, [proxy, rawTargetUrl, resolvedEngine]);

	if (resolvedEngine === "chromium" && rawTargetUrl) {
		return (
			<div className="flex-1">
				<ChromiumPreviewBody
					className={className}
					loading={loading}
					onControlsChange={setChromiumControls}
					onUrlChange={setUrl}
					targetUrl={rawTargetUrl}
				/>
			</div>
		);
	}

	return (
		<div className="flex-1">
			<iframe
				className={cn("size-full", className)}
				referrerPolicy="no-referrer"
				sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation"
				src={resolvedSrc || undefined}
				title="Preview"
				{...props}
			/>
			{loading}
		</div>
	);
}

export type WebPreviewConsoleProps = ComponentProps<"div"> & {
	logs?: {
		level: "log" | "warn" | "error";
		message: string;
		timestamp: Date;
	}[];
};

export function WebPreviewConsole({
	className,
	logs = [],
	children,
	...props
}: Readonly<WebPreviewConsoleProps>) {
	const { consoleOpen, setConsoleOpen } = useWebPreview();

	return (
		<Collapsible
			className={cn("border-t bg-muted/50 font-mono text-sm", className)}
			onOpenChange={setConsoleOpen}
			open={consoleOpen}
			{...props}
		>
			<CollapsibleTrigger render={<Button className="flex w-full items-center justify-between p-4 text-left font-medium hover:bg-muted/50" variant="ghost" />}>Console
				<ChevronDownIcon
					className={cn(
						"h-4 w-4 transition-transform duration-200",
						consoleOpen && "rotate-180"
					)}
				/></CollapsibleTrigger>
			<CollapsibleContent
				className={cn(
					"px-4 pb-4",
					"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 outline-none data-[state=closed]:animate-out data-[state=open]:animate-in"
				)}
			>
				<div className="max-h-48 space-y-1 overflow-y-auto">
					{logs.length === 0 ? (
						<p className="text-muted-foreground">No console output</p>
					) : (
						logs.map((log, index) => (
							<div
								className={cn(
									"text-xs",
									log.level === "error" && "text-destructive",
									log.level === "warn" && "text-yellow-600",
									log.level === "log" && "text-foreground"
								)}
								key={`${log.timestamp.getTime()}-${index}`}
							>
								<span className="text-muted-foreground">
									{log.timestamp.toLocaleTimeString()}
								</span>{" "}
								{log.message}
							</div>
						))
					)}
					{children}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}
