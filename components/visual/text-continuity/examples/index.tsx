"use client";

/**
 * Every Text Continuity example, keyed by the ids in `../data`. The demo renders
 * `EXAMPLES` in order and looks each component up here, so the two must stay in
 * step — `../lib.test.js` asserts that.
 */

import type { ComponentType } from "react";

import { SETTLE_SPRING, type ExampleId } from "../data";
import { Chart, Ticker } from "./charts";
import { SqueezeToAbbreviate, SquishyNumber } from "./elastic";
import { HoldToConfirm, RatingSlider, TrailingTag } from "./gestures";
import { Action, Copy, NumberField, Rewrite } from "./inline";
import { Download, Filters, ResultsSummary, Streaming, Wallet } from "./interface";
import { ReorderList } from "./lists";
import { SloshGauge } from "./machines";
import { SplitBar } from "./matter";
import { NumoraField } from "./numora";
import { PullToCount, SpinDial } from "./playful";
import { Resize } from "./resize";
import { BubbleSlider, RangeShove } from "./slider";
import { CurrencySwap, HexColour, Install, Units, Versions } from "./text";
import { Delta, Dimensions, Earned } from "./numbers";

/** Upstream gives the dial its own spring rather than the shared default. */
const SpinDialExample = () => <SpinDial ease={SETTLE_SPRING} />;

export const EXAMPLE_COMPONENTS: Readonly<Record<ExampleId, ComponentType>> = {
	install: Install,
	"bubble-slider": BubbleSlider,
	"range-shove": RangeShove,
	"spin-dial": SpinDialExample,
	"numora-field": NumoraField,
	streaming: Streaming,
	copy: Copy,
	"hex-colour": HexColour,
	wallet: Wallet,
	delta: Delta,
	earned: Earned,
	filters: Filters,
	versions: Versions,
	"hold-to-confirm": HoldToConfirm,
	units: Units,
	"currency-swap": CurrencySwap,
	action: Action,
	dimensions: Dimensions,
	"results-summary": ResultsSummary,
	rewrite: Rewrite,
	ticker: Ticker,
	chart: Chart,
	download: Download,
	"reorder-list": ReorderList,
	"pull-to-count": PullToCount,
	"rating-slider": RatingSlider,
	"split-bar": SplitBar,
	resize: Resize,
	"squishy-number": SquishyNumber,
	"squeeze-to-abbreviate": SqueezeToAbbreviate,
	"slosh-gauge": SloshGauge,
	"number-field": NumberField,
	"trailing-tag": TrailingTag,
};
