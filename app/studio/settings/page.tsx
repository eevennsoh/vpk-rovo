"use client";

import { RovoAppSurfaceShell } from "@/components/projects/studio/components/rovo-app-surface-shell";
import { SettingsSurfacePage } from "@/components/projects/control-plane/settings-surface";

export default function RovoAppSettingsPage() {
	return (
		<RovoAppSurfaceShell>
			<SettingsSurfacePage />
		</RovoAppSurfaceShell>
	);
}
