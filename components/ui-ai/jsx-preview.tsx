"use client";

import type { ComponentProps, ReactNode } from "react";
import type { TProps as JsxParserProps } from "react-jsx-parser";

import { AlertCircle } from "@/components/ui/vpk-icons";
import { cn } from "@/lib/utils";
import {
	createContext,
	memo,
	useCallback,
	use,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import JsxParser from "react-jsx-parser";

interface JSXPreviewContextValue {
	jsx: string;
	processedJsx: string;
	isStreaming: boolean;
	error: Error | null;
	setError: (error: Error | null, errorJsx?: string) => void;
	components: JsxParserProps["components"];
	bindings: JsxParserProps["bindings"];
	onErrorProp?: (error: Error) => void;
}

const JSXPreviewContext = createContext<JSXPreviewContextValue | null>(null);

const TAG_REGEX = /<\/?([a-zA-Z][a-zA-Z0-9]*)\s*([^>]*?)(\/)?>/;

interface JSXPreviewErrorState {
	error: Error;
	jsx: string;
}

interface JSXPreviewQueuedError {
	error: Error;
	isStreaming: boolean;
	jsx: string;
}

export function useJSXPreview() {
	const context = use(JSXPreviewContext);
	if (!context) {
		throw new Error("JSXPreview components must be used within JSXPreview");
	}
	return context;
}

function matchJsxTag(code: string) {
	if (code.trim() === "") {
		return null;
	}

	const match = code.match(TAG_REGEX);

	if (!match || match.index === undefined) {
		return null;
	}

	const [fullMatch, tagName, attributes, selfClosing] = match;

	let type: "self-closing" | "closing" | "opening";
	if (selfClosing) {
		type = "self-closing";
	} else if (fullMatch.startsWith("</")) {
		type = "closing";
	} else {
		type = "opening";
	}

	return {
		attributes: attributes.trim(),
		endIndex: match.index + fullMatch.length,
		startIndex: match.index,
		tag: fullMatch,
		tagName,
		type,
	};
}

function stripIncompleteTag(text: string) {
	// Find the last '<' that isn't part of a complete tag
	const lastOpen = text.lastIndexOf("<");
	if (lastOpen === -1) {
		return text;
	}

	const afterOpen = text.slice(lastOpen);
	// If there's no closing '>' after the last '<', it's an incomplete tag
	if (!afterOpen.includes(">")) {
		return text.slice(0, lastOpen);
	}

	return text;
}

function completeJsxTag(code: string) {
	const stack: string[] = [];
	let result = "";
	let currentPosition = 0;

	while (currentPosition < code.length) {
		const match = matchJsxTag(code.slice(currentPosition));
		if (!match) {
			// No more tags found, strip any trailing incomplete tag
			result += stripIncompleteTag(code.slice(currentPosition));
			break;
		}
		const { tagName, type, endIndex } = match;

		// Include any text content before this tag
		result += code.slice(currentPosition, currentPosition + endIndex);

		if (type === "opening") {
			stack.push(tagName);
		} else if (type === "closing") {
			stack.pop();
		}

		currentPosition += endIndex;
	}

	return (
		result +
		stack
			.toReversed()
			.map((tag) => `</${tag}>`)
			.join("")
	);
}

export type JSXPreviewProps = Omit<ComponentProps<"div">, "onError"> & {
	jsx: string;
	isStreaming?: boolean;
	components?: JsxParserProps["components"];
	bindings?: JsxParserProps["bindings"];
	onError?: (error: Error) => void;
};

export const JSXPreview = memo(function JSXPreview({
	jsx,
	isStreaming = false,
	components,
	bindings,
	onError,
	className,
	children,
	...props
}: Readonly<JSXPreviewProps>) {
	const [errorState, setErrorState] = useState<JSXPreviewErrorState | null>(
		null,
	);

	const processedJsx = useMemo(
		() => (isStreaming ? completeJsxTag(jsx) : jsx),
		[jsx, isStreaming],
	);
	const error = errorState?.jsx === processedJsx ? errorState.error : null;
	const setError = useCallback(
		(nextError: Error | null, errorJsx = processedJsx) => {
			setErrorState(
				nextError
					? {
							error: nextError,
							jsx: errorJsx,
						}
					: null,
			);
		},
		[processedJsx],
	);

	const contextValue = useMemo(
		() => ({
			bindings,
			components,
			error,
			isStreaming,
			jsx,
			onErrorProp: onError,
			processedJsx,
			setError,
		}),
		[
			bindings,
			components,
			error,
			isStreaming,
			jsx,
			onError,
			processedJsx,
			setError,
		],
	);

	return (
		<JSXPreviewContext value={contextValue}>
			<div className={cn("relative", className)} {...props}>
				{children}
			</div>
		</JSXPreviewContext>
	);
});

export type JSXPreviewContentProps = Omit<ComponentProps<"div">, "children">;

export const JSXPreviewContent = memo(function JSXPreviewContent({
	className,
	...props
}: Readonly<JSXPreviewContentProps>) {
	const {
		processedJsx,
		isStreaming,
		components,
		bindings,
		setError,
		onErrorProp,
	} = useJSXPreview();
	const errorReportedRef = useRef<string | null>(null);
	const pendingErrorRef = useRef<JSXPreviewQueuedError | null>(null);
	const [displayJsx, setDisplayJsx] = useState(processedJsx);
	const [lastGoodJsx, setLastGoodJsx] = useState("");

	useLayoutEffect(() => {
		errorReportedRef.current = null;
		setDisplayJsx(processedJsx);
	}, [processedJsx]);

	// JsxParser calls onError while it renders, so queue follow-up work here
	// and commit it after render to avoid cross-component render updates.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => {
		const pendingError = pendingErrorRef.current;
		if (!pendingError) {
			return;
		}

		pendingErrorRef.current = null;

		if (pendingError.isStreaming) {
			setDisplayJsx(lastGoodJsx);
			return;
		}

		setError(pendingError.error, pendingError.jsx);
		onErrorProp?.(pendingError.error);
	});

	const handleError = useCallback(
		(err: Error) => {
			// Prevent duplicate error reports for the same jsx
			if (errorReportedRef.current === processedJsx) {
				return;
			}
			errorReportedRef.current = processedJsx;
			pendingErrorRef.current = {
				error: err,
				isStreaming,
				jsx: processedJsx,
			};
		},
		[processedJsx, isStreaming],
	);

	// Track the last JSX that rendered without error
	useEffect(() => {
		if (displayJsx !== processedJsx) {
			return;
		}

		if (pendingErrorRef.current?.jsx === processedJsx) {
			return;
		}

		setLastGoodJsx((currentLastGoodJsx) =>
			currentLastGoodJsx === processedJsx
				? currentLastGoodJsx
				: processedJsx,
		);
	}, [displayJsx, processedJsx]);

	return (
		<div className={cn("jsx-preview-content", className)} {...props}>
			<JsxParser
				bindings={bindings}
				components={components}
				jsx={displayJsx}
				onError={handleError}
				renderInWrapper={false}
			/>
		</div>
	);
});

export type JSXPreviewErrorProps = Omit<ComponentProps<"div">, "children"> & {
	children?: ReactNode | ((error: Error) => ReactNode);
};

function renderChildren(
	children: ReactNode | ((error: Error) => ReactNode),
	error: Error,
): ReactNode {
	if (typeof children === "function") {
		return children(error);
	}
	return children;
}

export const JSXPreviewError = memo(function JSXPreviewError({
	className,
	children,
	...props
}: Readonly<JSXPreviewErrorProps>) {
	const { error } = useJSXPreview();

	if (!error) {
		return null;
	}

	return (
		<div
			className={cn(
				"flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-destructive text-sm",
				className,
			)}
			{...props}
		>
			{children ? (
				renderChildren(children, error)
			) : (
				<>
					<AlertCircle className="size-4 shrink-0" />
					<span>{error.message}</span>
				</>
			)}
		</div>
	);
});
