"use client";

import { token } from "@/lib/tokens";
import { Button } from "@/components/ui/button";
import Heading from "@/components/blocks/shared-ui/heading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useWorkItemModal } from "@/app/contexts/context-work-item-modal";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronUpIcon from "@atlaskit/icon/core/chevron-up";

export function MoreFieldsAccordion() {
	const { state, actions, meta } = useWorkItemModal();
	const { workItem } = meta;
	const approvers = workItem.approvers?.length
		? workItem.approvers
		: [
				{
					name: "Elena Ruiz",
					avatarUrl: "/avatar-user/aoife-burke/color/asow-service-yellow.png",
				},
			];
	const effortEstimate = workItem.effortEstimate ?? "13 pts";

	return (
		<div style={{ border: `1px solid ${token("color.border")}`, borderRadius: token("radius.medium") }}>
			<div style={{ padding: "8px" }}>
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<Heading size="small">More fields</Heading>
						<span className="text-xs text-text-subtlest">
							Approvers
						</span>
					</div>
					<Button
						aria-label={state.isMoreFieldsOpen ? "Collapse" : "Expand"}
						aria-expanded={state.isMoreFieldsOpen}
						size="icon"
						variant="ghost"
						onClick={actions.toggleMoreFields}
					>
						{state.isMoreFieldsOpen ? <ChevronUpIcon label="" /> : <ChevronDownIcon label="" />}
					</Button>
				</div>
			</div>

			{state.isMoreFieldsOpen && (
				<div style={{ padding: "8px 12px 12px" }}>
					<div className="flex flex-col gap-2">
						<div>
							<span className="text-sm font-medium text-text-subtlest">
								Approvers
							</span>
							<div style={{ marginTop: "4px" }}>
								<div className="flex flex-col gap-2">
									{approvers.map((approver) => (
										<div key={approver.name} className="flex items-center gap-2">
											<Avatar size="sm">
												{approver.avatarUrl ? <AvatarImage src={approver.avatarUrl} alt={approver.name} /> : null}
												<AvatarFallback>{approver.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</AvatarFallback>
											</Avatar>
											<div className="flex flex-col">
												<span className="text-sm">{approver.name}</span>
												{approver.role ? (
													<span className="text-xs text-text-subtlest">{approver.role}</span>
												) : null}
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
						<div>
							<span className="text-sm font-medium text-text-subtlest">
								Effort estimate
							</span>
							<div style={{ marginTop: "4px" }}>
								<span className="text-sm">{effortEstimate}</span>
							</div>
						</div>
						{workItem.account ? (
							<div>
								<span className="text-sm font-medium text-text-subtlest">
									Account
								</span>
								<div style={{ marginTop: "4px" }}>
									<span className="text-sm">{workItem.account}</span>
								</div>
							</div>
						) : null}
						{workItem.dealSize ? (
							<div>
								<span className="text-sm font-medium text-text-subtlest">
									Deal size
								</span>
								<div style={{ marginTop: "4px" }}>
									<span className="text-sm">{workItem.dealSize}</span>
								</div>
							</div>
						) : null}
					</div>
				</div>
			)}
		</div>
	);
}
