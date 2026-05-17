"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { token } from "@/lib/tokens";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import CustomizeIcon from "@atlaskit/icon/core/customize";
import RefreshIcon from "@atlaskit/icon/core/refresh";
import SearchIcon from "@atlaskit/icon/core/search";
import type { AvatarData } from "../data/avatars";

interface BoardToolbarProps {
	avatars: AvatarData[];
	onReset: () => void;
}

export default function BoardToolbar({ avatars, onReset }: Readonly<BoardToolbarProps>) {
	const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
	const handleConfirmReset = () => {
		setIsResetDialogOpen(false);
		onReset();
	};

	return (
		<div
			style={{
				paddingTop: token("space.200"),
				paddingBottom: token("space.200"),
				paddingInline: token("space.200"),
			}}
		>
			<div className="flex justify-between items-center">
				<div className="flex items-center gap-4">
					<div
						className="search-field-wrapper"
						style={{
							width: "184px",
						}}
					>
						<InputGroup>
							<InputGroupAddon>
								<SearchIcon label="" />
							</InputGroupAddon>
							<InputGroupInput placeholder="Search RFPs" />
						</InputGroup>
					</div>
					<div style={{ display: "flex", marginLeft: token("space.negative.050") }}>
						{avatars.slice(0, 4).map((avatar, index) => (
							<div key={`avatar-${index}`} style={{ marginLeft: token("space.negative.050") }}>
								<Avatar size="sm">
									<AvatarImage src={avatar.src} alt={avatar.name} />
									<AvatarFallback>{avatar.name?.[0] ?? "?"}</AvatarFallback>
								</Avatar>
							</div>
						))}
						{avatars.length > 4 && (
							<div style={{ marginLeft: token("space.negative.050") }}>
								<Avatar size="sm">
									<AvatarFallback>{`+${avatars.length - 4}`}</AvatarFallback>
								</Avatar>
							</div>
						)}
					</div>
					<Button className="gap-2" variant="outline">
						<span>Filter</span>
						<ChevronDownIcon label="" size="small" />
					</Button>
				</div>

				<div className="flex items-center gap-2">
					<AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
						<AlertDialogTrigger
							render={
								<Button className="gap-2" variant="outline" />
							}
						>
							<RefreshIcon label="" size="small" />
							Reset demo
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Reset demo</AlertDialogTitle>
								<AlertDialogDescription>
									Reset the RFP demo back to its starting state? This clears local demo data for this browser only.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<Button onClick={handleConfirmReset}>Reset demo</Button>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
					<Button className="gap-2" variant="outline">
						<span>Group: RFP stage</span>
						<ChevronDownIcon label="" size="small" />
					</Button>
					<Button aria-label="Customize" size="icon" variant="ghost">
						<CustomizeIcon label="" />
					</Button>
				</div>
			</div>
		</div>
	);
}
