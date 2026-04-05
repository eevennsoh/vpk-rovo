"use client";

import { MotionConfig } from "motion/react";
import { ThemeWrapper } from "@/components/utils/theme-wrapper";
import { SidebarProvider } from "@/app/contexts/context-sidebar";
import * as RovoChatContext from "@/app/contexts/context-rovo-chat";

// VPK does not initialize Atlassian Feature Gates in local prototype mode.
// Override the problematic Rovo logo gate locally to avoid uninitialized FG client warnings.
const platformFeatureFlags = globalThis as typeof globalThis & {
	__PLATFORM_FEATURE_FLAGS__?: {
		booleanResolver?: (flagName: string) => boolean;
	};
};
const existingBooleanResolver =
	platformFeatureFlags.__PLATFORM_FEATURE_FLAGS__?.booleanResolver;

platformFeatureFlags.__PLATFORM_FEATURE_FLAGS__ = {
	...platformFeatureFlags.__PLATFORM_FEATURE_FLAGS__,
	booleanResolver: (flagName: string) => {
		if (flagName === "platform-logo-rebrand-rovo-hex") {
			return false;
		}

		return existingBooleanResolver?.(flagName) ?? false;
	},
};

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<MotionConfig reducedMotion="user">
			<ThemeWrapper>
				<SidebarProvider>
					<RovoChatContext.RovoChatProvider>
						{children}
					</RovoChatContext.RovoChatProvider>
				</SidebarProvider>
			</ThemeWrapper>
		</MotionConfig>
	);
}
