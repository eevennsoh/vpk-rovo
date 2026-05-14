export interface AvatarData {
	src: string;
	name: string;
}

export const AVATARS: readonly AvatarData[] = [
	{ src: "/avatar-user/andrea-wilson/color/asow-service-yellow.png", name: "Maya Chen, proposal manager" },
	{ src: "/avatar-user/andrew-park/color/asow-dev-lime.png", name: "Jordan Lee, account executive" },
	{ src: "/avatar-user/annie-clare/color/asow-strategy-orange.png", name: "Priya Shah, sales engineer" },
	{ src: "/avatar-user/aoife-burke/color/asow-service-yellow.png", name: "Elena Ruiz, deal desk" },
	{ src: "/avatar-user/bradley-phillips/color/asow-product-purple.png", name: "Noah Patel, security lead" },
	{ src: "/avatar-user/brian-lin/color/asow-teamwork-blue.png", name: "Sofia Garcia, legal reviewer" },
	{ src: "/avatar-user/christine-sanchez/color/asow-strategy-orange.png", name: "Caleb Martin, customer success" },
] as const;
