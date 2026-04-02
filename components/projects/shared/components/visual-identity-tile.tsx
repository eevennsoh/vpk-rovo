import type { NewCoreIconProps } from "@atlaskit/icon/base-new";
import type { ComponentProps } from "react";
import { createElement } from "react";

import { IconTile } from "@/components/ui/icon-tile";
import { Icon } from "@/components/ui/icon";
import type { VisualIdentity } from "@/components/projects/shared/lib/visual-identity";
import { DEFAULT_VISUAL_IDENTITY_ICON_NAME } from "@/components/projects/shared/lib/visual-identity";
import { ICON_REGISTRY } from "@/components/projects/shared/components/icon-registry";

interface VisualIdentityTileProps
	extends Omit<ComponentProps<typeof IconTile>, "icon" | "label" | "variant"> {
	label: string;
	visualIdentity: VisualIdentity;
	decorative?: boolean;
}

function resolveIconSize(size: VisualIdentityTileProps["size"]): NewCoreIconProps["size"] {
	return size === "xsmall" || size === "small" ? "small" : "medium";
}

export function VisualIdentityTile({
	label,
	visualIdentity,
	size = "medium",
	decorative = false,
	...props
}: Readonly<VisualIdentityTileProps>) {
	const IconComponent =
		ICON_REGISTRY.get(visualIdentity.iconName) ??
		ICON_REGISTRY.get(DEFAULT_VISUAL_IDENTITY_ICON_NAME);

	if (!IconComponent) {
		return null;
	}

	return (
		<IconTile
			aria-hidden={decorative ? true : undefined}
			icon={
				<Icon
					aria-hidden={decorative ? true : undefined}
					label={decorative ? undefined : label}
					render={createElement(IconComponent, {
						label: "",
						size: resolveIconSize(size),
					})}
				/>
			}
			label={label}
			size={size}
			variant={visualIdentity.tileVariant}
			{...props}
		/>
	);
}
