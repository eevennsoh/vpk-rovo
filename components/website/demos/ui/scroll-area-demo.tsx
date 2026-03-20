"use client";
import Image from "next/image";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const tags = [
	"v1.0.0-beta",
	"v1.0.0",
	"v1.1.0",
	"v1.2.0",
	"v1.3.0",
	"v1.4.0",
	"v2.0.0-beta",
	"v2.0.0",
	"v2.1.0",
	"v2.2.0",
	"v2.3.0",
	"v2.4.0",
	"v3.0.0-beta",
	"v3.0.0",
	"v3.1.0",
];

const works = [
	{
		artist: "Ornella Binni",
		art: "https://images.unsplash.com/photo-1465869185982-5a1a7522c441?auto=format&fit=crop&w=300&q=80",
	},
	{
		artist: "Tom Byrom",
		art: "https://images.unsplash.com/photo-1548516173-3cabfa4607e9?auto=format&fit=crop&w=300&q=80",
	},
	{
		artist: "Vladimir Fedotov",
		art: "https://images.unsplash.com/photo-1494337480532-3725c85fd2ab?auto=format&fit=crop&w=300&q=80",
	},
	{
		artist: "Vladimir Malyavko",
		art: "https://images.unsplash.com/photo-1474222277-6a22ccb3e3aa?auto=format&fit=crop&w=300&q=80",
	},
];

export default function ScrollAreaDemo() {
	return (
		<ScrollArea className="h-32 w-48 rounded-md border p-3">
			<div className="flex flex-col gap-2 text-sm">
				{Array.from({ length: 12 }, (_, i) => (
					<p key={i} className="text-muted-foreground">Item {i + 1}</p>
				))}
			</div>
		</ScrollArea>
	);
}

export function ScrollAreaDemoDefault() {
	return (
		<ScrollArea className="h-48 w-48 rounded-md border p-4">
			<div className="flex flex-col gap-2">
				<h4 className="text-sm font-medium">Tags</h4>
				{tags.map((tag) => (
					<div key={tag} className="flex flex-col gap-2">
						<div className="text-sm">{tag}</div>
						<Separator />
					</div>
				))}
			</div>
		</ScrollArea>
	);
}

export function ScrollAreaDemoHorizontal() {
	return (
		<ScrollArea className="mx-auto w-full max-w-96 rounded-md border p-4">
			<div className="flex gap-4">
				{works.map((artwork) => (
					<figure key={artwork.artist} className="shrink-0">
						<div className="overflow-hidden rounded-md">
							<Image
								src={artwork.art}
								alt={`Photo by ${artwork.artist}`}
								className="aspect-[3/4] h-fit w-fit object-cover"
								width={300}
								height={400}
							/>
						</div>
						<figcaption className="text-muted-foreground pt-2 text-xs">
							Photo by{" "}
							<span className="text-foreground font-semibold">
								{artwork.artist}
							</span>
						</figcaption>
					</figure>
				))}
			</div>
			<ScrollBar orientation="horizontal" />
		</ScrollArea>
	);
}

export function ScrollAreaDemoVertical() {
	return (
		<ScrollArea className="mx-auto h-72 w-48 rounded-md border">
			<div className="flex flex-col gap-4 p-4">
				<h4 className="text-sm leading-none font-medium">Tags</h4>
				{tags.map((tag) => (
					<div key={tag} className="flex flex-col gap-2">
						<div className="text-sm">{tag}</div>
						<Separator />
					</div>
				))}
			</div>
		</ScrollArea>
	);
}
