import type { ReactNode } from "react";

import { CardIdentityTile } from "@/components/projects/shared/components/card-identity-tile";
import type { GenerativeContentType } from "@/components/projects/shared/lib/generative-widget";
import { resolveGenerativeCardIdentity } from "@/components/projects/shared/lib/visual-identity";

export function ContentTypeTile({
	contentType,
	label,
	size = "medium",
	title,
	description,
	sourceName,
	sourceLogoSrc,
	iconHint,
	hintText,
	identitySeed,
}: Readonly<{
	contentType: GenerativeContentType;
	label: string;
	size?: "medium" | "large";
	title?: string;
	description?: string;
	sourceName?: string;
	sourceLogoSrc?: string;
	iconHint?: string;
	hintText?: string;
	identitySeed?: string;
}>): ReactNode {
	const identity = resolveGenerativeCardIdentity({
		contentType,
		title,
		description,
		sourceName,
		sourceLogoSrc,
		iconHint,
		hintText,
		identitySeed,
	});

	return (
		<CardIdentityTile
			identity={identity}
			label={label}
			size={size}
		/>
	);
}
