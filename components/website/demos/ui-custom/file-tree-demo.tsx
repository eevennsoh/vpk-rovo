"use client";

import { useState } from "react";
import {
	FileTree,
	FileTreeFolder,
	FileTreeFile,
	FileTreeActions,
} from "@/components/ui-custom/file-tree";
import {
	CodeIcon,
	ImageIcon,
	FileJsonIcon,
	FileTextIcon,
	SettingsIcon,
	CopyIcon,
	TrashIcon,
	DownloadIcon,
} from "@/components/ui/vpk-icons";
import { Button } from "@/components/ui/button";

export default function FileTreeDemo() {
	return <FileTreeDemoProject />;
}

export function FileTreeDemoProject() {
	return (
		<FileTree
			defaultExpanded={new Set(["src", "src/components"])}
			className="w-full max-w-xs text-xs"
		>
			<FileTreeFolder path="src" name="src">
				<FileTreeFolder path="src/components" name="components">
					<FileTreeFile path="src/components/button.tsx" name="button.tsx" />
					<FileTreeFile path="src/components/input.tsx" name="input.tsx" />
					<FileTreeFile path="src/components/dialog.tsx" name="dialog.tsx" />
				</FileTreeFolder>
				<FileTreeFolder path="src/lib" name="lib">
					<FileTreeFile path="src/lib/utils.ts" name="utils.ts" />
					<FileTreeFile path="src/lib/api.ts" name="api.ts" />
				</FileTreeFolder>
				<FileTreeFile path="src/index.ts" name="index.ts" />
				<FileTreeFile path="src/app.tsx" name="app.tsx" />
			</FileTreeFolder>
			<FileTreeFile path="package.json" name="package.json" />
			<FileTreeFile path="tsconfig.json" name="tsconfig.json" />
			<FileTreeFile path="README.md" name="README.md" />
		</FileTree>
	);
}

export function FileTreeDemoWithSelection() {
	const [selected, setSelected] = useState("src/app.tsx");
	const handleSelect = (path: string) => setSelected(path);

	return (
		<FileTree
			defaultExpanded={new Set(["src"])}
			selectedPath={selected}
			{...{ onSelect: handleSelect } as Record<string, unknown>}
			className="w-full max-w-xs text-xs"
		>
			<FileTreeFolder path="src" name="src">
				<FileTreeFile path="src/index.ts" name="index.ts" />
				<FileTreeFile path="src/app.tsx" name="app.tsx" />
				<FileTreeFile path="src/styles.css" name="styles.css" />
			</FileTreeFolder>
			<FileTreeFile path="package.json" name="package.json" />
			<FileTreeFile path="tsconfig.json" name="tsconfig.json" />
		</FileTree>
	);
}

export function FileTreeDemoCustomIcons() {
	return (
		<FileTree
			defaultExpanded={new Set(["src", "public"])}
			className="w-full max-w-xs text-xs"
		>
			<FileTreeFolder path="src" name="src">
				<FileTreeFile
					path="src/app.tsx"
					name="app.tsx"
					icon={<CodeIcon className="size-4 text-blue-500" />}
				/>
				<FileTreeFile
					path="src/utils.ts"
					name="utils.ts"
					icon={<SettingsIcon className="size-4 text-yellow-500" />}
				/>
			</FileTreeFolder>
			<FileTreeFolder path="public" name="public">
				<FileTreeFile
					path="public/logo.svg"
					name="logo.svg"
					icon={<ImageIcon className="size-4 text-green-500" />}
				/>
				<FileTreeFile
					path="public/favicon.ico"
					name="favicon.ico"
					icon={<ImageIcon className="size-4 text-green-500" />}
				/>
			</FileTreeFolder>
			<FileTreeFile
				path="package.json"
				name="package.json"
				icon={<FileJsonIcon className="size-4 text-orange-500" />}
			/>
			<FileTreeFile
				path="README.md"
				name="README.md"
				icon={<FileTextIcon className="size-4 text-muted-foreground" />}
			/>
		</FileTree>
	);
}

export function FileTreeDemoWithActions() {
	return (
		<FileTree
			defaultExpanded={new Set(["src"])}
			className="w-full max-w-xs text-xs"
		>
			<FileTreeFolder path="src" name="src">
				<FileTreeFile path="src/index.ts" name="index.ts">
					<span className="size-4" />
					<CodeIcon className="size-4 shrink-0 text-blue-500" />
					<span className="truncate">index.ts</span>
					<FileTreeActions>
						<Button variant="ghost" size="icon" className="size-5">
							<CopyIcon className="size-3" />
						</Button>
						<Button variant="ghost" size="icon" className="size-5">
							<DownloadIcon className="size-3" />
						</Button>
						<Button variant="ghost" size="icon" className="size-5">
							<TrashIcon className="size-3" />
						</Button>
					</FileTreeActions>
				</FileTreeFile>
				<FileTreeFile path="src/utils.ts" name="utils.ts">
					<span className="size-4" />
					<CodeIcon className="size-4 shrink-0 text-blue-500" />
					<span className="truncate">utils.ts</span>
					<FileTreeActions>
						<Button variant="ghost" size="icon" className="size-5">
							<CopyIcon className="size-3" />
						</Button>
						<Button variant="ghost" size="icon" className="size-5">
							<DownloadIcon className="size-3" />
						</Button>
						<Button variant="ghost" size="icon" className="size-5">
							<TrashIcon className="size-3" />
						</Button>
					</FileTreeActions>
				</FileTreeFile>
			</FileTreeFolder>
			<FileTreeFile path="package.json" name="package.json" />
		</FileTree>
	);
}
