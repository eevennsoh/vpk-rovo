"use client";

import { useState, type ReactNode } from "react";
import AppIcon from "@atlaskit/icon/core/app";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";

import { TeamEuRailPanel } from "@/components/blocks/jira-work-item/team-eu26/components/team-eu-rail-panel";
import { Icon } from "@/components/ui/icon";
import {
  PagerdutyLogo,
  SentryLogo,
  TempoTimesheetsLogo,
} from "@/components/ui/logo-third-party";
import { cn } from "@/lib/utils";

const APPS: readonly { body: string; icon: ReactNode; title: string }[] = [
  {
    body: "Content here...",
    icon: <AppIcon label="" size="small" />,
    title: "My Reminders",
  },
  {
    body: "More content...",
    icon: <TempoTimesheetsLogo borderless label="" size="xsmall" />,
    title: "Tempo",
  },
  {
    body: "More content...",
    icon: <PagerdutyLogo borderless label="" size="xsmall" />,
    title: "PagerDuty",
  },
  {
    body: "More content...",
    icon: <SentryLogo borderless label="" size="xsmall" />,
    title: "Sentry",
  },
  {
    body: "More content...",
    icon: <AppIcon label="" size="small" />,
    title: "Checklist",
  },
  {
    body: "More content...",
    icon: <AppIcon label="" size="small" />,
    title: "Invision for Jira",
  },
  {
    body: "More content...",
    icon: <AppIcon label="" size="small" />,
    title: "Trello Assistant",
  },
];

function AppRow({ app }: Readonly<{ app: (typeof APPS)[number] }>) {
  const [open, setOpen] = useState(false);
  return (
    <li>
      <button
        aria-expanded={open}
        className="flex h-12 w-full min-w-0 items-center gap-3 rounded-md px-2 text-left text-sm text-text outline-none transition-colors duration-xxshort ease-out-practical hover:bg-bg-neutral-subtle-hovered focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span aria-hidden className="grid size-5 shrink-0 place-items-center">
          {app.icon}
        </span>
        <span className="min-w-0 flex-1 truncate">{app.title}</span>
        <Icon
          aria-hidden
          className={cn(
            "shrink-0 text-icon-subtle transition-transform duration-normal ease-out-practical motion-reduce:transition-none",
            open ? "rotate-180" : undefined,
          )}
          render={<ChevronDownIcon label="" size="small" />}
        />
      </button>
      {open ? (
        <div className="px-10 pb-3 text-sm text-text-subtle">{app.body}</div>
      ) : null}
    </li>
  );
}

export function TeamEuAppsPanel() {
  return (
    <TeamEuRailPanel title="Apps">
      <ul aria-label="Connected apps" className="px-2 pb-2">
        {APPS.map((app) => (
          <AppRow app={app} key={app.title} />
        ))}
      </ul>
    </TeamEuRailPanel>
  );
}
