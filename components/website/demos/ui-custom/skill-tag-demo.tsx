"use client";

import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import AutomationIcon from "@atlaskit/icon/core/automation";
import BoardIcon from "@atlaskit/icon/core/board";
import SupportIcon from "@atlaskit/icon/core/support";
import DataFlowIcon from "@atlaskit/icon/core/data-flow";
import GlobeIcon from "@atlaskit/icon/core/globe";
import LightbulbIcon from "@atlaskit/icon/core/lightbulb";
import SearchIcon from "@atlaskit/icon/core/search";
import StarIcon from "@atlaskit/icon/core/star-starred";
import SkillIcon from "@atlaskit/icon-lab/core/skill";

import { SkillTag, SkillTagGroup } from "@/components/ui-custom/skill-tag";

export default function SkillTagDemo() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<SkillTag icon={<SearchIcon label="" size="small" />} color="teamwork">
				Search
			</SkillTag>
			<SkillTag icon={<AutomationIcon label="" size="small" />} color="software">
				Automation
			</SkillTag>
			<SkillTag icon={<LightbulbIcon label="" size="small" />} color="product">
				Insights
			</SkillTag>
			<SkillTag icon={<DataFlowIcon label="" size="small" />} color="platform">
				Data Flow
			</SkillTag>
		</div>
	);
}

export function SkillTagDemoDefault() {
	return <SkillTag>Default skill</SkillTag>;
}

export function SkillTagDemoColors() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<SkillTag color="default">Default</SkillTag>
			<SkillTag color="2p3p">2p3p</SkillTag>
			<SkillTag color="platform">Platform</SkillTag>
			<SkillTag color="teamwork">Teamwork</SkillTag>
			<SkillTag color="software">Software</SkillTag>
			<SkillTag color="strategy">Strategy</SkillTag>
			<SkillTag color="service">Service</SkillTag>
			<SkillTag color="product">Product</SkillTag>
		</div>
	);
}

export function SkillTagDemoWithIcon() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<SkillTag icon={<SkillIcon label="" size="small" />} color="default">
				research-helper
			</SkillTag>
			<SkillTag icon={<AiAgentIcon label="" size="small" />} color="default">
				bug-triage-agent
			</SkillTag>
			<SkillTag icon={<SearchIcon label="" size="small" />} color="teamwork">
				Search
			</SkillTag>
			<SkillTag icon={<AutomationIcon label="" size="small" />} color="software">
				Automation
			</SkillTag>
			<SkillTag icon={<LightbulbIcon label="" size="small" />} color="product">
				Insights
			</SkillTag>
			<SkillTag icon={<GlobeIcon label="" size="small" />} color="platform">
				Web Browse
			</SkillTag>
			<SkillTag icon={<StarIcon label="" size="small" />} color="strategy">
				Favorites
			</SkillTag>
			<SkillTag icon={<SupportIcon label="" size="small" />} color="service">
				Service
			</SkillTag>
			<SkillTag icon={<BoardIcon label="" size="small" />} color="2p3p">
				Board
			</SkillTag>
		</div>
	);
}

export function SkillTagDemoInteractive() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<SkillTag icon={<SearchIcon label="" size="small" />} color="teamwork" onClick={() => alert("Search clicked")}>
				Search
			</SkillTag>
			<SkillTag icon={<AutomationIcon label="" size="small" />} color="software" onClick={() => alert("Automation clicked")}>
				Automation
			</SkillTag>
			<SkillTag color="strategy" onClick={() => alert("Alert clicked")}>
				Alert
			</SkillTag>
		</div>
	);
}

export function SkillTagDemoGroup() {
	return (
		<SkillTagGroup>
			<SkillTag icon={<SearchIcon label="" size="small" />} color="teamwork">
				Search
			</SkillTag>
			<SkillTag icon={<AutomationIcon label="" size="small" />} color="software">
				Automation
			</SkillTag>
			<SkillTag icon={<LightbulbIcon label="" size="small" />} color="product">
				Insights
			</SkillTag>
			<SkillTag icon={<DataFlowIcon label="" size="small" />} color="platform">
				Data Flow
			</SkillTag>
		</SkillTagGroup>
	);
}

export function SkillTagDemoInline() {
	return (
		<p className="text-sm text-text">
			The agent used{" "}
			<SkillTag icon={<SearchIcon label="" size="small" />} color="teamwork">
				Search
			</SkillTag>{" "}
			and{" "}
			<SkillTag icon={<AutomationIcon label="" size="small" />} color="software">
				Automation
			</SkillTag>{" "}
			to complete the task.
		</p>
	);
}
