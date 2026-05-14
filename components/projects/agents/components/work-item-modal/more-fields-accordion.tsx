"use client";

import { token } from "@/lib/tokens";
import { Button } from "@/components/ui/button";
import Heading from "@/components/blocks/shared-ui/heading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useWorkItemModal } from "@/app/contexts/context-work-item-modal";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronUpIcon from "@atlaskit/icon/core/chevron-up";

export function MoreFieldsAccordion() {
	const { state, actions } = useWorkItemModal();

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
								<div className="flex items-center gap-2">
									<Avatar size="sm">
										<AvatarImage src="/avatar-human/aoife-burke.png" alt="Elena Ruiz" />
										<AvatarFallback>ER</AvatarFallback>
									</Avatar>
									<span className="text-sm">Elena Ruiz</span>
								</div>
							</div>
						</div>
						<div>
							<span className="text-sm font-medium text-text-subtlest">
								Effort estimate
							</span>
							<div style={{ marginTop: "4px" }}>
								<span className="text-sm">13 pts</span>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
