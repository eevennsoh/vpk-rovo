"use client";

import React from "react";
import { token } from "@/lib/tokens";
import { Button } from "@/components/ui/button";
import Heading from "@/components/blocks/shared-ui/heading";

import SourceCard from "./source-card";
import { useCarousel } from "../hooks/use-carousel";
import type { SourceCard as SourceCardType } from "../data/ai-summary-data";
import ArrowLeftIcon from "@atlaskit/icon/core/arrow-left";
import ArrowRightIcon from "@atlaskit/icon/core/arrow-right";

interface SourcesCarouselProps {
	sources: readonly SourceCardType[];
}

const CARD_WIDTH = 316;
const GAP = 16;

/**
 * Carousel component for displaying source cards with navigation
 */
export default function SourcesCarousel({ sources }: Readonly<SourcesCarouselProps>): React.ReactElement {
	const { carouselRef, scrollPrev, scrollNext } = useCarousel({ cardWidth: CARD_WIDTH, gap: GAP });

	return (
		<div>
			<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: token("space.100") }}>
				<div style={{ color: token("color.text.subtlest") }}>
					<Heading size="xxsmall">Sources</Heading>
				</div>
				<div className="flex gap-1">
					<Button aria-label="Previous source" size="icon-sm" variant="ghost" onClick={scrollPrev}>
						<ArrowLeftIcon label="" size="small" />
					</Button>
					<Button aria-label="Next source" size="icon-sm" variant="ghost" onClick={scrollNext}>
						<ArrowRightIcon label="" size="small" />
					</Button>
				</div>
			</div>

			<div
				ref={carouselRef}
				style={{
					display: "flex",
					gap: token("space.200"),
					overflowX: "auto",
					scrollbarWidth: "none",
					msOverflowStyle: "none",
				}}
				className="[&::-webkit-scrollbar]:hidden"
			>
				{sources.map((source) => (
					<SourceCard key={source.id} source={source} />
				))}
			</div>
		</div>
	);
}
