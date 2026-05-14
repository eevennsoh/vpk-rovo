export interface AvatarData {
	src: string;
	name: string;
}

export const AVATARS: readonly AvatarData[] = [
	{ src: "/avatar-human/andrea-wilson.png", name: "Maya Chen, proposal manager" },
	{ src: "/avatar-human/andrew-park.png", name: "Jordan Lee, account executive" },
	{ src: "/avatar-human/annie-clare.png", name: "Priya Shah, sales engineer" },
	{ src: "/avatar-human/aoife-burke.png", name: "Elena Ruiz, deal desk" },
	{ src: "/avatar-human/bradley-phillips.png", name: "Noah Patel, security lead" },
	{ src: "/avatar-human/brian-lin.png", name: "Sofia Garcia, legal reviewer" },
	{ src: "/avatar-human/christine-sanchez.png", name: "Caleb Martin, customer success" },
] as const;
