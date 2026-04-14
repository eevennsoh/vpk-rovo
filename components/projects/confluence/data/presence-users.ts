/**
 * User presence data for Confluence header avatar group
 */

import { token } from "@/lib/tokens";

export interface PresenceUser {
	key: string;
	name: string;
	src?: string;
	borderColor?: string;
}

export const PRESENCE_USERS: readonly PresenceUser[] = [
	{
		key: "user1",
		name: "Victoria Styles",
		src: "/avatar-human/andrea-wilson.png",
		borderColor: token("color.border.brand"),
	},
	{
		key: "user2",
		name: "Fidelis Ejima",
		src: "/avatar-human/andrew-park.png",
		borderColor: token("color.border.success"),
	},
	{
		key: "user3",
		name: "Aoife Burke",
		src: "/avatar-human/annie-clare.png",
		borderColor: token("color.border.discovery"),
	},
	{
		key: "user4",
		name: "Additional User 1",
	},
	{
		key: "user5",
		name: "Additional User 2",
	},
] as const;
