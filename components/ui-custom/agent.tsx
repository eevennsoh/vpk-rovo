"use client";

import type { Tool } from "ai";
import type { ComponentProps } from "react";

import AiAgentIcon from "@atlaskit/icon/core/ai-agent";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { memo } from "react";

import { CodeBlock } from "./code-block";

export type AgentProps = ComponentProps<"div">;

export const Agent = memo(({ className, ...props }: Readonly<AgentProps>) => (
  <div
    className={cn("not-prose w-full rounded-lg border border-border bg-surface", className)}
    {...props}
  />
));

export type AgentHeaderProps = ComponentProps<"div"> & {
  name: string;
  model?: string;
};

export const AgentHeader = memo(
  ({ className, name, model, ...props }: Readonly<AgentHeaderProps>) => (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-4 p-3",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <Icon render={<AiAgentIcon label="" size="small" />} label="Agent" className="text-icon-subtle" />
        <span className="font-medium text-sm text-text">{name}</span>
        {model ? (
          <Badge className="font-mono text-xs" variant="secondary">
            {model}
          </Badge>
        ) : null}
      </div>
    </div>
  )
);

export type AgentContentProps = ComponentProps<"div">;

export const AgentContent = memo(
  ({ className, ...props }: Readonly<AgentContentProps>) => (
    <div className={cn("space-y-4 p-4 pt-0", className)} {...props} />
  )
);

export type AgentInstructionsProps = ComponentProps<"div"> & {
  children: string;
};

export const AgentInstructions = memo(
  ({ className, children, ...props }: Readonly<AgentInstructionsProps>) => (
    <div className={cn("space-y-2", className)} {...props}>
      <span className="font-medium text-text-subtle text-sm">
        Instructions
      </span>
      <div className="rounded-md bg-surface-sunken p-3 text-text-subtle text-sm">
        <p>{children}</p>
      </div>
    </div>
  )
);

export type AgentToolsProps = ComponentProps<typeof Accordion>;

export const AgentTools = memo(({ className, ...props }: Readonly<AgentToolsProps>) => (
  <div className={cn("space-y-2", className)}>
    <span className="font-medium text-text-subtle text-sm">Tools</span>
    <Accordion className="rounded-md border border-border" {...props} />
  </div>
));

export type AgentToolProps = ComponentProps<typeof AccordionItem> & {
  tool: Tool;
};

export const AgentTool = memo(
  ({ className, tool, value, ...props }: Readonly<AgentToolProps>) => {
    const schema =
      "jsonSchema" in tool && tool.jsonSchema
        ? tool.jsonSchema
        : tool.inputSchema;

    return (
      <AccordionItem
        className={cn("border-b border-border last:border-b-0", className)}
        value={value}
        {...props}
      >
        <AccordionTrigger className="px-3 py-2 text-sm text-text-subtle hover:text-text hover:no-underline transition-colors">
          {tool.description ?? "No description"}
        </AccordionTrigger>
        <AccordionContent className="px-3 pb-3">
          <div className="rounded-md bg-surface-sunken">
            <CodeBlock code={JSON.stringify(schema, null, 2)} language="json" />
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  }
);

export type AgentOutputProps = ComponentProps<"div"> & {
  schema: string;
};

export const AgentOutput = memo(
  ({ className, schema, ...props }: Readonly<AgentOutputProps>) => (
    <div className={cn("space-y-2", className)} {...props}>
      <span className="font-medium text-text-subtle text-sm">
        Output Schema
      </span>
      <div className="rounded-md bg-surface-sunken">
        <CodeBlock code={schema} language="typescript" />
      </div>
    </div>
  )
);

Agent.displayName = "Agent";
AgentHeader.displayName = "AgentHeader";
AgentContent.displayName = "AgentContent";
AgentInstructions.displayName = "AgentInstructions";
AgentTools.displayName = "AgentTools";
AgentTool.displayName = "AgentTool";
AgentOutput.displayName = "AgentOutput";
