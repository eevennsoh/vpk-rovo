"use client";

import {
	Commit,
	CommitActions,
	CommitAuthor,
	CommitAuthorAvatar,
	CommitContent,
	CommitCopyButton,
	CommitFile,
	CommitFileAdditions,
	CommitFileChanges,
	CommitFileDeletions,
	CommitFileIcon,
	CommitFileInfo,
	CommitFilePath,
	CommitFileStatus,
	CommitFiles,
	CommitHash,
	CommitHeader,
	CommitInfo,
	CommitMessage,
	CommitMetadata,
	CommitSeparator,
	CommitTimestamp,
} from "@/components/ui-custom/commit";

const TWO_HOURS_AGO = new Date("2026-02-17T10:00:00");
const SIX_HOURS_AGO = new Date("2026-02-17T06:00:00");
const ONE_DAY_AGO = new Date("2026-02-16T12:00:00");
const FIVE_DAYS_AGO = new Date("2026-02-12T12:00:00");

const SAMPLE_FILES = [
	{ path: "src/components/auth/login.tsx", status: "modified" as const, additions: 24, deletions: 8 },
	{ path: "src/lib/session.ts", status: "added" as const, additions: 42, deletions: 0 },
	{ path: "src/middleware.ts", status: "modified" as const, additions: 12, deletions: 3 },
	{ path: "src/utils/legacy-auth.ts", status: "deleted" as const, additions: 0, deletions: 156 },
	{ path: "src/types/auth.ts", status: "renamed" as const, additions: 2, deletions: 2 },
];

export default function CommitDemo() {
	return <CommitDemoFull />;
}

export function CommitDemoFull() {
	return (
		<Commit className="w-full max-w-2xl">
			<CommitHeader>
				<CommitAuthor>
					<CommitAuthorAvatar initials="ES" className="mr-3" />
					<CommitInfo>
						<CommitMessage>Refactor auth module to use session tokens</CommitMessage>
						<CommitMetadata>
							<CommitHash>a1b2c3d</CommitHash>
							<CommitSeparator />
							<CommitTimestamp date={TWO_HOURS_AGO} />
						</CommitMetadata>
					</CommitInfo>
				</CommitAuthor>
				<CommitActions>
					<CommitCopyButton hash="a1b2c3d" />
				</CommitActions>
			</CommitHeader>
			<CommitContent>
				<CommitFiles>
					{SAMPLE_FILES.map((file) => (
						<CommitFile key={file.path}>
							<CommitFileInfo>
								<CommitFileStatus status={file.status} />
								<CommitFileIcon />
								<CommitFilePath>{file.path}</CommitFilePath>
							</CommitFileInfo>
							<CommitFileChanges>
								<CommitFileAdditions count={file.additions} />
								<CommitFileDeletions count={file.deletions} />
							</CommitFileChanges>
						</CommitFile>
					))}
				</CommitFiles>
			</CommitContent>
		</Commit>
	);
}

export function CommitDemoWithFiles() {
	const files = [
		{ path: "src/app/page.tsx", status: "modified" as const, additions: 15, deletions: 4 },
		{ path: "src/components/header.tsx", status: "added" as const, additions: 38, deletions: 0 },
		{ path: "src/styles/globals.css", status: "modified" as const, additions: 6, deletions: 2 },
	];

	return (
		<Commit className="w-full max-w-2xl" defaultOpen>
			<CommitHeader>
				<CommitAuthor>
					<CommitAuthorAvatar initials="JD" className="mr-3" />
					<CommitInfo>
						<CommitMessage>Add responsive header component</CommitMessage>
						<CommitMetadata>
							<CommitHash>f4e5d6c</CommitHash>
							<CommitSeparator />
							<CommitTimestamp date={ONE_DAY_AGO} />
						</CommitMetadata>
					</CommitInfo>
				</CommitAuthor>
				<CommitActions>
					<CommitCopyButton hash="f4e5d6c" />
				</CommitActions>
			</CommitHeader>
			<CommitContent>
				<CommitFiles>
					{files.map((file) => (
						<CommitFile key={file.path}>
							<CommitFileInfo>
								<CommitFileStatus status={file.status} />
								<CommitFileIcon />
								<CommitFilePath>{file.path}</CommitFilePath>
							</CommitFileInfo>
							<CommitFileChanges>
								<CommitFileAdditions count={file.additions} />
								<CommitFileDeletions count={file.deletions} />
							</CommitFileChanges>
						</CommitFile>
					))}
				</CommitFiles>
			</CommitContent>
		</Commit>
	);
}

export function CommitDemoMinimal() {
	return (
		<Commit className="w-full max-w-2xl">
			<CommitHeader>
				<CommitInfo>
					<CommitMessage>Fix button styling</CommitMessage>
					<CommitMetadata>
						<CommitHash>b7c8d9e</CommitHash>
						<CommitSeparator />
						<CommitTimestamp date={FIVE_DAYS_AGO} />
					</CommitMetadata>
				</CommitInfo>
			</CommitHeader>
		</Commit>
	);
}

export function CommitDemoMultiple() {
	const commits = [
		{
			hash: "a1b2c3d",
			message: "Refactor auth module to use session tokens",
			initials: "ES",
			date: TWO_HOURS_AGO,
			files: [
				{ path: "src/lib/auth.ts", status: "modified" as const, additions: 18, deletions: 5 },
				{ path: "src/lib/session.ts", status: "added" as const, additions: 42, deletions: 0 },
			],
		},
		{
			hash: "e5f6a7b",
			message: "Update CI pipeline for Node 22",
			initials: "MK",
			date: SIX_HOURS_AGO,
			files: [
				{ path: ".github/workflows/ci.yml", status: "modified" as const, additions: 8, deletions: 4 },
			],
		},
		{
			hash: "c9d0e1f",
			message: "Remove deprecated API endpoints",
			initials: "JD",
			date: ONE_DAY_AGO,
			files: [
				{ path: "src/api/v1/legacy.ts", status: "deleted" as const, additions: 0, deletions: 89 },
				{ path: "src/api/v2/routes.ts", status: "modified" as const, additions: 3, deletions: 12 },
			],
		},
	];

	return (
		<div className="flex w-full max-w-2xl flex-col gap-3">
			{commits.map((commit) => (
				<Commit key={commit.hash}>
					<CommitHeader>
						<CommitAuthor>
							<CommitAuthorAvatar initials={commit.initials} className="mr-3" />
							<CommitInfo>
								<CommitMessage>{commit.message}</CommitMessage>
								<CommitMetadata>
									<CommitHash>{commit.hash}</CommitHash>
									<CommitSeparator />
									<CommitTimestamp date={commit.date} />
								</CommitMetadata>
							</CommitInfo>
						</CommitAuthor>
						<CommitActions>
							<CommitCopyButton hash={commit.hash} />
						</CommitActions>
					</CommitHeader>
					<CommitContent>
						<CommitFiles>
							{commit.files.map((file) => (
								<CommitFile key={file.path}>
									<CommitFileInfo>
										<CommitFileStatus status={file.status} />
										<CommitFileIcon />
										<CommitFilePath>{file.path}</CommitFilePath>
									</CommitFileInfo>
									<CommitFileChanges>
										<CommitFileAdditions count={file.additions} />
										<CommitFileDeletions count={file.deletions} />
									</CommitFileChanges>
								</CommitFile>
							))}
						</CommitFiles>
					</CommitContent>
				</Commit>
			))}
		</div>
	);
}
