"use client";

import React from "react";
import Image from "next/image";
import { token } from "@/lib/tokens";

import { Button } from "@/components/ui/button";
import BookOpenIcon from "@atlaskit/icon/core/book-with-bookmark";
import EmojiAddIcon from "@atlaskit/icon/core/emoji-add";

interface DocumentMetadataProps {
	author: {
		name: string;
		avatar: string;
	};
	readTime: string;
}

export default function DocumentMetadata({
	author,
	readTime,
}: Readonly<DocumentMetadataProps>) {
	return (
		<div style={{ marginLeft: token("space.negative.100") }}>
			<div className="flex items-center">
				{/* Author Button */}
				<Button size="sm" variant="ghost">
					<span
						style={{
							fontWeight: token("font.weight.regular"),
							display: "flex",
							alignItems: "center",
							gap: token("space.100"),
						}}
					>
							<Image
								src={author.avatar}
								alt={author.name}
								width={16}
								height={16}
								unoptimized
								style={{
									width: 16,
									height: 16,
								borderRadius: "50%",
								objectFit: "cover",
							}}
						/>
						By {author.name}
					</span>
				</Button>

				{/* Read Time Button */}
				<Button className="gap-1.5" size="sm" variant="ghost">
					<BookOpenIcon label="Read time" size="small" />
					<span
						style={{
							fontWeight: token("font.weight.regular"),
							marginLeft: token("space.100"),
						}}
					>
						{readTime}
					</span>
				</Button>

				{/* Add Emoji Button */}
				<Button className="gap-1.5" size="sm" variant="ghost">
					<EmojiAddIcon label="Add emoji" size="small" />
					<span
						style={{
							fontWeight: token("font.weight.regular"),
							marginLeft: token("space.100"),
						}}
					>
						Add an emoji
					</span>
				</Button>
			</div>
		</div>
	);
}
