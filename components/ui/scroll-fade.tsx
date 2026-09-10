"use client"

import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"

import { cn } from "@/lib/utils"

export type ScrollFadeAxis = "y" | "x"
export type ScrollFadeEdge = "both" | "start" | "end"

/**
 * `animation-timeline: scroll(self …)` resolves against the element the utility
 * sits on, so a fade class on a non-scrolling wrapper silently does nothing.
 * Pairing each axis with its overflow here keeps that contract off the caller.
 *
 * The horizontal axis uses the logical `-s`/`-e` utilities rather than `-l`/`-r`
 * so the fade mirrors under `dir="rtl"`.
 */
const SCROLL_FADE_CLASSES = {
	y: {
		both: "scroll-fade-y overflow-y-auto",
		start: "scroll-fade-t overflow-y-auto",
		end: "scroll-fade-b overflow-y-auto",
	},
	x: {
		both: "scroll-fade-x overflow-x-auto",
		start: "scroll-fade-s overflow-x-auto",
		end: "scroll-fade-e overflow-x-auto",
	},
} as const

/** Numbers are spacing steps, matching the `scroll-fade-<number>` utility. */
function toFadeLength(value: number | string): string {
	return typeof value === "number" ? `calc(var(--spacing) * ${value})` : value
}

export interface ScrollFadeProps extends useRender.ComponentProps<"div"> {
	/** Scroll direction the fade tracks. */
	axis?: ScrollFadeAxis
	/** Which edge fades. `both` fades the leading and trailing edge. */
	edge?: ScrollFadeEdge
	/** Fade depth. Number = spacing steps, string = any CSS length. */
	size?: number | string
	/** Scroll distance the fade eases in over. Number = spacing steps. */
	reveal?: number | string
}

function ScrollFade({
	axis = "y",
	edge = "both",
	size,
	reveal,
	className,
	render,
	style,
	...props
}: Readonly<ScrollFadeProps>) {
	return useRender({
		defaultTagName: "div",
		props: mergeProps<"div">(
			{
				className: cn(SCROLL_FADE_CLASSES[axis][edge], className),
				style: {
					// `--scroll-fade-size` / `--scroll-fade-reveal` are unregistered, so
					// they inherit. Always emit them — `initial` is the guaranteed-invalid
					// value, which sends the utility back to its own default instead of
					// picking up an outer ScrollFade's size.
					"--scroll-fade-size":
						size === undefined ? "initial" : toFadeLength(size),
					"--scroll-fade-reveal":
						reveal === undefined ? "initial" : toFadeLength(reveal),
					...style,
				} as React.CSSProperties,
			},
			props
		),
		render,
		state: {
			slot: "scroll-fade",
			axis,
			edge,
		},
	})
}

export { ScrollFade }
