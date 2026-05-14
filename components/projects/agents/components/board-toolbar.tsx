"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { token } from "@/lib/tokens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import CustomizeIcon from "@atlaskit/icon/core/customize";
import SearchIcon from "@atlaskit/icon/core/search";
import type { AvatarData } from "../data/avatars";

interface BoardToolbarProps {
	avatars: AvatarData[];
}

export default function BoardToolbar({ avatars }: Readonly<BoardToolbarProps>) {
	return (
		<div
			style={{
				paddingTop: token("space.150"),
				paddingBottom: token("space.250"),
				paddingInline: token("space.300"),
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
						<div className="relative">
							<span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-icon">
								<SearchIcon label="" size="small" />
							</span>
							<Input
								placeholder="Search board"
								className="h-7 pl-7 text-sm placeholder:text-sm"
							/>
						</div>
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
					<Button className="gap-2" variant="secondary">
						<span>Filter</span>
						<ChevronDownIcon label="" size="small" />
					</Button>
				</div>

				<div className="flex items-center gap-2">
					<Button variant="secondary">
						Group: Status
					</Button>
					<Button aria-label="Customize" size="icon" variant="ghost">
						<CustomizeIcon label="" />
					</Button>
				</div>
			</div>
		</div>
	);
}
