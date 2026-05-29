"use client";

import type { ComponentProps, ReactNode } from "react";
import {
	PromptInput,
	PromptInputBody,
	PromptInputButton,
} from "@/components/ui-custom/prompt-input";
import { composerPromptInputClassName } from "@/components/blocks/shared-ui/composer-styles";
import { cn } from "@/lib/utils";
import AddIcon from "@atlaskit/icon/core/add";

export type FloatingComposerProps = Omit<
	ComponentProps<typeof PromptInput>,
	"variant" | "children"
> & {
	// The text field — render a <PromptInputTextarea> with your own ref/value/handlers.
	children: ReactNode;
	// Trailing action cluster (e.g. <RovoComposerActionButton />). Sits at the far right.
	actions: ReactNode;
	// Full override for the leading "+" control. Defaults to a ghost Add icon button.
	addButton?: ReactNode;
	// Props forwarded to the default "+" button (ignored when `addButton` is provided).
	addButtonProps?: ComponentProps<typeof PromptInputButton>;
};

/**
 * Shared floating prompt composer shell.
 *
 * Lays out `[ + ] [ textarea ] [ actions ]` on a single vertically-centered flex row using
 * the `variant="floating"` PromptInput. This is the single source of truth for the floating
 * composer layout: the Studio composer and the Prompt Input demo both render it, so any
 * layout change here (button position, spacing, alignment) propagates to both surfaces.
 */
export function FloatingComposer({
	actions,
	addButton,
	addButtonProps,
	children,
	className,
	...props
}: Readonly<FloatingComposerProps>) {
	return (
		<PromptInput
			variant="floating"
			className={cn(composerPromptInputClassName, className)}
			{...props}
		>
			<PromptInputBody className="flex w-full items-center gap-2">
				{addButton ?? (
					<PromptInputButton
						size="icon-sm"
						variant="ghost"
						aria-label="Add"
						{...addButtonProps}
					>
						<AddIcon label="" />
					</PromptInputButton>
				)}
				{children}
				<div className="flex shrink-0 items-center gap-1">{actions}</div>
			</PromptInputBody>
		</PromptInput>
	);
}
