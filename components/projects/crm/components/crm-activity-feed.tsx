"use client";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CRM_ACTIVITIES, type CrmActivity } from "@/app/data/crm-data";
import {
	FileTextIcon,
	MailIcon,
	PhoneIcon,
	CalendarIcon,
	ArrowRightIcon,
} from "lucide-react";

function ActivityIcon({ type }: { type: CrmActivity["type"] }) {
	const base = "flex items-center justify-center size-7 rounded-full shrink-0";
	switch (type) {
		case "note":
			return (
				<div className={`${base} bg-accent-gray-subtler text-icon-subtle`}>
					<FileTextIcon size={14} />
				</div>
			);
		case "email":
			return (
				<div className={`${base} bg-accent-blue-subtler text-icon-information`}>
					<MailIcon size={14} />
				</div>
			);
		case "call":
			return (
				<div className={`${base} bg-accent-green-subtler text-icon-success`}>
					<PhoneIcon size={14} />
				</div>
			);
		case "meeting":
			return (
				<div className={`${base} bg-accent-purple-subtler text-icon-discovery`}>
					<CalendarIcon size={14} />
				</div>
			);
		case "stage_change":
			return (
				<div className={`${base} bg-accent-yellow-subtler text-icon-warning`}>
					<ArrowRightIcon size={14} />
				</div>
			);
	}
}

function relativeTime(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime();
	const hours = Math.floor(diff / 3_600_000);
	if (hours < 1) return "Just now";
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

export default function CrmActivityFeed() {
	return (
		<Card className="bg-surface-raised p-4 flex flex-col gap-3">
			<h2 className="text-text font-semibold text-sm">Recent Activity</h2>
			<div className="flex flex-col gap-3">
				{CRM_ACTIVITIES.map((activity) => (
					<div key={activity.id} className="flex items-start gap-3">
						<ActivityIcon type={activity.type} />
						<div className="flex-1 min-w-0">
							<p className="text-text text-xs font-medium leading-tight truncate">
								{activity.dealName}
							</p>
							<p className="text-text-subtle text-xs mt-0.5 leading-snug">
								{activity.description}
							</p>
						</div>
						<span className="text-text-subtlest text-xs shrink-0 mt-0.5">
							{relativeTime(activity.timestamp)}
						</span>
					</div>
				))}
			</div>
		</Card>
	);
}
