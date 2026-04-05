"use client";

import { useState } from "react";

import { Example } from "@/components/example";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuPortal,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@/components/ui/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupTextarea,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	ArrowUpIcon,
	AudioLinesIcon,
	BookOpenIcon,
	GlobeIcon,
	MoreHorizontalIcon,
	MousePointerIcon,
	PaperclipIcon,
	PenToolIcon,
	PlusIcon,
	ShareIcon,
	ShoppingBagIcon,
	SparklesIcon,
	WandIcon,
} from "@/components/ui/vpk-icons";

export function PromptForm() {
	const [, setDictateEnabled] = useState(false);

	return (
		<Example title="Prompt Form">
			<Field>
				<FieldLabel htmlFor="prompt" className="sr-only">
					Prompt
				</FieldLabel>
				<InputGroup>
					<InputGroupTextarea id="prompt" placeholder="Ask anything" />
					<InputGroupAddon align="block-end">
						<DropdownMenu>
							<Tooltip>
								<TooltipTrigger
									render={
										<DropdownMenuTrigger
											render={
												<InputGroupButton
													variant="ghost"
													size="icon-sm"
													className="rounded-4xl"
												/>
											}
										/>
									}
								>
									<PlusIcon />
								</TooltipTrigger>
								<TooltipContent>
									Add files and more <Kbd>/</Kbd>
								</TooltipContent>
							</Tooltip>
							<DropdownMenuContent className="w-56">
								<DropdownMenuGroup>
									<DropdownMenuItem>
										<PaperclipIcon />
										Add photos & files
									</DropdownMenuItem>
									<DropdownMenuItem>
										<SparklesIcon />
										Deep research
									</DropdownMenuItem>
									<DropdownMenuItem>
										<ShoppingBagIcon />
										Shopping research
									</DropdownMenuItem>
									<DropdownMenuItem>
										<WandIcon />
										Create image
									</DropdownMenuItem>
									<Tooltip>
										<TooltipTrigger
											render={
												<DropdownMenuItem>
													<MousePointerIcon />
													Agent mode
												</DropdownMenuItem>
											}
										/>
										<TooltipContent side="right">
											<div className="font-medium">35 left</div>
											<div className="text-primary-foreground/80 text-xs">
												More available for purchase
											</div>
										</TooltipContent>
									</Tooltip>
								</DropdownMenuGroup>
								<DropdownMenuSub>
									<DropdownMenuSubTrigger>
										<MoreHorizontalIcon />
										More
									</DropdownMenuSubTrigger>
									<DropdownMenuPortal>
										<DropdownMenuSubContent>
											<DropdownMenuGroup>
												<DropdownMenuItem>
													<ShareIcon />
													Add sources
												</DropdownMenuItem>
												<DropdownMenuItem>
													<BookOpenIcon />
													Study and learn
												</DropdownMenuItem>
												<DropdownMenuItem>
													<GlobeIcon />
													Web search
												</DropdownMenuItem>
												<DropdownMenuItem>
													<PenToolIcon />
													Canvas
												</DropdownMenuItem>
											</DropdownMenuGroup>
										</DropdownMenuSubContent>
									</DropdownMenuPortal>
								</DropdownMenuSub>
							</DropdownMenuContent>
						</DropdownMenu>
						<Tooltip>
							<TooltipTrigger
								render={
									<InputGroupButton
										variant="ghost"
										size="icon-sm"
										onClick={() => setDictateEnabled((prev) => !prev)}
										className="ml-auto rounded-4xl"
									/>
								}
							>
								<AudioLinesIcon />
							</TooltipTrigger>
							<TooltipContent>Dictate</TooltipContent>
						</Tooltip>
						<InputGroupButton
							size="icon-sm"
							variant="default"
							className="rounded-4xl"
						>
							<ArrowUpIcon />
						</InputGroupButton>
					</InputGroupAddon>
				</InputGroup>
			</Field>
		</Example>
	);
}
