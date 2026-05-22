"use client";

import type { ReactNode } from "react";
import type { LinkSafetyModalProps } from "streamdown";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import ShortcutIcon from "@atlaskit/icon/core/shortcut";
import { useCallback, useState } from "react";

function LinkSafetyDialog({
	url,
	isOpen,
	onClose,
	onConfirm,
}: Readonly<LinkSafetyModalProps>) {
	const [loading, setLoading] = useState(true);

	const handleLoad = useCallback(() => {
		setLoading(false);
	}, []);

	const handleOpenChange = useCallback(
		(open: boolean) => {
			if (!open) {
				onClose();
				setLoading(true);
			}
		},
		[onClose],
	);

	const handleOpenInNewTab = useCallback(() => {
		onConfirm();
	}, [onConfirm]);

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogContent size="lg" className="gap-0 p-0">
				<DialogHeader className="border-b px-6 pb-6 pt-6">
					<DialogTitle>External link</DialogTitle>
					<DialogDescription className="truncate">
						{url}
					</DialogDescription>
				</DialogHeader>
				<div className="cv-auto relative h-[70vh]" style={{ containIntrinsicSize: "auto 480px" }}>
					{loading ? (
						<div className="absolute inset-0 flex items-center justify-center">
							<Spinner />
						</div>
					) : null}
					<iframe
						className={cn(
							"size-full",
							loading && "invisible",
						)}
						onLoad={handleLoad}
						// oxlint-disable-next-line eslint-plugin-react(iframe-missing-sandbox)
						sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
						src={url}
						title="External link"
					/>
				</div>
				<DialogFooter className="border-t p-6">
					<Button variant="outline" onClick={() => onClose()}>
						Close
					</Button>
					<Button onClick={handleOpenInNewTab}>
						<ShortcutIcon label="" />
						Open in new tab
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function renderLinkSafetyModal(
	props: LinkSafetyModalProps,
): ReactNode {
	return <LinkSafetyDialog {...props} />;
}
