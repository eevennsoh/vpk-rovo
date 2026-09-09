import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import BranchIcon from "@atlaskit/icon/core/branch";
import InformationCircleIcon from "@atlaskit/icon/core/information-circle";
import StatusInformationIcon from "@atlaskit/icon/core/status-information";
import StatusSuccessIcon from "@atlaskit/icon/core/status-success";

import { TEAM_EU26_AGENT_SESSIONS } from "@/components/blocks/jira-work-item/team-eu26/data/high-confidence-work-item";
import { Icon } from "@/components/ui/icon";

export function HighConfidenceAgentSessions() {
	return (
		<section aria-labelledby="team-eu26-agent-sessions-heading" className="min-w-0 space-y-3" data-team-eu26-agent-sessions>
			<div className="flex min-w-0 items-center justify-between gap-4">
				<h2 className="text-sm font-semibold text-text" id="team-eu26-agent-sessions-heading">Agent sessions</h2>
				<span className="inline-flex shrink-0 items-center gap-1 text-xs text-text-subtle">
					<InformationCircleIcon label="" size="small" />
					Uses AI. Verify results.
				</span>
			</div>
			<ul className="space-y-2">
				{TEAM_EU26_AGENT_SESSIONS.map((session) => {
					const StatusIcon = session.tone === "success" ? StatusSuccessIcon : StatusInformationIcon;
					return (
						<li key={session.title}>
							<article className="flex min-h-16 min-w-0 items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
								<span aria-hidden className={session.tone === "success" ? "text-icon-success" : "text-icon-information"}>
									<Icon render={<AiAgentIcon label="" size="small" />} />
								</span>
								<div className="min-w-0 flex-1">
									<h3 className="truncate text-sm font-semibold text-text">{session.title}</h3>
									<p className="mt-1 flex min-w-0 items-center gap-1 text-xs text-text-subtle">
										<span>{session.agent}</span>
										<span aria-hidden>·</span>
										<span>{session.status}</span>
										<span aria-hidden>·</span>
										<BranchIcon label="" size="small" />
										<span className="truncate">{session.branch}</span>
										<span aria-hidden>·</span>
										<span className="shrink-0">May 19</span>
									</p>
								</div>
								<span aria-hidden className={session.tone === "success" ? "shrink-0 text-icon-success" : "shrink-0 text-icon-information"}>
									<StatusIcon label="" size="small" />
								</span>
							</article>
						</li>
					);
				})}
			</ul>
		</section>
	);
}
