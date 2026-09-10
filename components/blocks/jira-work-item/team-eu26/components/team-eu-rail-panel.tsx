"use client";

import { useId, useState, type ReactNode } from "react";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TeamEuRailPanelProps {
  children: ReactNode;
  defaultOpen?: boolean;
  headerActions?: ReactNode;
  title: string;
}

export function TeamEuRailPanel({
  children,
  defaultOpen = false,
  headerActions,
  title,
}: Readonly<TeamEuRailPanelProps>) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="group/rail-panel overflow-hidden rounded-lg border border-border-disabled bg-surface"
    >
      <div className="flex min-h-12 items-center px-4">
        <h2
          className="min-w-0 flex-1 text-sm font-semibold text-text"
          id={headingId}
        >
          <Button
            aria-controls={contentId}
            aria-expanded={open}
            className="-mx-2 h-8 max-w-full justify-start gap-1.5 px-2 font-semibold text-text aria-expanded:border-transparent aria-expanded:bg-transparent aria-expanded:text-text aria-expanded:hover:bg-bg-neutral-subtle-hovered"
            onClick={() => setOpen((current) => !current)}
            type="button"
            variant="ghost"
          >
            <span className="truncate">{title}</span>
            <span
              aria-hidden
              className={cn(
                "text-icon-subtlest transition-[opacity,transform] duration-normal ease-out-practical motion-reduce:transition-none",
                open
                  ? "opacity-0 group-hover/rail-panel:opacity-100 group-focus-within/rail-panel:opacity-100"
                  : "-rotate-90 opacity-100",
              )}
            >
              <ChevronDownIcon label="" size="small" />
            </span>
          </Button>
        </h2>
        {open && headerActions ? (
          <div className="ml-auto flex items-center gap-0.5">
            {headerActions}
          </div>
        ) : null}
      </div>
      {open ? <div id={contentId}>{children}</div> : null}
    </section>
  );
}
