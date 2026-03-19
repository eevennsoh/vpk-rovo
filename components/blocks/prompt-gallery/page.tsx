"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import DiscoverMoreExamples from "./components/discover-more-examples";
import { DEFAULT_PROMPT_GALLERY_EXAMPLES, type PromptGalleryExample } from "./data/examples";
import { DEFAULT_PROMPT_GALLERY_SUGGESTIONS, type PromptGallerySuggestion } from "./data/suggestions";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";

interface PromptGalleryProps {
	items?: readonly PromptGallerySuggestion[];
	examples?: readonly PromptGalleryExample[];
	onSelect: (prompt: string) => void;
	onPreviewStart?: (prompt: string) => void;
	onPreviewEnd?: () => void;
	onExpandChange?: (expanded: boolean) => void;
	showMore?: boolean;
	moreLabel?: string;
	className?: string;
}

function getSuggestionPrompt(suggestion: PromptGallerySuggestion): string {
	return suggestion.prompt ?? suggestion.label;
}

export default function PromptGallery({
	items = DEFAULT_PROMPT_GALLERY_SUGGESTIONS,
	examples = DEFAULT_PROMPT_GALLERY_EXAMPLES,
	onSelect,
	onPreviewStart,
	onPreviewEnd,
	onExpandChange,
	showMore = true,
	moreLabel = "More",
	className,
}: Readonly<PromptGalleryProps>) {
	const [showMoreSection, setShowMoreSection] = useState(false);
	const [isClosingMore, setIsClosingMore] = useState(false);
	const previewEndTimer = useRef<ReturnType<typeof setTimeout>>(null);

	const handlePreviewStart = (prompt: string) => {
		if (previewEndTimer.current) {
			clearTimeout(previewEndTimer.current);
			previewEndTimer.current = null;
		}
		onPreviewStart?.(prompt);
	};

	const handlePreviewEnd = () => {
		if (previewEndTimer.current) {
			clearTimeout(previewEndTimer.current);
		}

		previewEndTimer.current = setTimeout(() => {
			onPreviewEnd?.();
			previewEndTimer.current = null;
		}, 150);
	};

	useEffect(() => {
		return () => {
			if (previewEndTimer.current) {
				clearTimeout(previewEndTimer.current);
				previewEndTimer.current = null;
			}

			onPreviewEnd?.();
		};
	}, [onPreviewEnd]);

	const closeMoreSection = () => {
		setIsClosingMore(true);

		setTimeout(() => {
			onExpandChange?.(false);
			setShowMoreSection(false);
			setIsClosingMore(false);
		}, 350);
	};

	return (
		<div className={cn("w-full", className)}>
			{showMoreSection ? (
				<DiscoverMoreExamples
					examples={examples}
					onExampleClick={onSelect}
					onExamplePreviewStart={handlePreviewStart}
					onExamplePreviewEnd={handlePreviewEnd}
					onClose={closeMoreSection}
					isClosing={isClosingMore}
				/>
			) : (
				<div className="flex flex-wrap justify-center gap-2">
					{items.map((suggestion) => {
						const Icon = suggestion.icon;
						const suggestionPrompt = getSuggestionPrompt(suggestion);

						return (
							<Button
								key={suggestion.label}
								className="gap-2 rounded-full"
								variant="secondary"
								onClick={() => onSelect(suggestionPrompt)}
								onMouseEnter={() => handlePreviewStart(suggestionPrompt)}
								onMouseLeave={handlePreviewEnd}
								onFocus={() => handlePreviewStart(suggestionPrompt)}
								onBlur={handlePreviewEnd}
							>
								<Icon label="" size="small" />
								{suggestion.label}
							</Button>
						);
					})}
					{showMore ? (
						<Button
							className="gap-2 rounded-full"
							variant="secondary"
							onClick={() => {
								setShowMoreSection(true);
								onExpandChange?.(true);
							}}
						>
							<ChevronDownIcon label="" size="small" />
							{moreLabel}
						</Button>
					) : null}
				</div>
			)}
		</div>
	);
}
