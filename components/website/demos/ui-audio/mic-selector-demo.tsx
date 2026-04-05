"use client";

import { useState } from "react";
import { Disc3, SquareIcon as Square, Trash2Icon as Trash2 } from "@/components/ui/vpk-icons";
import { LiveWaveform } from "@/components/ui-audio/live-waveform";
import { MicSelector } from "@/components/ui-audio/mic-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DemoSurface } from "./demo-data";

function MicSelectorPreview({
	muted = false,
}: Readonly<{ muted?: boolean }>) {
	const [isRecording, setIsRecording] = useState(false);
	const [hasRecording, setHasRecording] = useState(false);

	return (
		<DemoSurface className="p-4">
			<Card className="mx-auto w-full max-w-2xl gap-0 border-border py-0 shadow-lg">
				<CardContent className="p-2">
					<div className="flex w-full flex-wrap items-center justify-between gap-2">
						<div className="h-8 w-full min-w-0 flex-1 md:w-[200px] md:flex-none">
							<div className="flex h-full items-center gap-2 rounded-md bg-bg-neutral-subtle px-2 py-1 text-text-subtle">
								<div className="h-full min-w-0 flex-1">
									<div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-sm">
										<LiveWaveform
											barGap={1}
											barWidth={3}
											className="h-full w-full"
											height={20}
											mode="static"
											processing={isRecording}
										/>
										<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
											<span className="text-[10px] font-medium text-text-subtle">
												{isRecording ? "Recording..." : "Start Recording"}
											</span>
										</div>
									</div>
								</div>
							</div>
						</div>

						<div className="flex w-full flex-wrap items-center justify-center gap-1 md:w-auto md:flex-nowrap">
							<MicSelector
								className="w-40 min-w-0 shrink sm:w-48"
								muted={muted}
								value="demo-device"
							/>
							<Separator className="mx-1 hidden md:block" orientation="vertical" />
							<div className="flex items-center">
								<Button
									aria-label={isRecording ? "Stop recording" : "Start recording"}
									onClick={() => {
										setIsRecording((current) => {
											const next = !current;
											if (next) {
												setHasRecording(true);
											}
											return next;
										});
									}}
									size="icon"
									variant="ghost"
								>
									{isRecording ? (
										<Square className="size-5 fill-current" />
									) : (
										<Disc3 className="size-5" />
									)}
								</Button>
								<Separator className="mx-1" orientation="vertical" />
								<Button
									aria-label="Delete recording"
									disabled={!hasRecording}
									onClick={() => {
										setHasRecording(false);
										setIsRecording(false);
									}}
									size="icon"
									variant="ghost"
								>
									<Trash2 className="size-5" />
								</Button>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</DemoSurface>
	);
}

export default function MicSelectorDemo() {
	return <MicSelectorPreview />;
}

export function MicSelectorDemoMuted() {
	return <MicSelectorPreview muted />;
}
