export const DEFAULT_SCRIBBLES_SVG_SRC = "/illustration-ai/chat/light.svg";

export type ScribblesSvgSource = Readonly<{
	src: string;
	name: string;
	uploaded: boolean;
}>;

export type ScribblesSvgFileLike = Readonly<{
	type: string;
	name: string;
}>;

export const DEFAULT_SCRIBBLES_SVG_SOURCE: ScribblesSvgSource = {
	src: DEFAULT_SCRIBBLES_SVG_SRC,
	name: "illustration-ai/chat/light.svg",
	uploaded: false,
};

export function isScribblesSvgFile(file: ScribblesSvgFileLike): boolean {
	return file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
}
