"use client";

import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import FormattedDate from "@/components/ui/formatted-date";
import { Separator } from "@/components/ui/separator";
import type { Contact } from "./data";

import EmailIcon from "@atlaskit/icon/core/email";
import PhoneIcon from "@atlaskit/icon/core/phone";
import PersonIcon from "@atlaskit/icon/core/person";
import OfficeBuildingIcon from "@atlaskit/icon/core/office-building";
import CalendarIcon from "@atlaskit/icon/core/calendar";
import CommentIcon from "@atlaskit/icon/core/comment";

const STATUS_VARIANT_MAP: Record<Contact["status"], "success" | "danger" | "warning"> = {
	active: "success",
	inactive: "danger",
	lead: "warning",
};

const STATUS_LABEL_MAP: Record<Contact["status"], string> = {
	active: "Active",
	inactive: "Inactive",
	lead: "Lead",
};

function getInitials(name: string): string {
	return name
		.split(" ")
		.map((part) => part[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
}

interface DetailRowProps {
	icon: React.ReactNode;
	label: string;
	value: React.ReactNode;
}

function DetailRow({ icon, label, value }: Readonly<DetailRowProps>) {
	return (
		<div className="flex items-start gap-3 py-2.5">
			<div className="text-icon-subtle mt-0.5 shrink-0">{icon}</div>
			<div className="flex flex-col gap-0.5 min-w-0">
				<span className="text-xs font-medium text-text-subtlest uppercase tracking-wider">
					{label}
				</span>
				<span className="text-sm text-text break-words">{value}</span>
			</div>
		</div>
	);
}

interface ContactDetailProps {
	contact: Contact | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export default function ContactDetail({
	contact,
	open,
	onOpenChange,
}: Readonly<ContactDetailProps>) {
	if (!contact) return null;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" size="sm">
				<SheetHeader className="pb-0">
					<div className="flex flex-col items-center gap-3 pt-2 pb-4">
						<Avatar size="xl">
							<AvatarImage src={contact.avatarUrl} alt={contact.name} />
							<AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
						</Avatar>
						<div className="flex flex-col items-center gap-1.5">
							<SheetTitle className="text-lg">{contact.name}</SheetTitle>
							<Badge variant={STATUS_VARIANT_MAP[contact.status]}>
								{STATUS_LABEL_MAP[contact.status]}
							</Badge>
						</div>
					</div>
				</SheetHeader>

				<Separator />

				<div className="flex flex-col px-1 py-3">
					<DetailRow
						icon={<EmailIcon label="" />}
						label="Email"
						value={
							<a
								href={`mailto:${contact.email}`}
								className="text-link hover:underline"
							>
								{contact.email}
							</a>
						}
					/>
					<DetailRow
						icon={<PhoneIcon label="" />}
						label="Phone"
						value={contact.phone}
					/>
					<DetailRow
						icon={<OfficeBuildingIcon label="" />}
						label="Company"
						value={contact.company}
					/>
					<DetailRow
						icon={<PersonIcon label="" />}
						label="Role"
						value={contact.role}
					/>

					<Separator className="my-2" />

					<DetailRow
						icon={<CalendarIcon label="" />}
						label="Added"
						value={
							<FormattedDate
								dateStr={contact.createdAt}
								dateStyle="long"
							/>
						}
					/>
					<DetailRow
						icon={<CalendarIcon label="" />}
						label="Last Contacted"
						value={
							<FormattedDate
								dateStr={contact.lastContacted}
								dateStyle="long"
							/>
						}
					/>

					<Separator className="my-2" />

					<DetailRow
						icon={<CommentIcon label="" />}
						label="Notes"
						value={contact.notes}
					/>
				</div>
			</SheetContent>
		</Sheet>
	);
}
