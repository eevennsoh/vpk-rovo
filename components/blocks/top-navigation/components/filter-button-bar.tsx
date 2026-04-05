"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import CustomizeIcon from "@atlaskit/icon/core/customize";
import FolderClosedIcon from "@atlaskit/icon/core/folder-closed";
import PersonIcon from "@atlaskit/icon/core/person";

export default function FilterButtonBar(): JSX.Element {
	return (
		<div className="flex flex-col gap-2 px-2 pb-3 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex min-w-0 flex-wrap items-center gap-2">
				<Button className="max-w-full gap-2" variant="secondary">
					<FolderClosedIcon label="" size="small" />
					<span className="truncate">Space</span>
					<ChevronDownIcon label="" size="small" />
				</Button>
				<Button className="max-w-full gap-2" variant="secondary">
					<PersonIcon label="" size="small" />
					<span className="truncate">Contributor</span>
					<ChevronDownIcon label="" size="small" />
				</Button>
				<Button aria-label="Customize filters" size="icon" variant="ghost">
					<CustomizeIcon label="" />
				</Button>
			</div>

			<div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">
				<Button className="max-w-full gap-2" variant="secondary">
					<Image src="/3p/google-drive/20.svg" alt="" aria-hidden width={20} height={20} />
					<span className="truncate">Google Drive</span>
				</Button>
				<Button className="max-w-full gap-2" variant="secondary">
					<Image src="/3p/slack/20.svg" alt="" aria-hidden width={20} height={20} />
					<span className="truncate">Slack</span>
				</Button>
				<Button variant="secondary">+47</Button>
			</div>
		</div>
	);
}
