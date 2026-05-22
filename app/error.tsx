"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";

interface ErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
}

export default function Error({ error, reset }: Readonly<ErrorProps>) {
	const headingRef = useRef<HTMLHeadingElement>(null);

	useEffect(() => {
		console.error(error);
	}, [error]);

	useEffect(() => {
		headingRef.current?.focus();
	}, []);

	return (
		<div className="flex min-h-svh items-center justify-center bg-surface px-4 py-8">
			<Empty width="narrow" className="py-0">
				<EmptyHeader>
					<EmptyTitle ref={headingRef} tabIndex={-1}>
						Something went wrong
					</EmptyTitle>
					<EmptyDescription>
						An unexpected error occurred. You can try again or refresh the
						page.
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Button onClick={reset}>Try again</Button>
				</EmptyContent>
			</Empty>
		</div>
	);
}
