export interface AvatarData {
	src: string;
	name: string;
}

export const AVATARS: readonly AvatarData[] = [
	{ src: "/avatar-human/andrea-wilson.png", name: "User 1" },
	{ src: "/avatar-human/andrew-park.png", name: "User 2" },
	{ src: "/avatar-human/annie-clare.png", name: "User 3" },
	{ src: "/avatar-human/aoife-burke.png", name: "User 4" },
	{ src: "/avatar-human/bradley-phillips.png", name: "User 5" },
	{ src: "/avatar-human/brian-lin.png", name: "User 6" },
	{ src: "/avatar-human/christine-sanchez.png", name: "User 7" },
] as const;
