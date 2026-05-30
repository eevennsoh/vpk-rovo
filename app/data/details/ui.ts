import type { ComponentDetail } from "@/app/data/component-detail-types";

export const UI_DETAILS: Record<string, ComponentDetail> = {
  button: {
    description:
      "A styled button component extending Base UI's ButtonPrimitive with configurable variants, icon-only sizes, and anchor rendering for link-style actions.",
    adsUrl: "https://atlassian.design/components/button/",
    adsLinks: [
      {
        label: "{ Button } from @atlaskit/button/new",
        url: "https://atlassian.design/components/button/",
      },
      {
        label: "{ IconButton } from @atlaskit/button/new",
        url: "https://atlassian.design/components/button/icon-button/",
      },
      {
        label: "{ ButtonGroup } from @atlaskit/button/new",
        url: "https://atlassian.design/components/button/button-group/",
      },
    ],
    usage: `import { Button } from "@/components/ui/button";

<Button>
  Click me
</Button>

<Button variant="outline" size="sm">
  Small outline
</Button>

<Button variant="ghost" size="icon" aria-label="Search">
  <SearchIcon />
</Button>

<Button nativeButton={false} render={<a href="/settings" />}>
  Settings
</Button>`,
    props: [
      {
        name: "variant",
        type: '"default" | "outline" | "secondary" | "ghost" | "destructive" | "link"',
        default: '"default"',
        description: "Visual style variant of the button.",
      },
      {
        name: "size",
        type: '"default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg"',
        default: '"default"',
        description: "Size of the button.",
      },
      {
        name: "isLoading",
        type: "boolean",
        default: "false",
        description: "Shows a spinner and disables interaction.",
      },
      {
        name: "nativeButton",
        type: "boolean",
        default: "true",
        description:
          "When false, render as a non-button element (for example an anchor).",
      },
      {
        name: "render",
        type: "React.ReactElement",
        description: "Element to render when using non-native button mode.",
      },
      {
        name: "className",
        type: "string",
        description: "Additional CSS classes.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "button-demo-default" },
      { title: "Secondary", demoSlug: "button-demo-secondary" },
      { title: "Outline", demoSlug: "button-demo-outline" },
      { title: "Ghost", demoSlug: "button-demo-ghost" },
      { title: "Destructive", demoSlug: "button-demo-destructive" },
      { title: "Link", demoSlug: "button-demo-link" },
      {
        title: "All variants",
        description: "All button variants side by side.",
        demoSlug: "button-demo-variants",
      },
      {
        title: "Sizes",
        description: "Text and icon button sizes.",
        demoSlug: "button-demo-sizes",
      },
      {
        title: "With icon",
        description: "Icon before text, after text, and icon-only.",
        demoSlug: "button-demo-with-icon",
      },
      {
        title: "Loading",
        description: "Loading state with spinner overlay.",
        demoSlug: "button-demo-loading",
      },
      {
        title: "Disabled",
        description: "All variants in disabled state.",
        demoSlug: "button-demo-disabled",
      },
      {
        title: "Full width",
        description: "Button stretched to fill container width.",
        demoSlug: "button-demo-full-width",
      },
      {
        title: "Icon left",
        description: "Icon before text across all variants and sizes.",
        demoSlug: "button-demo-icon-left",
      },
      {
        title: "Icon right",
        description: "Icon after text across all variants and sizes.",
        demoSlug: "button-demo-icon-right",
      },
      {
        title: "Icon only",
        description: "Icon-only buttons across all variants and sizes.",
        demoSlug: "button-demo-icon-only",
      },
      {
        title: "Invalid states",
        description: "All variants in invalid/error state.",
        demoSlug: "button-demo-invalid-states",
      },
      {
        title: "Selected",
        description: "Pressed/selected state across variants.",
        demoSlug: "button-demo-selected",
      },
      {
        title: "Usage patterns",
        description: "Common button usage patterns.",
        demoSlug: "button-demo-usage",
      },
      {
        title: "Variants and sizes",
        description: "Full matrix of all variants across all sizes.",
        demoSlug: "button-demo-variants-and-sizes",
      },
    ],
  },

  // NOTE: ButtonExampleWithIcon already covered by "With icon" above

  badge: {
    description:
      "A numeric status badge aligned with the latest Atlassian Badge styles, including semantic and legacy appearance aliases, optional icons, and built-in numeric capping.",
    adsUrl: "https://atlassian.design/components/badge",
    usage: `import { Badge } from "@/components/ui/badge";

<Badge>8</Badge>
<Badge variant="information">12</Badge>
<Badge variant="success">+100</Badge>
<Badge variant="important">150</Badge>
<Badge variant="danger">-50</Badge>
<Badge variant="inverse">12</Badge>`,
    props: [
      {
        name: "variant",
        type: '"default" | "neutral" | "secondary" | "important" | "destructive" | "danger" | "success" | "added" | "warning" | "info" | "information" | "primary" | "discovery" | "inverse" | "primaryInverted" | "removed" | "outline" | "ghost" | "link"',
        default: '"default"',
        description:
          "Visual style variant of the badge. Includes ADS semantic appearances (neutral, primary, important, added, removed) and legacy aliases.",
      },
      {
        name: "max",
        type: "number | false",
        default: "99",
        description:
          "Maximum numeric value to display. Values exceeding max show as 'max+'. Set to false to disable capping.",
      },
      {
        name: "className",
        type: "string",
        description: "Additional CSS classes.",
      },
    ],
    examples: [
      // ADS-mirroring examples (mirror atlassian.design/components/badge/examples)
      {
        title: "Default",
        description: "ADS 'neutral' appearance — gray pill for numeric counts.",
        demoSlug: "badge-demo-default",
      },
      {
        title: "Primary",
        description: "ADS 'primary' appearance — blue informational count.",
        demoSlug: "badge-demo-primary",
      },
      {
        title: "Important",
        description:
          "ADS 'important' appearance — bold dark badge for high-urgency counts.",
        demoSlug: "badge-demo-important",
      },
      {
        title: "Added",
        description: "ADS 'added' appearance — green success count.",
        demoSlug: "badge-demo-added",
      },
      {
        title: "Removed",
        description: "ADS 'removed' appearance — red danger count.",
        demoSlug: "badge-demo-removed",
      },
      {
        title: "Max value",
        description: "Values exceeding max display as 'max+'. Defaults to 99.",
        demoSlug: "badge-demo-max-value",
      },
      // Additional VPK variant demos
      { title: "Secondary", demoSlug: "badge-demo-secondary" },
      { title: "Destructive", demoSlug: "badge-demo-destructive" },
      { title: "Success", demoSlug: "badge-demo-success" },
      { title: "Warning", demoSlug: "badge-demo-warning" },
      { title: "Info", demoSlug: "badge-demo-info" },
      { title: "Discovery", demoSlug: "badge-demo-discovery" },
      { title: "Outline", demoSlug: "badge-demo-outline" },
      { title: "Ghost", demoSlug: "badge-demo-ghost" },
      { title: "Link", demoSlug: "badge-demo-link" },
      {
        title: "ADS appearances",
        description: "All semantic badge appearances from @atlaskit/badge.",
        demoSlug: "badge-demo-ads-appearances",
      },
      {
        title: "ADS legacy aliases",
        description: "Legacy appearance aliases supported for parity.",
        demoSlug: "badge-demo-ads-legacy-aliases",
      },
      {
        title: "All variants",
        description: "All badge variants side by side.",
        demoSlug: "badge-demo-variants",
      },
      {
        title: "With icon",
        description: "Badge with inline icon using VPK Icon wrapper.",
        demoSlug: "badge-demo-with-icon",
      },
      {
        title: "With spinner",
        description: "Badge with inline spinner for loading states.",
        demoSlug: "badge-demo-with-spinner",
      },
      {
        title: "Disabled",
        description: "Disabled badge states.",
        demoSlug: "badge-demo-disabled",
      },
    ],
  },

  logo: {
    description:
      "Unified Atlassian product/app logo wrapper built on @atlaskit/logo with theme-aware defaults for light and dark mode. Supports icon-only and lockup (icon + wordmark) variants, plus a CustomLogo for rendering your own SVG.",
    adsUrl: "https://atlassian.design/components/logo",
    usage: `import { AtlassianLogo, JiraIcon, CustomLogo } from "@/components/ui/logo";

<AtlassianLogo name="jira" label="Jira" size="small" />
<AtlassianLogo name="jira" label="Jira" variant="lockup" size="small" />
<JiraIcon label="Jira" size="small" variant="lockup" />
<CustomLogo svg={<MySvg />} wordmark="Acme" size="small" label="Acme" />`,
    props: [
      {
        name: "name",
        type: '"admin" | "align" | "analytics" | "assets" | "atlassian" | "bamboo" | "bitbucket" | "chat" | "compass" | "confluence" | "customer-service-management" | "focus" | "goals" | "guard" | "home" | "hub" | "jira" | "jira-product-discovery" | "jira-service-management" | "loom" | "opsgenie" | "projects" | "rovo" | "rovo-dev" | "rovo-dev-agent" | "search" | "statuspage" | "studio" | "talent" | "teams" | "trello"',
        description: "Atlassian logo key (required for AtlassianLogo).",
      },
      {
        name: "variant",
        type: '"icon" | "lockup"',
        default: '"icon"',
        description:
          "Icon renders the symbol only. Lockup renders icon + wordmark together.",
      },
      {
        name: "size",
        type: '"xxsmall" | "xsmall" | "small" | "medium" | "large" | "xlarge"',
        default: '"small"',
        description: "Logo size.",
      },
      {
        name: "appearance",
        type: '"brand" | "neutral" | "inverse"',
        description: "Explicit appearance override.",
      },
      {
        name: "themeAware",
        type: "boolean",
        default: "true",
        description:
          "When true and appearance is omitted, picks brand/inverse based on theme.",
      },
      {
        name: "shouldUseNewLogoDesign",
        type: "boolean",
        default: "true",
        description:
          "Uses the latest logo designs. Set to false for legacy logos.",
      },
      {
        name: "shouldUseHexLogo",
        type: "boolean",
        description: "Rovo-only option for hex logo variant.",
      },
      {
        name: "svg",
        type: "ReactElement (CustomLogo only)",
        description: "Custom SVG element to render as the logo icon.",
      },
      {
        name: "wordmark",
        type: "string (CustomLogo only)",
        description: "Optional text displayed beside the custom SVG icon.",
      },
    ],
    examples: [
      {
        title: "Icons",
        description: "All available product icon logos.",
        demoSlug: "logo-demo-icons",
      },
      {
        title: "Lockups",
        description: "Icon + wordmark lockup variants.",
        demoSlug: "logo-demo-lockups",
      },
      {
        title: "Sizes",
        description: "All six size options for icon and lockup.",
        demoSlug: "logo-demo-sizes",
      },
      {
        title: "Appearances",
        description: "Brand, neutral, and inverse appearances.",
        demoSlug: "logo-demo-appearances",
      },
      {
        title: "Custom Logo",
        description: "Render a custom SVG with optional wordmark.",
        demoSlug: "logo-demo-custom",
      },
      {
        title: "Named Exports",
        description: "All convenience named exports for direct usage.",
        demoSlug: "logo-demo-named-exports",
      },
    ],
  },

  dialog: {
    description:
      "A modal dialog component using Base UI with customizable header, content, footer, title, and description sub-components. Supports backdrop overlay with animations.",
    adsUrl: "https://atlassian.design/components/modal-dialog",
    usage: `import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

<Dialog>
  <DialogTrigger>
    <Button>Open dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    <p>Dialog body content</p>
  </DialogContent>
</Dialog>`,
    props: [
      {
        name: "showCloseButton",
        type: "boolean",
        default: "true",
        description: "Show or hide the close button in the dialog header.",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg" | "xl"',
        default: '"sm"',
        description:
          "Width preset for the dialog content. Maps to ADS modal-dialog named widths.",
      },
      {
        name: "variant",
        type: '"default" | "warning" | "destructive"',
        default: '"default"',
        description:
          "Visual variant for the dialog title. Warning and destructive variants prepend a status icon.",
      },
      {
        name: "className",
        type: "string",
        description: "Additional CSS classes for the dialog content.",
      },
    ],
    subComponents: [
      { name: "DialogTrigger", description: "Element that opens the dialog." },
      { name: "DialogContent", description: "The dialog popup container." },
      { name: "DialogHeader", description: "Top section of the dialog." },
      {
        name: "DialogTitle",
        description:
          "Primary heading in the dialog. Accepts variant prop for warning/destructive appearance.",
      },
      { name: "DialogDescription", description: "Secondary descriptive text." },
      { name: "DialogFooter", description: "Bottom section for actions." },
    ],
    examples: [
      {
        title: "Default",
        description: "Basic dialog with title, description, and close button.",
        demoSlug: "dialog-demo-default",
      },
      {
        title: "Warning",
        description: "Dialog with warning appearance title.",
        demoSlug: "dialog-demo-warning",
      },
      {
        title: "Destructive",
        description: "Dialog with destructive appearance title.",
        demoSlug: "dialog-demo-destructive",
      },
      {
        title: "Width",
        description: "Dialog with different width presets.",
        demoSlug: "dialog-demo-widths",
      },
      {
        title: "With form",
        description: "Dialog containing a simple form.",
        demoSlug: "dialog-demo-form",
      },
      {
        title: "No close button",
        description: "Dialog without the header close button.",
        demoSlug: "dialog-demo-no-close",
      },
      {
        title: "Custom width",
        description: "Dialog with wider content area.",
        demoSlug: "dialog-demo-custom-width",
      },
      {
        title: "Chat settings",
        description: "Dialog styled as a chat settings panel.",
        demoSlug: "dialog-demo-chat-settings",
      },
      {
        title: "No close button (alt)",
        description: "Alternate no-close-button dialog.",
        demoSlug: "dialog-demo-no-close-button",
      },
      {
        title: "Scrollable content",
        description: "Dialog with scrollable overflow content.",
        demoSlug: "dialog-demo-scrollable-content",
      },
      {
        title: "With form (alt)",
        description: "Dialog with labeled form fields.",
        demoSlug: "dialog-demo-with-form",
      },
      {
        title: "With sticky footer",
        description: "Dialog with a fixed footer for actions.",
        demoSlug: "dialog-demo-with-sticky-footer",
      },
    ],
  },

  tabs: {
    description:
      "A tabbed interface component with configurable orientations and visual variants. Built on Base UI TabsPrimitive.",
    adsUrl: "https://atlassian.design/components/tabs",
    usage: `import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">First</TabsTrigger>
    <TabsTrigger value="tab2">Second</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>`,
    props: [
      {
        name: "orientation",
        type: '"horizontal" | "vertical"',
        default: '"horizontal"',
        description: "Tab layout direction.",
      },
      {
        name: "defaultValue",
        type: "string",
        description: "Initially active tab value.",
      },
    ],
    subComponents: [
      { name: "TabsList", description: "Container for tab triggers." },
      { name: "TabsTrigger", description: "Individual tab button." },
      { name: "TabsContent", description: "Panel content for each tab." },
    ],
    examples: [
      {
        title: "Default",
        description: "Basic tabbed interface with pill-style tabs.",
        demoSlug: "tabs-demo-default",
      },
      {
        title: "Line variant",
        description: "Tabs with underline-style indicator.",
        demoSlug: "tabs-demo-line",
      },
      {
        title: "Vertical",
        description: "Vertically-oriented tabs.",
        demoSlug: "tabs-demo-vertical",
      },
      {
        title: "Disabled",
        description: "Tab with disabled trigger.",
        demoSlug: "tabs-demo-disabled",
      },
      { title: "Basic", demoSlug: "tabs-demo-basic" },
      {
        title: "Icon only",
        description: "Tabs with icon-only triggers.",
        demoSlug: "tabs-demo-icon-only",
      },
      {
        title: "Line disabled",
        description: "Line variant with disabled trigger.",
        demoSlug: "tabs-demo-line-disabled",
      },
      {
        title: "Line with content",
        description: "Line variant with tab panel content.",
        demoSlug: "tabs-demo-line-with-content",
      },
      {
        title: "Multiple",
        description: "Multiple tab groups stacked.",
        demoSlug: "tabs-demo-multiple",
      },
      {
        title: "Variants alignment",
        description: "All variants with alignment options.",
        demoSlug: "tabs-demo-variants-alignment",
      },
      {
        title: "With content",
        description: "Tabs with panel content.",
        demoSlug: "tabs-demo-with-content",
      },
      {
        title: "With dropdown",
        description: "Tabs with dropdown overflow menu.",
        demoSlug: "tabs-demo-with-dropdown",
      },
      {
        title: "With icons",
        description: "Tabs with icon and text triggers.",
        demoSlug: "tabs-demo-with-icons",
      },
      {
        title: "With input and button",
        description: "Tabs combined with input and button.",
        demoSlug: "tabs-demo-with-input-and-button",
      },
    ],
  },

  select: {
    description:
      "A dropdown select component using Base UI with support for groups, scroll buttons, and keyboard navigation.",
    adsUrl: "https://atlassian.design/components/select",
    usage: `import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="a">Option A</SelectItem>
    <SelectItem value="b">Option B</SelectItem>
  </SelectContent>
</Select>`,
    props: [
      {
        name: "size",
        type: '"sm" | "default"',
        default: '"default"',
        description: "Size of the select trigger.",
      },
      {
        name: "side",
        type: '"top" | "bottom" | "left" | "right"',
        default: '"bottom"',
        description: "Popup placement side.",
      },
      {
        name: "align",
        type: '"start" | "center" | "end"',
        default: '"center"',
        description: "Horizontal alignment of the popup.",
      },
    ],
    subComponents: [
      { name: "SelectTrigger", description: "Button that opens the dropdown." },
      { name: "SelectValue", description: "Displays the selected value." },
      { name: "SelectContent", description: "Dropdown popup container." },
      { name: "SelectItem", description: "Individual selectable option." },
      { name: "SelectGroup", description: "Groups related items together." },
      { name: "SelectLabel", description: "Label for a group of items." },
    ],
    examples: [
      {
        title: "Default",
        description: "Simple select with basic options.",
        demoSlug: "select-demo-default",
      },
      {
        title: "Grouped",
        description: "Select with grouped options and labels.",
        demoSlug: "select-demo-grouped",
      },
      {
        title: "Small",
        description: "Compact select trigger.",
        demoSlug: "select-demo-small",
      },
      {
        title: "Disabled",
        description: "Disabled select trigger.",
        demoSlug: "select-demo-disabled",
      },
      { title: "Basic", demoSlug: "select-demo-basic" },
      {
        title: "In dialog",
        description: "Select inside a dialog.",
        demoSlug: "select-demo-in-dialog",
      },
      {
        title: "Inline with input and native select",
        description: "Select combined with input and native select.",
        demoSlug: "select-demo-inline-with-input-nativeselect",
      },
      {
        title: "Invalid",
        description: "Select in invalid/error state.",
        demoSlug: "select-demo-invalid",
      },
      {
        title: "Item aligned",
        description: "Select with item-aligned positioning.",
        demoSlug: "select-demo-item-aligned",
      },
      {
        title: "Large list",
        description: "Select with many scrollable options.",
        demoSlug: "select-demo-large-list",
      },
      {
        title: "Multiple selection",
        description: "Select with multiple item selection.",
        demoSlug: "select-demo-multiple-selection",
      },
      {
        title: "Sides",
        description: "Select opening on different sides.",
        demoSlug: "select-demo-sides",
      },
      {
        title: "Sizes",
        description: "Select in different size variants.",
        demoSlug: "select-demo-sizes",
      },
      {
        title: "Subscription plan",
        description: "Select styled as a subscription plan picker.",
        demoSlug: "select-demo-subscription-plan",
      },
      {
        title: "With button",
        description: "Select combined with a button.",
        demoSlug: "select-demo-with-button",
      },
      {
        title: "With field",
        description: "Select inside a form field.",
        demoSlug: "select-demo-with-field",
      },
      {
        title: "With groups and labels",
        description: "Select with labeled option groups.",
        demoSlug: "select-demo-with-groups-labels",
      },
      {
        title: "With icons",
        description: "Select items with leading icons.",
        demoSlug: "select-demo-with-icons",
      },
    ],
  },

  checkbox: {
    description:
      "A checkbox component built on Base UI with a checkmark indicator icon from Atlaskit.",
    adsUrl: "https://atlassian.design/components/checkbox",
    usage: `import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

<div className="flex items-center gap-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Accept terms</Label>
</div>`,
    props: [
      {
        name: "checked",
        type: "boolean",
        description: "Controlled checked state.",
      },
      {
        name: "defaultChecked",
        type: "boolean",
        description: "Default checked state (uncontrolled).",
      },
      {
        name: "onCheckedChange",
        type: "(checked: boolean) => void",
        description: "Callback when checked state changes.",
      },
      {
        name: "disabled",
        type: "boolean",
        description: "Disable the checkbox.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Checkbox with label.",
        demoSlug: "checkbox-demo-default",
      },
      {
        title: "Checked",
        description: "Checked by default.",
        demoSlug: "checkbox-demo-checked",
      },
      { title: "Disabled", demoSlug: "checkbox-demo-disabled" },
      {
        title: "With description",
        description: "Checkbox with label and helper text.",
        demoSlug: "checkbox-demo-with-description",
      },
      { title: "Basic", demoSlug: "checkbox-demo-basic" },
      {
        title: "Disabled (full)",
        description: "Checkbox disabled in all states.",
        demoSlug: "checkbox-demo-disabled-full",
      },
      {
        title: "Group",
        description: "Group of related checkboxes.",
        demoSlug: "checkbox-demo-group",
      },
      {
        title: "In table",
        description: "Checkboxes inside a data table.",
        demoSlug: "checkbox-demo-in-table",
      },
      {
        title: "Invalid",
        description: "Checkbox in invalid/error state.",
        demoSlug: "checkbox-demo-invalid",
      },
      {
        title: "With description (full)",
        description: "Checkbox with full description layout.",
        demoSlug: "checkbox-demo-with-description-full",
      },
      {
        title: "With title",
        description: "Checkbox with title text.",
        demoSlug: "checkbox-demo-with-title",
      },
    ],
  },

  "radio-group": {
    description:
      "A radio group component built on Base UI with circle indicator styling.",
    adsUrl: "https://atlassian.design/components/radio",
    usage: `import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

<RadioGroup defaultValue="option-1">
  <div className="flex items-center gap-2">
    <RadioGroupItem value="option-1" id="option-1" />
    <Label htmlFor="option-1">Option 1</Label>
  </div>
</RadioGroup>`,
    props: [
      {
        name: "defaultValue",
        type: "string",
        description: "Default selected value.",
      },
      {
        name: "value",
        type: "string",
        description: "Controlled selected value.",
      },
      {
        name: "onValueChange",
        type: "(value: string) => void",
        description: "Callback when selection changes.",
      },
      {
        name: "disabled",
        type: "boolean",
        description: "Disable the radio group.",
      },
    ],
    subComponents: [
      { name: "RadioGroupItem", description: "Individual radio button." },
    ],
    examples: [
      {
        title: "Default",
        description: "Radio group with three options.",
        demoSlug: "radio-group-demo-default",
      },
      {
        title: "Horizontal",
        description: "Horizontal layout.",
        demoSlug: "radio-group-demo-horizontal",
      },
      { title: "Disabled", demoSlug: "radio-group-demo-disabled" },
      { title: "Basic", demoSlug: "radio-group-demo-basic" },
      {
        title: "Grid layout",
        description: "Radio group in a grid layout.",
        demoSlug: "radio-group-demo-grid-layout",
      },
      {
        title: "Invalid",
        description: "Radio group in invalid/error state.",
        demoSlug: "radio-group-demo-invalid",
      },
      {
        title: "With descriptions",
        description: "Radio items with description text.",
        demoSlug: "radio-group-demo-with-descriptions",
      },
      {
        title: "With fieldset",
        description: "Radio group inside a fieldset with legend.",
        demoSlug: "radio-group-demo-with-fieldset",
      },
    ],
  },

  switch: {
    description:
      "An ADS Toggle-aligned switch component with success checked state, neutral unchecked state, and animated thumb.",
    adsUrl: "https://atlassian.design/components/toggle",
    usage: `import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

<div className="flex items-center gap-2">
  <Switch id="airplane" label="Toggle airplane mode" />
  <Label htmlFor="airplane">Airplane mode</Label>
</div>`,
    props: [
      {
        name: "size",
        type: '"sm" | "default" | "lg"',
        default: '"default"',
        description: "Size of the switch.",
      },
      {
        name: "checked",
        type: "boolean",
        description: "Controlled checked state.",
      },
      {
        name: "defaultChecked",
        type: "boolean",
        description: "Default checked state.",
      },
      {
        name: "onCheckedChange",
        type: "(checked: boolean) => void",
        description: "Callback when state changes.",
      },
      {
        name: "label",
        type: "string",
        description: "Accessibility label (aria-label).",
      },
      { name: "disabled", type: "boolean", description: "Disable the switch." },
    ],
    examples: [
      {
        title: "Default",
        description: "Switch with label.",
        demoSlug: "switch-demo-default",
      },
      {
        title: "Small",
        description: "Compact switch.",
        demoSlug: "switch-demo-small",
      },
      {
        title: "Checked",
        description: "Checked by default.",
        demoSlug: "switch-demo-checked",
      },
      { title: "Disabled", demoSlug: "switch-demo-disabled" },
      { title: "Basic", demoSlug: "switch-demo-basic" },
      {
        title: "Sizes",
        description: "All switch size variants.",
        demoSlug: "switch-demo-sizes",
      },
      {
        title: "With description",
        description: "Switch with description text.",
        demoSlug: "switch-demo-with-description",
      },
    ],
  },

  toggle: {
    description:
      "A toggle button component built on Base UI with variant and size options for toolbar-style interactions.",
    usage: `import { Toggle } from "@/components/ui/toggle";
import { BoldIcon } from "@/components/ui/vpk-icons";

<Toggle aria-label="Toggle bold">
  <BoldIcon className="size-4" />
</Toggle>`,
    props: [
      {
        name: "variant",
        type: '"default" | "outline"',
        default: '"default"',
        description: "Visual style variant.",
      },
      {
        name: "size",
        type: '"default" | "sm" | "lg"',
        default: '"default"',
        description: "Size of the toggle.",
      },
      {
        name: "pressed",
        type: "boolean",
        description: "Controlled pressed state.",
      },
      {
        name: "defaultPressed",
        type: "boolean",
        description: "Default pressed state.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "toggle-demo-default" },
      {
        title: "Outline",
        description: "Outline variant.",
        demoSlug: "toggle-demo-outline",
      },
      {
        title: "With text",
        description: "Toggle with icon and text.",
        demoSlug: "toggle-demo-with-text",
      },
      {
        title: "Sizes",
        description: "Small, default, and large toggles.",
        demoSlug: "toggle-demo-sizes",
      },
      { title: "Basic", demoSlug: "toggle-demo-basic" },
      { title: "Disabled", demoSlug: "toggle-demo-disabled" },
      {
        title: "With button icon and text",
        description: "Toggle button with icon and text.",
        demoSlug: "toggle-demo-with-button-icon-text",
      },
      {
        title: "With button icon",
        description: "Toggle button with icon only.",
        demoSlug: "toggle-demo-with-button-icon",
      },
      {
        title: "With button text",
        description: "Toggle button with text only.",
        demoSlug: "toggle-demo-with-button-text",
      },
      {
        title: "With icon",
        description: "Toggle with icon.",
        demoSlug: "toggle-demo-with-icon",
      },
    ],
  },

  "toggle-group": {
    description:
      "A group of toggle buttons built on Base UI with shared context for variant and size.",
    usage: `import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

<ToggleGroup>
  <ToggleGroupItem value="bold" aria-label="Bold">B</ToggleGroupItem>
  <ToggleGroupItem value="italic" aria-label="Italic">I</ToggleGroupItem>
</ToggleGroup>`,
    props: [
      {
        name: "variant",
        type: '"default" | "outline"',
        default: '"default"',
        description: "Visual style for all items.",
      },
      {
        name: "size",
        type: '"default" | "sm" | "lg"',
        default: '"default"',
        description: "Size for all items.",
      },
      {
        name: "spacing",
        type: "number",
        default: "0",
        description: "Gap between items in pixels.",
      },
      {
        name: "orientation",
        type: '"horizontal" | "vertical"',
        default: '"horizontal"',
        description: "Layout direction.",
      },
    ],
    subComponents: [
      {
        name: "ToggleGroupItem",
        description: "Individual toggle button within the group.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Single-select toggle group.",
        demoSlug: "toggle-group-demo-default",
      },
      {
        title: "Outline",
        description: "Outline variant.",
        demoSlug: "toggle-group-demo-outline",
      },
      {
        title: "Multiple",
        description: "Multi-select toggle group.",
        demoSlug: "toggle-group-demo-multiple",
      },
      { title: "Basic", demoSlug: "toggle-group-demo-basic" },
      {
        title: "Date range",
        description: "Toggle group as a date range picker.",
        demoSlug: "toggle-group-demo-date-range",
      },
      {
        title: "Filter",
        description: "Toggle group used as a filter bar.",
        demoSlug: "toggle-group-demo-filter",
      },
      {
        title: "Outline with icons",
        description: "Outline variant with icon items.",
        demoSlug: "toggle-group-demo-outline-with-icons",
      },
      {
        title: "Sizes",
        description: "Toggle group size variants.",
        demoSlug: "toggle-group-demo-sizes",
      },
      {
        title: "Sort",
        description: "Toggle group used as a sort selector.",
        demoSlug: "toggle-group-demo-sort",
      },
      {
        title: "Vertical outline with icons",
        description: "Vertical outline variant with icons.",
        demoSlug: "toggle-group-demo-vertical-outline-with-icons",
      },
      {
        title: "Vertical outline",
        description: "Vertical outline variant.",
        demoSlug: "toggle-group-demo-vertical-outline",
      },
      {
        title: "Vertical with spacing",
        description: "Vertical group with spacing between items.",
        demoSlug: "toggle-group-demo-vertical-with-spacing",
      },
      {
        title: "Vertical",
        description: "Vertically-oriented toggle group.",
        demoSlug: "toggle-group-demo-vertical",
      },
      {
        title: "With icons",
        description: "Toggle group items with icons.",
        demoSlug: "toggle-group-demo-with-icons",
      },
      {
        title: "With input and select",
        description: "Toggle group combined with input and select.",
        demoSlug: "toggle-group-demo-with-input-and-select",
      },
      {
        title: "With spacing",
        description: "Toggle group with spacing between items.",
        demoSlug: "toggle-group-demo-with-spacing",
      },
    ],
  },

  label: {
    description:
      "A styled label component for form fields with peer/group-aware disabled states.",
    usage: `import { Label } from "@/components/ui/label";

<Label htmlFor="email">Email address</Label>`,
    props: [
      {
        name: "htmlFor",
        type: "string",
        description: "ID of the associated form element.",
      },
      {
        name: "className",
        type: "string",
        description: "Additional CSS classes.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "label-demo-default" },
      {
        title: "With input",
        description: "Label paired with an input field.",
        demoSlug: "label-demo-with-input",
      },
      {
        title: "Disabled",
        description: "Label in disabled state.",
        demoSlug: "label-demo-disabled",
      },
      {
        title: "With checkbox",
        description: "Label paired with a checkbox.",
        demoSlug: "label-demo-with-checkbox",
      },
      {
        title: "With textarea",
        description: "Label paired with a textarea.",
        demoSlug: "label-demo-with-textarea",
      },
    ],
  },

  field: {
    description:
      "A comprehensive form field layout system with support for labels, descriptions, errors, and responsive orientations. Composes Input (text field) and Textarea primitives with field layout components.",
    adsUrl: "https://atlassian.design/components/textfield",
    adsLinks: [
      {
        label: "@atlaskit/textfield",
        url: "https://atlassian.design/components/textfield",
      },
      {
        label: "@atlaskit/textarea",
        url: "https://atlassian.design/components/textarea",
      },
    ],
    usage: `import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

<Field>
  <FieldLabel>Username</FieldLabel>
  <Input variant="subtle" placeholder="Enter username" />
  <FieldDescription>Your display name.</FieldDescription>
</Field>

<Field>
  <FieldLabel>Message</FieldLabel>
  <Textarea placeholder="Type your message..." />
</Field>`,
    props: [
      {
        name: "orientation",
        type: '"vertical" | "horizontal" | "responsive"',
        default: '"vertical"',
        description: "Layout direction.",
      },
      {
        name: "data-invalid",
        type: "boolean",
        description: "Marks the field as invalid.",
      },
    ],
    subComponents: [
      { name: "FieldLabel", description: "Label for the field." },
      { name: "FieldDescription", description: "Helper text below the input." },
      {
        name: "FieldError",
        description: "Error message display with role=alert.",
      },
      { name: "FieldGroup", description: "Container for multiple fields." },
      { name: "FieldSet", description: "Fieldset wrapper for grouped fields." },
      { name: "FieldLegend", description: "Legend for a fieldset." },
    ],
    examples: [
      {
        title: "Default",
        description: "Field with label, input, and description.",
        demoSlug: "field-demo-default",
      },
      {
        title: "Error",
        description: "Field with validation error.",
        demoSlug: "field-demo-error",
      },
      {
        title: "Horizontal",
        description: "Horizontal field layout.",
        demoSlug: "field-demo-horizontal",
      },
      {
        title: "Fieldset",
        description: "Grouped fields with fieldset and legend.",
        demoSlug: "field-demo-fieldset",
      },
      {
        title: "Text field",
        description: "Basic text input field.",
        demoSlug: "field-demo-text-field",
        badge: { label: "ADS", variant: "discovery" },
      },
      {
        title: "Text field disabled",
        description: "Disabled text input field.",
        demoSlug: "field-demo-text-field-disabled",
        badge: { label: "ADS", variant: "discovery" },
      },
      {
        title: "Text field invalid",
        description: "Text input with error state.",
        demoSlug: "field-demo-text-field-invalid",
        badge: { label: "ADS", variant: "discovery" },
      },
      {
        title: "Text field variants",
        description: "Default and subtle input variants.",
        demoSlug: "field-demo-text-field-variants",
        badge: { label: "ADS", variant: "discovery" },
      },
      {
        title: "Textarea",
        description: "Basic textarea field.",
        demoSlug: "field-demo-textarea",
        badge: { label: "ADS", variant: "discovery" },
      },
      {
        title: "Textarea disabled",
        description: "Disabled textarea field.",
        demoSlug: "field-demo-textarea-disabled",
        badge: { label: "ADS", variant: "discovery" },
      },
      {
        title: "Textarea invalid",
        description: "Textarea with error state.",
        demoSlug: "field-demo-textarea-invalid",
        badge: { label: "ADS", variant: "discovery" },
      },
      {
        title: "Form",
        description: "Form with text inputs and submit button.",
        demoSlug: "field-demo-form",
      },
      {
        title: "Input types",
        description: "Various HTML input types.",
        demoSlug: "field-demo-input-types",
      },
      {
        title: "Checkbox fields",
        description: "Field layout with checkbox inputs.",
        demoSlug: "field-demo-checkbox-fields",
      },
      {
        title: "Horizontal fields",
        description: "Multiple horizontal field layouts.",
        demoSlug: "field-demo-horizontal-fields",
      },
      {
        title: "Input fields",
        description: "Field layout with various input types.",
        demoSlug: "field-demo-input-fields",
      },
      {
        title: "Native select fields",
        description: "Field layout with native select inputs.",
        demoSlug: "field-demo-native-select-fields",
      },
      {
        title: "OTP input fields",
        description: "Field layout with OTP input.",
        demoSlug: "field-demo-otp-input-fields",
      },
      {
        title: "Radio fields",
        description: "Field layout with radio group inputs.",
        demoSlug: "field-demo-radio-fields",
      },
      {
        title: "Select fields",
        description: "Field layout with select inputs.",
        demoSlug: "field-demo-select-fields",
      },
      {
        title: "Slider fields",
        description: "Field layout with slider inputs.",
        demoSlug: "field-demo-slider-fields",
      },
      {
        title: "Switch fields",
        description: "Field layout with switch inputs.",
        demoSlug: "field-demo-switch-fields",
      },
      {
        title: "Textarea fields",
        description: "Field layout with textarea inputs.",
        demoSlug: "field-demo-textarea-fields",
      },
    ],
  },

  footer: {
    description:
      "A compact footer bar with an information icon and customizable text. Place below prompt inputs or chat composers to communicate AI usage or other contextual information.",
    usage: `import { Footer } from "@/components/ui-custom/footer";

<Footer />

<Footer>AI-generated content may contain errors.</Footer>

<Footer hideIcon>Uses AI. Verify results.</Footer>`,
    props: [
      {
        name: "children",
        type: "ReactNode",
        default: '"Uses AI. Verify results."',
        description:
          "Custom footer text. Falls back to the default message when omitted.",
      },
      {
        name: "hideIcon",
        type: "boolean",
        default: "false",
        description: "When true, hides the information circle icon.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "footer-demo-default" },
      {
        title: "Custom text",
        description: "Footer with custom message text.",
        demoSlug: "footer-demo-custom-text",
      },
      {
        title: "Without icon",
        description: "Footer with the icon hidden.",
        demoSlug: "footer-demo-no-icon",
      },
      {
        title: "Keyboard hints",
        description:
          "Footer used for keyboard shortcut hints below question cards.",
        demoSlug: "footer-demo-keyboard-hints",
      },
    ],
  },

  "native-select": {
    description:
      "A styled native HTML select element with size variants and chevron icon overlay.",
    usage: `import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

<NativeSelect>
  <NativeSelectOption value="1">Option 1</NativeSelectOption>
  <NativeSelectOption value="2">Option 2</NativeSelectOption>
</NativeSelect>`,
    props: [
      {
        name: "size",
        type: '"sm" | "default"',
        default: '"default"',
        description: "Size of the select.",
      },
      { name: "disabled", type: "boolean", description: "Disable the select." },
    ],
    subComponents: [
      { name: "NativeSelectOption", description: "Individual option element." },
      { name: "NativeSelectOptGroup", description: "Option group element." },
    ],
    examples: [
      { title: "Default", demoSlug: "native-select-demo-default" },
      {
        title: "Small",
        description: "Compact select.",
        demoSlug: "native-select-demo-small",
      },
      { title: "Disabled", demoSlug: "native-select-demo-disabled" },
      { title: "Basic", demoSlug: "native-select-demo-basic" },
      {
        title: "Invalid",
        description: "Native select in invalid/error state.",
        demoSlug: "native-select-demo-invalid",
      },
      {
        title: "Sizes",
        description: "All native select size variants.",
        demoSlug: "native-select-demo-sizes",
      },
      {
        title: "With field",
        description: "Native select inside a form field.",
        demoSlug: "native-select-demo-with-field",
      },
      {
        title: "With groups",
        description: "Native select with option groups.",
        demoSlug: "native-select-demo-with-groups",
      },
    ],
  },

  "input-otp": {
    description:
      "A one-time password input component with individual digit slots, separators, and animated caret.",
    usage: `import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";

<InputOTP maxLength={6}>
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
    <InputOTPSlot index={2} />
  </InputOTPGroup>
  <InputOTPSeparator />
  <InputOTPGroup>
    <InputOTPSlot index={3} />
    <InputOTPSlot index={4} />
    <InputOTPSlot index={5} />
  </InputOTPGroup>
</InputOTP>`,
    props: [
      {
        name: "maxLength",
        type: "number",
        required: true,
        description: "Maximum number of characters.",
      },
      {
        name: "pattern",
        type: "string",
        description: "Regex pattern for validation.",
      },
    ],
    subComponents: [
      { name: "InputOTPGroup", description: "Container for a group of slots." },
      { name: "InputOTPSlot", description: "Individual digit input slot." },
      {
        name: "InputOTPSeparator",
        description: "Visual separator between groups.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "6-digit OTP in one group.",
        demoSlug: "input-otp-demo-default",
      },
      {
        title: "With separator",
        description: "Two groups separated by a divider.",
        demoSlug: "input-otp-demo-with-separator",
      },
      {
        title: "Pattern",
        description: "Digits and characters pattern.",
        demoSlug: "input-otp-demo-pattern",
      },
      {
        title: "4 digits",
        description: "4-digit OTP input.",
        demoSlug: "input-otp-demo-4-digits",
      },
      {
        title: "Alphanumeric",
        description: "OTP accepting letters and digits.",
        demoSlug: "input-otp-demo-alphanumeric",
      },
      {
        title: "Digits only",
        description: "OTP restricted to digits.",
        demoSlug: "input-otp-demo-digits-only",
      },
      {
        title: "Disabled",
        description: "Disabled OTP input.",
        demoSlug: "input-otp-demo-disabled",
      },
      {
        title: "Form",
        description: "OTP input inside a form.",
        demoSlug: "input-otp-demo-form",
      },
      {
        title: "Invalid state",
        description: "OTP in invalid/error state.",
        demoSlug: "input-otp-demo-invalid-state",
      },
      {
        title: "Simple",
        description: "Simple OTP input without separator.",
        demoSlug: "input-otp-demo-simple",
      },
    ],
  },

  "alert-dialog": {
    description:
      "A modal confirmation dialog built on Base UI AlertDialog with action and cancel buttons for destructive or important actions.",
    usage: `import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent,
  AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog";

<AlertDialog>
  <AlertDialogTrigger><Button>Delete</Button></AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`,
    props: [
      {
        name: "size",
        type: '"default" | "sm"',
        default: '"default"',
        description: "Size of the dialog content.",
      },
    ],
    subComponents: [
      {
        name: "AlertDialogTrigger",
        description: "Element that opens the dialog.",
      },
      { name: "AlertDialogContent", description: "The dialog container." },
      {
        name: "AlertDialogHeader",
        description: "Top section with title and description.",
      },
      { name: "AlertDialogTitle", description: "Primary heading." },
      { name: "AlertDialogDescription", description: "Secondary text." },
      {
        name: "AlertDialogFooter",
        description: "Bottom section for action buttons.",
      },
      { name: "AlertDialogAction", description: "Primary action button." },
      { name: "AlertDialogCancel", description: "Cancel/dismiss button." },
      {
        name: "AlertDialogMedia",
        description: "Icon or image slot in header.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Basic confirmation dialog.",
        demoSlug: "alert-dialog-demo-default",
      },
      {
        title: "Destructive",
        description: "Destructive action styling.",
        demoSlug: "alert-dialog-demo-destructive",
      },
      {
        title: "Small",
        description: "Compact dialog.",
        demoSlug: "alert-dialog-demo-small",
      },
      {
        title: "Custom actions",
        description: "Multiple action buttons.",
        demoSlug: "alert-dialog-demo-custom-actions",
      },
      { title: "Basic", demoSlug: "alert-dialog-demo-basic" },
      {
        title: "In dialog",
        description: "Alert dialog nested inside a dialog.",
        demoSlug: "alert-dialog-demo-in-dialog",
      },
      {
        title: "Small with media",
        description: "Compact dialog with media icon.",
        demoSlug: "alert-dialog-demo-small-with-media",
      },
      {
        title: "With media",
        description: "Dialog with media icon in header.",
        demoSlug: "alert-dialog-demo-with-media",
      },
    ],
  },

  popover: {
    description:
      "A floating popover component built on Base UI with configurable positioning and arrow.",
    adsUrl: "https://atlassian.design/components/popup/",
    usage: `import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

<Popover>
  <PopoverTrigger><Button>Open</Button></PopoverTrigger>
  <PopoverContent>Content here</PopoverContent>
</Popover>`,
    props: [
      {
        name: "side",
        type: '"top" | "bottom" | "left" | "right"',
        default: '"bottom"',
        description: "Placement side.",
      },
      {
        name: "sideOffset",
        type: "number",
        description: "Offset from the trigger.",
      },
      {
        name: "align",
        type: '"start" | "center" | "end"',
        description: "Alignment relative to trigger.",
      },
    ],
    subComponents: [
      {
        name: "PopoverTrigger",
        description: "Element that opens the popover.",
      },
      { name: "PopoverContent", description: "Floating content container." },
      { name: "PopoverHeader", description: "Header section." },
      { name: "PopoverTitle", description: "Title text." },
      { name: "PopoverDescription", description: "Description text." },
    ],
    examples: [
      {
        title: "Default",
        description: "Basic popover with text content.",
        demoSlug: "popover-demo-default",
      },
      {
        title: "With form",
        description: "Popover containing form fields.",
        demoSlug: "popover-demo-with-form",
      },
      {
        title: "Placement",
        description: "Top-side placement.",
        demoSlug: "popover-demo-placement",
      },
      {
        title: "Alignments",
        description: "Popover with different alignment options.",
        demoSlug: "popover-demo-alignments",
      },
      { title: "Basic", demoSlug: "popover-demo-basic" },
      {
        title: "In dialog",
        description: "Popover inside a dialog.",
        demoSlug: "popover-demo-in-dialog",
      },
      {
        title: "Sides",
        description: "Popover opening on different sides.",
        demoSlug: "popover-demo-sides",
      },
    ],
  },

  tooltip: {
    description:
      "A floating tooltip component built on Base UI with arrow indicator and configurable delay.",
    adsUrl: "https://atlassian.design/components/tooltip",
    usage: `import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger><Button>Hover me</Button></TooltipTrigger>
    <TooltipContent>Tooltip text</TooltipContent>
  </Tooltip>
</TooltipProvider>`,
    props: [
      {
        name: "delay",
        type: "number",
        default: "0",
        description: "Delay before showing (on TooltipProvider).",
      },
      {
        name: "side",
        type: '"top" | "bottom" | "left" | "right"',
        description: "Placement side.",
      },
      {
        name: "sideOffset",
        type: "number",
        description: "Offset from trigger.",
      },
    ],
    subComponents: [
      {
        name: "TooltipProvider",
        description: "Context provider for tooltip configuration.",
      },
      {
        name: "TooltipTrigger",
        description: "Element that triggers the tooltip.",
      },
      { name: "TooltipContent", description: "Floating tooltip content." },
    ],
    examples: [
      { title: "Default", demoSlug: "tooltip-demo-default" },
      {
        title: "Side",
        description: "Right-side placement.",
        demoSlug: "tooltip-demo-side",
      },
      {
        title: "Icon button",
        description: "Tooltip on an icon-only button.",
        demoSlug: "tooltip-demo-icon-button",
      },
      { title: "Basic", demoSlug: "tooltip-demo-basic" },
      {
        title: "Disabled",
        description: "Tooltip on a disabled element.",
        demoSlug: "tooltip-demo-disabled",
      },
      {
        title: "Formatted content",
        description: "Tooltip with rich formatted content.",
        demoSlug: "tooltip-demo-formatted-content",
      },
      {
        title: "Long content",
        description: "Tooltip with long text content.",
        demoSlug: "tooltip-demo-long-content",
      },
      {
        title: "On link",
        description: "Tooltip on a text link.",
        demoSlug: "tooltip-demo-on-link",
      },
      {
        title: "Sides",
        description: "Tooltips on all four sides.",
        demoSlug: "tooltip-demo-sides",
      },
      {
        title: "With icon",
        description: "Tooltip triggered by an icon.",
        demoSlug: "tooltip-demo-with-icon",
      },
      {
        title: "With keyboard shortcut",
        description: "Tooltip showing a keyboard shortcut.",
        demoSlug: "tooltip-demo-with-keyboard-shortcut",
      },
    ],
  },

  "hover-card": {
    description:
      "A floating preview card component built on Base UI PreviewCard that appears on hover. Covers the use cases of ADS InlineDialog and InlineMessage — contextual previews, inline info, and lightweight popups.",
    adsUrl: "https://atlassian.design/components/inline-dialog",
    usage: `import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";

<HoverCard>
  <HoverCardTrigger>Hover me</HoverCardTrigger>
  <HoverCardContent>Preview content</HoverCardContent>
</HoverCard>`,
    props: [
      {
        name: "openDelay",
        type: "number",
        description: "Delay before showing.",
      },
      {
        name: "closeDelay",
        type: "number",
        description: "Delay before hiding.",
      },
      {
        name: "side",
        type: '"top" | "bottom" | "left" | "right"',
        default: '"bottom"',
        description: "Placement side.",
      },
    ],
    subComponents: [
      {
        name: "HoverCardTrigger",
        description: "Element that triggers the card on hover.",
      },
      { name: "HoverCardContent", description: "Floating card content." },
    ],
    examples: [
      {
        title: "Default",
        description: "Hover over a text link to show a profile preview.",
        demoSlug: "hover-card-demo-default",
      },
      {
        title: "Button trigger",
        description: "Hover over a button to show contextual details.",
        demoSlug: "hover-card-demo-button",
      },
      {
        title: "Inline message",
        description: "Status messages with icons that reveal details on hover.",
        demoSlug: "hover-card-demo-inline-message",
      },
      {
        title: "Placement",
        description: "Right-side placement.",
        demoSlug: "hover-card-demo-placement",
      },
      {
        title: "Sides",
        description: "Hover card on different sides.",
        demoSlug: "hover-card-demo-sides",
      },
    ],
  },

  sheet: {
    description:
      "A side panel component built on Base UI Dialog that slides in from any edge of the screen.",
    usage: `import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

<Sheet>
  <SheetTrigger><Button>Open</Button></SheetTrigger>
  <SheetContent>
    <SheetHeader><SheetTitle>Title</SheetTitle></SheetHeader>
    <p>Content</p>
  </SheetContent>
</Sheet>`,
    props: [
      {
        name: "side",
        type: '"top" | "right" | "bottom" | "left"',
        default: '"right"',
        description: "Side the sheet slides in from.",
      },
      {
        name: "showCloseButton",
        type: "boolean",
        default: "true",
        description: "Show close button.",
      },
    ],
    subComponents: [
      { name: "SheetTrigger", description: "Element that opens the sheet." },
      { name: "SheetContent", description: "The sliding panel container." },
      { name: "SheetHeader", description: "Header section." },
      { name: "SheetTitle", description: "Title text." },
      { name: "SheetDescription", description: "Description text." },
      { name: "SheetFooter", description: "Footer section." },
      { name: "SheetClose", description: "Close button." },
    ],
    examples: [
      {
        title: "Default",
        description: "Right-side sheet.",
        demoSlug: "sheet-demo-default",
      },
      {
        title: "Left",
        description: "Left-side sheet.",
        demoSlug: "sheet-demo-left",
      },
      {
        title: "Top",
        description: "Top-edge sheet.",
        demoSlug: "sheet-demo-top",
      },
      { title: "No close button", demoSlug: "sheet-demo-no-close" },
      {
        title: "No close button (alt)",
        demoSlug: "sheet-demo-no-close-button",
      },
      {
        title: "Sides",
        description: "Sheet opening from all four sides.",
        demoSlug: "sheet-demo-sides",
      },
      {
        title: "With form",
        description: "Sheet containing a form.",
        demoSlug: "sheet-demo-with-form",
      },
    ],
  },

  drawer: {
    description:
      "A draggable drawer component built on Vaul with swipe-to-dismiss and direction support.",
    usage: `import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";

<Drawer>
  <DrawerTrigger><Button>Open</Button></DrawerTrigger>
  <DrawerContent>
    <DrawerHeader><DrawerTitle>Title</DrawerTitle></DrawerHeader>
  </DrawerContent>
</Drawer>`,
    props: [
      {
        name: "direction",
        type: '"top" | "right" | "bottom" | "left"',
        default: '"bottom"',
        description: "Direction the drawer opens from.",
      },
    ],
    subComponents: [
      { name: "DrawerTrigger", description: "Element that opens the drawer." },
      { name: "DrawerContent", description: "The drawer container." },
      { name: "DrawerHeader", description: "Header section." },
      { name: "DrawerTitle", description: "Title text." },
      { name: "DrawerDescription", description: "Description text." },
      { name: "DrawerFooter", description: "Footer section." },
      { name: "DrawerClose", description: "Close button." },
    ],
    examples: [
      {
        title: "Default",
        description: "Bottom drawer with close button.",
        demoSlug: "drawer-demo-default",
      },
      {
        title: "With form",
        description: "Drawer containing a form.",
        demoSlug: "drawer-demo-with-form",
      },
      {
        title: "Right",
        description: "Right-side drawer.",
        demoSlug: "drawer-demo-right",
      },
      {
        title: "Scrollable content",
        description: "Drawer with scrollable overflow content.",
        demoSlug: "drawer-demo-scrollable-content",
      },
      {
        title: "Sides",
        description: "Drawer opening from all four sides.",
        demoSlug: "drawer-demo-sides",
      },
    ],
  },

  collapsible: {
    description:
      "A collapsible content section built on Base UI Collapsible with animated expand/collapse.",
    usage: `import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

<Collapsible>
  <CollapsibleTrigger><Button>Toggle</Button></CollapsibleTrigger>
  <CollapsibleContent>Hidden content</CollapsibleContent>
</Collapsible>`,
    props: [
      {
        name: "defaultOpen",
        type: "boolean",
        description: "Initially open state.",
      },
      { name: "open", type: "boolean", description: "Controlled open state." },
      {
        name: "onOpenChange",
        type: "(open: boolean) => void",
        description: "Callback when open state changes.",
      },
    ],
    subComponents: [
      {
        name: "CollapsibleTrigger",
        description: "Element that toggles the content.",
      },
      { name: "CollapsibleContent", description: "The collapsible panel." },
    ],
    examples: [
      { title: "Default", demoSlug: "collapsible-demo-default" },
      {
        title: "Open",
        description: "Initially open.",
        demoSlug: "collapsible-demo-open",
      },
      {
        title: "Styled",
        description: "Styled with borders and multiple items.",
        demoSlug: "collapsible-demo-styled",
      },
      {
        title: "File tree",
        description: "Nested collapsible file tree explorer.",
        demoSlug: "collapsible-demo-file-tree",
      },
      {
        title: "Settings",
        description: "Collapsible settings panel with form fields.",
        demoSlug: "collapsible-demo-settings",
      },
    ],
  },

  breadcrumb: {
    description:
      "A navigation breadcrumb component with semantic HTML, slash separators, label slots, and ellipsis support for deep paths.",
    adsUrl: "https://atlassian.design/components/breadcrumbs",
    usage: `import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem,
  BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Current</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`,
    subComponents: [
      {
        name: "BreadcrumbList",
        description: "Ordered list container for items.",
      },
      { name: "BreadcrumbItem", description: "Individual breadcrumb entry." },
      {
        name: "BreadcrumbLabel",
        description: "Composable label wrapper with before and after slots.",
      },
      { name: "BreadcrumbLink", description: "Clickable navigation link." },
      {
        name: "BreadcrumbPage",
        description: "Current page indicator (non-clickable).",
      },
      {
        name: "BreadcrumbSeparator",
        description: "Visual separator between items.",
      },
      {
        name: "BreadcrumbEllipsis",
        description: "Ellipsis for truncated paths.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Basic breadcrumb with links.",
        demoSlug: "breadcrumb-demo-default",
      },
      {
        title: "Ellipsis",
        description: "Truncated path with ellipsis.",
        demoSlug: "breadcrumb-demo-ellipsis",
      },
      {
        title: "Custom separator",
        description: "Custom separator character.",
        demoSlug: "breadcrumb-demo-custom-separator",
      },
      { title: "Basic", demoSlug: "breadcrumb-demo-basic" },
      {
        title: "With label slots",
        description: "Breadcrumb labels with icons, tiles, and icon tiles.",
        demoSlug: "breadcrumb-demo-with-slots",
      },
      {
        title: "With dropdown",
        description: "Breadcrumb with dropdown for hidden items.",
        demoSlug: "breadcrumb-demo-with-dropdown",
      },
      {
        title: "With link",
        description: "Breadcrumb with clickable links.",
        demoSlug: "breadcrumb-demo-with-link",
      },
    ],
  },

  pagination: {
    description:
      "A pagination component with previous/next navigation, page links, and ellipsis for large datasets.",
    usage: `import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis,
} from "@/components/ui/pagination";

<Pagination>
  <PaginationContent>
    <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
    <PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem>
    <PaginationItem><PaginationLink href="#" isActive>2</PaginationLink></PaginationItem>
    <PaginationItem><PaginationNext href="#" /></PaginationItem>
  </PaginationContent>
</Pagination>`,
    props: [
      {
        name: "isActive",
        type: "boolean",
        description: "Marks the page link as active (on PaginationLink).",
      },
    ],
    subComponents: [
      {
        name: "PaginationContent",
        description: "Container for pagination items.",
      },
      {
        name: "PaginationItem",
        description: "Wrapper for each pagination element.",
      },
      { name: "PaginationLink", description: "Page number link." },
      { name: "PaginationPrevious", description: "Previous page button." },
      { name: "PaginationNext", description: "Next page button." },
      {
        name: "PaginationEllipsis",
        description: "Ellipsis for skipped pages.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Basic pagination with pages.",
        demoSlug: "pagination-demo-default",
      },
      {
        title: "With ellipsis",
        description: "Pagination with skipped page ranges.",
        demoSlug: "pagination-demo-with-ellipsis",
      },
      {
        title: "Simple",
        description: "Previous and next only.",
        demoSlug: "pagination-demo-simple",
      },
      { title: "Basic", demoSlug: "pagination-demo-basic" },
      {
        title: "With select",
        description: "Pagination with page size select.",
        demoSlug: "pagination-demo-with-select",
      },
    ],
  },

  accordion: {
    description:
      "A collapsible content panel component built on Base UI Accordion with animated expand/collapse transitions.",
    usage: `import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

<Accordion defaultValue={["item-1"]}>
  <AccordionItem value="item-1">
    <AccordionTrigger>Section 1</AccordionTrigger>
    <AccordionContent>Content 1</AccordionContent>
  </AccordionItem>
</Accordion>`,
    props: [
      {
        name: "defaultValue",
        type: "string[]",
        description: "Initially expanded item values.",
      },
      {
        name: "value",
        type: "string[]",
        description: "Controlled expanded item values.",
      },
      {
        name: "multiple",
        type: "boolean",
        description: "Allow multiple items open simultaneously.",
      },
    ],
    subComponents: [
      { name: "AccordionItem", description: "Individual collapsible section." },
      {
        name: "AccordionTrigger",
        description: "Button that toggles the section.",
      },
      { name: "AccordionContent", description: "Collapsible content panel." },
    ],
    examples: [
      {
        title: "Default",
        description: "Single-selection accordion.",
        demoSlug: "accordion-demo-default",
      },
      {
        title: "Open",
        description: "Initially expanded item.",
        demoSlug: "accordion-demo-open",
      },
      {
        title: "Multiple",
        description: "Multiple items open at once.",
        demoSlug: "accordion-demo-multiple",
      },
      { title: "Basic", demoSlug: "accordion-demo-basic" },
      {
        title: "In card",
        description: "Accordion inside a card container.",
        demoSlug: "accordion-demo-in-card",
      },
      {
        title: "With borders",
        description: "Accordion with visible borders.",
        demoSlug: "accordion-demo-with-borders",
      },
      {
        title: "With disabled",
        description: "Accordion with disabled items.",
        demoSlug: "accordion-demo-with-disabled",
      },
    ],
  },

  separator: {
    description:
      "A visual divider component built on Base UI Separator with horizontal and vertical orientations.",
    usage: `import { Separator } from "@/components/ui/separator";

<Separator />
<Separator orientation="vertical" />`,
    props: [
      {
        name: "orientation",
        type: '"horizontal" | "vertical"',
        default: '"horizontal"',
        description: "Direction of the separator.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Horizontal separator.",
        demoSlug: "separator-demo-default",
      },
      {
        title: "Vertical",
        description: "Vertical separator.",
        demoSlug: "separator-demo-vertical",
      },
      {
        title: "Horizontal",
        description: "Horizontal separator between content blocks.",
        demoSlug: "separator-demo-horizontal",
      },
      {
        title: "In list",
        description: "Separator between list items.",
        demoSlug: "separator-demo-in-list",
      },
      {
        title: "Vertical menu",
        description: "Vertical separator between menu items.",
        demoSlug: "separator-demo-vertical-menu",
      },
    ],
  },

  "navigation-menu": {
    description:
      "A horizontal navigation menu component built on Base UI NavigationMenu with dropdown content panels and animated indicators.",
    usage: `import {
  NavigationMenu, NavigationMenuList, NavigationMenuItem,
  NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink,
} from "@/components/ui/navigation-menu";

<NavigationMenu>
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Getting Started</NavigationMenuTrigger>
      <NavigationMenuContent>Content here</NavigationMenuContent>
    </NavigationMenuItem>
    <NavigationMenuItem>
      <NavigationMenuLink href="/docs">Docs</NavigationMenuLink>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>`,
    subComponents: [
      { name: "NavigationMenuList", description: "Container for menu items." },
      { name: "NavigationMenuItem", description: "Individual menu entry." },
      {
        name: "NavigationMenuTrigger",
        description: "Button that opens content panel.",
      },
      { name: "NavigationMenuContent", description: "Dropdown content panel." },
      { name: "NavigationMenuLink", description: "Direct navigation link." },
      {
        name: "NavigationMenuIndicator",
        description: "Visual indicator for active item.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Navigation menu with links.",
        demoSlug: "navigation-menu-demo-default",
      },
      {
        title: "With trigger",
        description: "Menu with dropdown content panel.",
        demoSlug: "navigation-menu-demo-with-trigger",
      },
      { title: "Basic", demoSlug: "navigation-menu-demo-basic" },
    ],
  },

  progress: {
    description:
      "Horizontal progress bar with track, indicator, label, and value. Built on Base UI Progress. Maps to @atlaskit/progress-bar.",
    adsUrl: "https://atlassian.design/components/progress-bar",
    usage: `import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";

<Progress value={60} />

<Progress value={100} variant="success">
  <ProgressLabel>Complete</ProgressLabel>
  <ProgressValue />
</Progress>`,
    props: [
      {
        name: "value",
        type: "number",
        description: "Current progress value (0-100).",
      },
      {
        name: "variant",
        type: '"default" | "success" | "inverse" | "transparent"',
        default: '"default"',
        description:
          "Visual variant. Default uses neutral bold, success uses green, inverse uses white, transparent hides the track.",
      },
      {
        name: "isIndeterminate",
        type: "boolean",
        default: "false",
        description: "Show indeterminate sliding animation.",
      },
    ],
    subComponents: [
      { name: "ProgressTrack", description: "Background track element." },
      {
        name: "ProgressIndicator",
        description: "Filled indicator showing progress.",
      },
      {
        name: "ProgressLabel",
        description: "Text label for the progress bar.",
      },
      {
        name: "ProgressValue",
        description: "Displays the current percentage.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Progress bar at 60%.",
        demoSlug: "progress-demo-default",
      },
      {
        title: "Variants",
        description: "All visual variants.",
        demoSlug: "progress-demo-variants",
      },
      {
        title: "Success progress bar",
        description: "Green indicator for completed or positive progress.",
        demoSlug: "progress-demo-success",
      },
      {
        title: "Transparent progress bar",
        description: "Progress bar with no visible track background.",
        demoSlug: "progress-demo-transparent",
      },
      {
        title: "Indeterminate",
        description: "Sliding animation for unknown progress.",
        demoSlug: "progress-demo-indeterminate",
      },
      {
        title: "With label",
        description: "Progress with label and value.",
        demoSlug: "progress-demo-with-label",
      },
      {
        title: "Controlled",
        description: "Controlled progress with slider.",
        demoSlug: "progress-demo-controlled",
      },
      {
        title: "File upload list",
        description: "Progress bars in a file upload list.",
        demoSlug: "progress-demo-file-upload-list",
      },
      {
        title: "Zero",
        description: "Empty progress bar.",
        demoSlug: "progress-demo-zero",
      },
    ],
  },

  "progress-rovo": {
    description:
      "Thin horizontal progress bar with a Rovo rainbow gradient for indeterminate and determinate states. Transitions to solid green on completion. Uses Motion for React animations.",
    usage: `import { ProgressRovo } from "@/components/ui-custom/progress-rovo";

<ProgressRovo isIndeterminate />        {/* indeterminate — continuous animation */}
<ProgressRovo value={65} />             {/* determinate — 65% filled */}
<ProgressRovo value={100} />            {/* completed — solid green */}`,
    props: [
      {
        name: "value",
        type: "number | null",
        description: "Progress value (0-100). Only used in determinate mode. Values >= 100 show the completed state.",
      },
      {
        name: "isIndeterminate",
        type: "boolean",
        default: "false",
        description: "When true, animates continually without regard to progress. The value prop is ignored.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Indeterminate rainbow sliding animation.",
        demoSlug: "progress-rovo-demo-default",
      },
      {
        title: "Completed",
        description: "Solid green bar at 100%.",
        demoSlug: "progress-rovo-demo-completed",
      },
      {
        title: "Determinate",
        description: "Rainbow gradient at fixed progress values.",
        demoSlug: "progress-rovo-demo-determinate",
      },
      {
        title: "Controlled",
        description: "Interactive slider to control progress value.",
        demoSlug: "progress-rovo-demo-controlled",
      },
      {
        title: "Transition",
        description: "Toggle between indeterminate and completed states.",
        demoSlug: "progress-rovo-demo-transition",
      },
    ],
  },

  "progress-circle": {
    description:
      "Circular SVG progress indicator with percentage text, indeterminate spinner, and completed check icon states. Useful for inline progress indicators in task lists and status displays.",
    usage: `import { ProgressCircle } from "@/components/ui-custom/progress-circle";

<ProgressCircle value={65} />
<ProgressCircle />                       {/* indeterminate / spinning */}
<ProgressCircle value={100} />           {/* completed / check icon */}
<ProgressCircle variant="filled" value={65} /> {/* filled pie-wedge style */}`,
    props: [
      {
        name: "value",
        type: "number | null",
        description:
          "Progress value from 0 to 100. Pass null or omit for indeterminate (spinning) state. At 100, renders a check icon.",
      },
      {
        name: "variant",
        type: '"outline" | "filled"',
        default: '"outline"',
        description: "Visual style — outline shows a stroke ring, filled shows a solid pie-wedge arc.",
      },
      {
        name: "size",
        type: '"sm" | "default" | "lg"',
        default: '"default"',
        description: "Size of the circle — 16px, 24px, or 32px. Override with className for custom sizes.",
      },
      {
        name: "status",
        type: '"error" | "info"',
        description:
          "Replaces the progress ring with a status icon. Error shows a danger diamond, info shows an information circle.",
      },
      {
        name: "label",
        type: "string",
        default: '"Progress"',
        description: "Accessible label for the progress indicator.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "A single circle at 65% progress.",
        demoSlug: "progress-circle-demo-default",
      },
      {
        title: "Indeterminate",
        description: "Spinning state when value is not provided.",
        demoSlug: "progress-circle-demo-indeterminate",
      },
      {
        title: "Values",
        description: "Progression from 0% through 100% (complete).",
        demoSlug: "progress-circle-demo-values",
      },
      {
        title: "Complete",
        description: "At 100%, renders a check icon instead of the ring.",
        demoSlug: "progress-circle-demo-complete",
      },
      {
        title: "Sizes",
        description: "Small, default, and large size variants.",
        demoSlug: "progress-circle-demo-sizes",
      },
      {
        title: "Controlled",
        description: "Interactive progress with a slider control.",
        demoSlug: "progress-circle-demo-controlled",
      },
      {
        title: "Filled",
        description: "Filled pie-wedge style from indeterminate through 100%.",
        demoSlug: "progress-circle-demo-filled",
      },
      {
        title: "Filled Controlled",
        description: "Interactive filled progress with a slider control.",
        demoSlug: "progress-circle-demo-filled-controlled",
      },
      {
        title: "Status",
        description: "Error and info status icons for steps that can't be completed.",
        demoSlug: "progress-circle-demo-status",
      },
    ],
  },

  spinner: {
    description:
      "A loading spinner component using Lucide's Loader2 icon with continuous rotation animation.",
    adsUrl: "https://atlassian.design/components/spinner",
    usage: `import { Spinner } from "@/components/ui/spinner";

<Spinner />
<Spinner className="size-8" />`,
    props: [
      {
        name: "className",
        type: "string",
        description: "Additional CSS classes for sizing.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "spinner-demo-default" },
      {
        title: "Sizes",
        description: "Different spinner sizes.",
        demoSlug: "spinner-demo-sizes",
      },
      { title: "Basic", demoSlug: "spinner-demo-basic" },
      {
        title: "In badges",
        description: "Spinner inside badge components.",
        demoSlug: "spinner-demo-in-badges",
      },
      {
        title: "In buttons",
        description: "Spinner inside button components.",
        demoSlug: "spinner-demo-in-buttons",
      },
      {
        title: "In empty state",
        description: "Spinner in an empty state layout.",
        demoSlug: "spinner-demo-in-empty-state",
      },
      {
        title: "In input group",
        description: "Spinner inside an input group.",
        demoSlug: "spinner-demo-in-input-group",
      },
    ],
  },

  avatar: {
    description:
      "An avatar component built on Base UI with image, fallback, unassigned person and agent states, badge, presence, and status indicators in 6 sizes (xs through 2xl) and 3 shapes (circle, square, hexagon).",
    adsUrl: "https://atlassian.design/components/avatar",
    adsLinks: [
      {
        label: "@atlaskit/avatar",
        url: "https://atlassian.design/components/avatar",
      },
      {
        label: "@atlaskit/avatar-group",
        url: "https://atlassian.design/components/avatar-group",
      },
    ],
    usage: `import { Avatar, AvatarImage, AvatarFallback, AvatarUnassigned } from "@/components/ui/avatar";

<Avatar>
  <AvatarImage src="/avatar-user/nova/color/asow-service-yellow.png" alt="User" />
  <AvatarFallback>CN</AvatarFallback>
</Avatar>

<AvatarUnassigned kind="agent" />`,
    props: [
      {
        name: "size",
        type: '"xs" | "sm" | "default" | "lg" | "xl" | "2xl"',
        default: '"default"',
        description: "Size of the avatar.",
      },
      {
        name: "shape",
        type: '"circle" | "square" | "hexagon"',
        default: '"circle"',
        description:
          "Shape of the avatar. Use circle for users, square for teams/projects, hexagon for agents.",
      },
      {
        name: "disabled",
        type: "boolean",
        default: "false",
        description:
          "Applies disabled styling (reduced opacity and grayscale).",
      },
    ],
    subComponents: [
      { name: "AvatarImage", description: "Profile image element." },
      {
        name: "AvatarFallback",
        description: "Fallback content when image fails.",
      },
      {
        name: "AvatarUnassigned",
        description: "Grey unassigned avatar state for people and agents.",
        props: [
          {
            name: "kind",
            type: '"person" | "agent"',
            default: '"person"',
            description:
              "Unassigned avatar kind. Person renders a circle with a person icon; agent renders a hexagon with an agent icon.",
          },
        ],
      },
      { name: "AvatarBadge", description: "Status badge overlay." },
      {
        name: "AvatarPresenceIndicator",
        description: "Presence indicator (online, busy, focus, offline).",
      },
      {
        name: "AvatarStatusIndicator",
        description: "Status indicator (approved, declined, locked).",
      },
      { name: "AvatarGroup", description: "Overlapping group of avatars." },
      {
        name: "AvatarGroupCount",
        description: "Count indicator for remaining avatars.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Avatar with image and fallback.",
        demoSlug: "avatar-demo-default",
      },
      {
        title: "Shapes",
        description: "Circle, square, and hexagon shapes.",
        demoSlug: "avatar-demo-shapes",
      },
      {
        title: "Unassigned",
        description: "Grey person and agent placeholder states.",
        demoSlug: "avatar-demo-unassigned",
      },
      {
        title: "All sizes",
        description: "All 6 sizes from xs to 2xl.",
        demoSlug: "avatar-demo-all-sizes",
      },
      {
        title: "Sizes",
        description: "Small, default, and large avatars.",
        demoSlug: "avatar-demo-sizes",
      },
      {
        title: "Presence",
        description: "Online, busy, focus, and offline presence indicators.",
        demoSlug: "avatar-demo-presence",
      },
      {
        title: "Status",
        description: "Approved, declined, and locked status indicators.",
        demoSlug: "avatar-demo-status",
      },
      {
        title: "Disabled",
        description: "Disabled state across all shapes.",
        demoSlug: "avatar-demo-disabled",
      },
      {
        title: "Group",
        description: "Overlapping avatar group with count.",
        demoSlug: "avatar-demo-group",
      },
      {
        title: "Badge with icon",
        description: "Avatar with icon-based status badge.",
        demoSlug: "avatar-demo-badge-with-icon",
      },
      {
        title: "Badge",
        description: "Avatar with status badge overlay.",
        demoSlug: "avatar-demo-badge",
      },
      {
        title: "Group with count",
        description: "Avatar group with numeric count indicator.",
        demoSlug: "avatar-demo-group-with-count",
      },
      {
        title: "Group with icon count",
        description: "Avatar group with icon-based count.",
        demoSlug: "avatar-demo-group-with-icon-count",
      },
      {
        title: "In empty",
        description: "Avatar inside an empty state component.",
        demoSlug: "avatar-demo-in-empty",
      },
    ],
  },

  card: {
    description:
      "A container component with header, content, footer, and action slots using a data-slot layout system.",
    usage: `import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>`,
    props: [
      {
        name: "size",
        type: '"default" | "sm"',
        default: '"default"',
        description: "Size variant of the card.",
      },
    ],
    subComponents: [
      { name: "CardHeader", description: "Top section with title and action." },
      { name: "CardTitle", description: "Primary heading." },
      { name: "CardDescription", description: "Secondary text." },
      { name: "CardAction", description: "Action element in header." },
      { name: "CardContent", description: "Main content area." },
      {
        name: "CardFooter",
        description: "Bottom section with muted background.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Card with header, content, and footer.",
        demoSlug: "card-demo-default",
      },
      {
        title: "Small",
        description: "Compact card size.",
        demoSlug: "card-demo-small",
      },
      {
        title: "With action",
        description: "Card with action button in header.",
        demoSlug: "card-demo-with-action",
      },
      {
        title: "Simple",
        description: "Minimal card with content only.",
        demoSlug: "card-demo-simple",
      },
      {
        title: "Default size",
        description: "Card in default size variant.",
        demoSlug: "card-demo-default-size",
      },
      {
        title: "Footer with border (small)",
        description: "Small card with bordered footer.",
        demoSlug: "card-demo-footer-with-border-small",
      },
      {
        title: "Footer with border",
        description: "Card with bordered footer.",
        demoSlug: "card-demo-footer-with-border",
      },
      {
        title: "Header with border (small)",
        description: "Small card with bordered header.",
        demoSlug: "card-demo-header-with-border-small",
      },
      {
        title: "Header with border",
        description: "Card with bordered header.",
        demoSlug: "card-demo-header-with-border",
      },
      {
        title: "Login",
        description: "Card styled as a login form.",
        demoSlug: "card-demo-login",
      },
      {
        title: "Meeting notes",
        description: "Card styled for meeting notes.",
        demoSlug: "card-demo-meeting-notes",
      },
      {
        title: "Small size",
        description: "Card in small size variant.",
        demoSlug: "card-demo-small-size",
      },
      {
        title: "With image (small)",
        description: "Small card with image.",
        demoSlug: "card-demo-with-image-small",
      },
      {
        title: "With image",
        description: "Card with full-width image.",
        demoSlug: "card-demo-with-image",
      },
    ],
  },

  table: {
    description:
      "A semantic HTML table component with styled header, body, footer, rows, and cells for data display.",
    adsUrl: "https://atlassian.design/components/dynamic-table",
    usage: `import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John</TableCell>
      <TableCell>john@example.com</TableCell>
    </TableRow>
  </TableBody>
</Table>`,
    subComponents: [
      { name: "TableHeader", description: "Table header section." },
      { name: "TableBody", description: "Table body section." },
      { name: "TableFooter", description: "Table footer section." },
      { name: "TableRow", description: "Individual table row." },
      { name: "TableHead", description: "Header cell." },
      { name: "TableCell", description: "Body cell." },
      { name: "TableCaption", description: "Table caption for accessibility." },
    ],
    examples: [
      {
        title: "Default",
        description: "Basic data table.",
        demoSlug: "table-demo-default",
      },
      {
        title: "With caption",
        description: "Table with accessibility caption.",
        demoSlug: "table-demo-with-caption",
      },
      {
        title: "With footer",
        description: "Table with totals footer.",
        demoSlug: "table-demo-with-footer",
      },
      { title: "Basic", demoSlug: "table-demo-basic" },
      {
        title: "Simple",
        description: "Simple minimal table.",
        demoSlug: "table-demo-simple",
      },
      {
        title: "With actions",
        description: "Table rows with action buttons.",
        demoSlug: "table-demo-with-actions",
      },
      {
        title: "With badges",
        description: "Table cells with badge indicators.",
        demoSlug: "table-demo-with-badges",
      },
      {
        title: "With input",
        description: "Table cells with editable inputs.",
        demoSlug: "table-demo-with-input",
      },
      {
        title: "With select",
        description: "Table cells with select dropdowns.",
        demoSlug: "table-demo-with-select",
      },
      {
        title: "Striped",
        description: "Alternating row backgrounds for readability.",
        demoSlug: "table-demo-striped",
      },
      {
        title: "Row highlight",
        description: "Highlighted and selected rows.",
        demoSlug: "table-demo-row-highlight",
      },
    ],
  },

  skeleton: {
    description:
      "A placeholder loading component with pulse animation for content that is still loading.",
    usage: `import { Skeleton } from "@/components/ui/skeleton";

<Skeleton className="h-4 w-48" />
<Skeleton className="h-12 w-12 rounded-full" />`,
    props: [
      {
        name: "className",
        type: "string",
        description: "CSS classes for sizing and shape.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Basic skeleton shapes.",
        demoSlug: "skeleton-demo-default",
      },
      {
        title: "Card",
        description: "Card-shaped skeleton layout.",
        demoSlug: "skeleton-demo-card",
      },
      {
        title: "List",
        description: "List-item skeleton layout.",
        demoSlug: "skeleton-demo-list",
      },
      {
        title: "Avatar",
        description: "Avatar-shaped skeleton.",
        demoSlug: "skeleton-demo-avatar",
      },
      {
        title: "Form",
        description: "Form skeleton layout.",
        demoSlug: "skeleton-demo-form",
      },
      {
        title: "Table",
        description: "Table skeleton layout.",
        demoSlug: "skeleton-demo-table",
      },
      {
        title: "Text",
        description: "Text paragraph skeleton.",
        demoSlug: "skeleton-demo-text",
      },
    ],
  },

  empty: {
    description:
      "An empty state component with header, media, title, description, and action slots for zero-data scenarios. Maps to @atlaskit/empty-state.",
    adsUrl: "https://atlassian.design/components/empty-state",
    usage: `import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia, EmptyContent } from "@/components/ui/empty";

<Empty>
  <EmptyHeader>
    <EmptyMedia variant="icon"><SearchIcon label="" /></EmptyMedia>
    <EmptyTitle>No results found</EmptyTitle>
    <EmptyDescription>Try adjusting your search.</EmptyDescription>
  </EmptyHeader>
  <EmptyContent>
    <Button>Create new</Button>
  </EmptyContent>
</Empty>`,
    props: [
      {
        name: "width",
        type: `"wide" | "narrow"`,
        description:
          "Controls max-width. Wide (464px, default) or narrow (304px).",
      },
    ],
    subComponents: [
      { name: "EmptyHeader", description: "Top section with media and text." },
      {
        name: "EmptyMedia",
        description:
          'Icon or image slot. Use variant="icon" for icon backgrounds.',
      },
      {
        name: "EmptyTitle",
        description:
          'Primary heading (h4). Accepts headingSize: "medium" (default) or "xsmall".',
      },
      { name: "EmptyDescription", description: "Secondary description text." },
      {
        name: "EmptyContent",
        description: "Action area for buttons and links.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Basic empty state with heading and description.",
        demoSlug: "empty-demo-default",
      },
      {
        title: "With primary action",
        description: "Empty state with a call-to-action button.",
        demoSlug: "empty-demo-with-action",
      },
      {
        title: "With primary and secondary actions",
        description: "Empty state with two action buttons.",
        demoSlug: "empty-demo-with-actions",
      },
      {
        title: "With image",
        description: "Empty state with an illustration image.",
        demoSlug: "empty-demo-with-image",
      },
      {
        title: "With icon",
        description: "Empty state with icon media.",
        demoSlug: "empty-demo-with-icon",
      },
      {
        title: "Narrow width",
        description: "Empty state in narrow width mode for compact contexts.",
        demoSlug: "empty-demo-narrow",
      },
      {
        title: "Compact heading",
        description: "Empty state with xsmall heading size for popups.",
        demoSlug: "empty-demo-compact",
      },
      {
        title: "With tertiary action",
        description: "Empty state with a link-style tertiary action.",
        demoSlug: "empty-demo-with-tertiary",
      },
    ],
  },

  kbd: {
    description:
      "A keyboard key display component for showing keyboard shortcuts with optional grouping.",
    usage: `import { Kbd, KbdGroup } from "@/components/ui/kbd";

<Kbd>⌘</Kbd>
<KbdGroup><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup>`,
    subComponents: [
      {
        name: "KbdGroup",
        description: "Container for grouping multiple keys.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Single keyboard keys.",
        demoSlug: "kbd-demo-default",
      },
      {
        title: "Group",
        description: "Grouped keyboard shortcut.",
        demoSlug: "kbd-demo-group",
      },
      {
        title: "Arrow keys",
        description: "Arrow key representations.",
        demoSlug: "kbd-demo-arrow-keys",
      },
      { title: "Basic", demoSlug: "kbd-demo-basic" },
      {
        title: "Input group",
        description: "Kbd inside an input group.",
        demoSlug: "kbd-demo-input-group",
      },
      {
        title: "Kbd group",
        description: "Multiple grouped key combinations.",
        demoSlug: "kbd-demo-kbd-group",
      },
      {
        title: "Modifier keys",
        description: "Modifier key representations.",
        demoSlug: "kbd-demo-modifier-keys",
      },
      {
        title: "Tooltip",
        description: "Kbd inside a tooltip.",
        demoSlug: "kbd-demo-tooltip",
      },
      {
        title: "With icons and text",
        description: "Kbd with icons and text labels.",
        demoSlug: "kbd-demo-with-icons-and-text",
      },
      {
        title: "With icons",
        description: "Kbd with icon representations.",
        demoSlug: "kbd-demo-with-icons",
      },
      {
        title: "With samp",
        description: "Kbd with samp element for output.",
        demoSlug: "kbd-demo-with-samp",
      },
    ],
  },

  item: {
    description:
      "A flexible list item component with media, content, title, description, and action slots in multiple variants and sizes.",
    usage: `import { Item, ItemMedia, ItemContent, ItemTitle, ItemDescription } from "@/components/ui/item";

<Item>
  <ItemMedia variant="icon"><UserIcon label="" /></ItemMedia>
  <ItemContent>
    <ItemTitle>Title</ItemTitle>
    <ItemDescription>Description</ItemDescription>
  </ItemContent>
</Item>`,
    props: [
      {
        name: "variant",
        type: '"default" | "outline" | "muted"',
        default: '"default"',
        description: "Visual style variant.",
      },
      {
        name: "size",
        type: '"default" | "sm" | "xs"',
        default: '"default"',
        description: "Size of the item.",
      },
    ],
    subComponents: [
      {
        name: "ItemMedia",
        description: "Media slot (icon, image, or default).",
      },
      { name: "ItemContent", description: "Main text content area." },
      { name: "ItemTitle", description: "Primary title text." },
      { name: "ItemDescription", description: "Secondary description text." },
      { name: "ItemActions", description: "Action buttons area." },
      { name: "ItemHeader", description: "Header section." },
      { name: "ItemFooter", description: "Footer section." },
      { name: "ItemGroup", description: "List container with role=list." },
      { name: "ItemSeparator", description: "Visual separator between items." },
    ],
    examples: [
      {
        title: "Default",
        description: "Basic item with title.",
        demoSlug: "item-demo-default",
      },
      {
        title: "With description",
        description: "Item with title and description.",
        demoSlug: "item-demo-with-description",
      },
      {
        title: "With media",
        description: "Item with icon media slot.",
        demoSlug: "item-demo-with-media",
      },
      {
        title: "As child",
        description: "Item rendered via asChild pattern.",
        demoSlug: "item-demo-as-child",
      },
      {
        title: "Default item media image",
        description: "Item with default media image slot.",
        demoSlug: "item-demo-default-item-media-image",
      },
      {
        title: "Extra small",
        description: "Extra small size item.",
        demoSlug: "item-demo-extra-small",
      },
      {
        title: "Item footer",
        description: "Item with footer content.",
        demoSlug: "item-demo-item-footer",
      },
      {
        title: "Item group",
        description: "Group of items in a list.",
        demoSlug: "item-demo-item-group",
      },
      {
        title: "Item header and footer",
        description: "Item with header and footer sections.",
        demoSlug: "item-demo-item-header-item-footer",
      },
      {
        title: "Item header",
        description: "Item with header content.",
        demoSlug: "item-demo-item-header",
      },
      {
        title: "Item separator",
        description: "Items separated by dividers.",
        demoSlug: "item-demo-item-separator",
      },
      {
        title: "Muted as child",
        description: "Muted variant with asChild pattern.",
        demoSlug: "item-demo-muted-as-child",
      },
      {
        title: "Muted extra small",
        description: "Muted variant in extra small size.",
        demoSlug: "item-demo-muted-extra-small",
      },
      {
        title: "Muted item group",
        description: "Muted variant in a group.",
        demoSlug: "item-demo-muted-item-group",
      },
      {
        title: "Muted item media image",
        description: "Muted variant with media image.",
        demoSlug: "item-demo-muted-item-media-image",
      },
      {
        title: "Muted small",
        description: "Muted variant in small size.",
        demoSlug: "item-demo-muted-small",
      },
      {
        title: "Muted",
        description: "Muted variant item.",
        demoSlug: "item-demo-muted",
      },
      {
        title: "Outline as child",
        description: "Outline variant with asChild pattern.",
        demoSlug: "item-demo-outline-as-child",
      },
      {
        title: "Outline extra small",
        description: "Outline variant in extra small size.",
        demoSlug: "item-demo-outline-extra-small",
      },
      {
        title: "Outline item group",
        description: "Outline variant in a group.",
        demoSlug: "item-demo-outline-item-group",
      },
      {
        title: "Outline item media image (extra small)",
        description: "Outline variant with media image in extra small.",
        demoSlug: "item-demo-outline-item-media-image-extra-small",
      },
      {
        title: "Outline item media image (small)",
        description: "Outline variant with media image in small.",
        demoSlug: "item-demo-outline-item-media-image-small",
      },
      {
        title: "Outline item media image",
        description: "Outline variant with media image.",
        demoSlug: "item-demo-outline-item-media-image",
      },
      {
        title: "Outline small",
        description: "Outline variant in small size.",
        demoSlug: "item-demo-outline-small",
      },
      {
        title: "Outline",
        description: "Outline variant item.",
        demoSlug: "item-demo-outline",
      },
      {
        title: "Small",
        description: "Small size item.",
        demoSlug: "item-demo-small",
      },
    ],
  },

  "dropdown-menu": {
    description:
      "An ADS-aligned dropdown menu built on Base UI Menu with item descriptions, element slots, checkbox/radio selections, placement controls, and optional non-portal rendering.",
    adsUrl: "https://atlassian.design/components/dropdown-menu",
    usage: `import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

<DropdownMenu>
  <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
    Open
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Settings</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`,
    props: [
      {
        name: "variant",
        type: '"default" | "destructive"',
        default: '"default"',
        description: "Visual variant of menu items.",
      },
      {
        name: "inset",
        type: "boolean",
        description: "Adds left padding for icon alignment.",
      },
      {
        name: "elemBefore",
        type: "ReactNode",
        description: "Element before item text.",
      },
      {
        name: "elemAfter",
        type: "ReactNode",
        description: "Element after item text.",
      },
      {
        name: "description",
        type: "string",
        description: "Secondary supporting text for menu items.",
      },
      {
        name: "portalled",
        type: "boolean",
        default: "true",
        description:
          "Render menu content in a portal or inline with the trigger container.",
      },
      {
        name: "side",
        type: '"top" | "right" | "bottom" | "left" | "inline-start" | "inline-end"',
        default: '"bottom"',
        description: "Popup side relative to trigger.",
      },
      {
        name: "align",
        type: '"start" | "center" | "end"',
        default: '"start"',
        description: "Popup alignment on the selected side.",
      },
    ],
    subComponents: [
      {
        name: "DropdownMenuTrigger",
        description: "Element that opens the menu.",
      },
      { name: "DropdownMenuContent", description: "Floating menu container." },
      { name: "DropdownMenuItem", description: "Individual menu item." },
      {
        name: "DropdownMenuCheckboxItem",
        description: "Toggleable checkbox item.",
      },
      { name: "DropdownMenuRadioGroup", description: "Radio group container." },
      { name: "DropdownMenuRadioItem", description: "Radio selection item." },
      { name: "DropdownMenuLabel", description: "Group label." },
      { name: "DropdownMenuSeparator", description: "Visual separator." },
      { name: "DropdownMenuShortcut", description: "Keyboard shortcut text." },
      { name: "DropdownMenuSub", description: "Sub-menu container." },
      {
        name: "DropdownMenuSubTrigger",
        description: "Element that opens sub-menu.",
      },
      { name: "DropdownMenuSubContent", description: "Sub-menu content." },
    ],
    examples: [
      {
        title: "Appearance",
        description: "Default and tall menu appearances.",
        demoSlug: "dropdown-menu-demo-appearance",
      },
      {
        title: "Default",
        description: "Basic dropdown menu.",
        demoSlug: "dropdown-menu-demo-default",
      },
      {
        title: "Density",
        description: "Cozy and compact row densities.",
        demoSlug: "dropdown-menu-demo-density",
      },
      {
        title: "Tall",
        description: "Large viewport-height menu behavior.",
        demoSlug: "dropdown-menu-demo-tall",
      },
      {
        title: "Custom triggers",
        description: "Icon-only and custom trigger elements.",
        demoSlug: "dropdown-menu-demo-custom-triggers",
      },
      {
        title: "Using trigger",
        description: "Simple trigger content usage.",
        demoSlug: "dropdown-menu-demo-using-trigger",
      },
      {
        title: "Nested dropdown menu",
        description: "Sub-menu and nested sub-menu behavior.",
        demoSlug: "dropdown-menu-demo-nested-dropdown-menu",
      },
      {
        title: "States",
        description:
          "Default, hovered, pressed, destructive, and disabled item states.",
        demoSlug: "dropdown-menu-demo-states",
      },
      {
        title: "Loading",
        description: "Loading row treatment inside a menu.",
        demoSlug: "dropdown-menu-demo-loading",
      },
      {
        title: "Open",
        description: "Controlled open state.",
        demoSlug: "dropdown-menu-demo-open",
      },
      {
        title: "Positioning",
        description: "Positioning across different side/alignment settings.",
        demoSlug: "dropdown-menu-demo-positioning",
      },
      {
        title: "Default placement",
        description: "Default popup placement.",
        demoSlug: "dropdown-menu-demo-default-placement",
      },
      {
        title: "Placement",
        description: "Explicit side placement examples.",
        demoSlug: "dropdown-menu-demo-placement",
      },
      {
        title: "Should flip",
        description: "Viewport edge flip behavior.",
        demoSlug: "dropdown-menu-demo-should-flip",
      },
      {
        title: "Z-index",
        description: "Overlay stacking behavior.",
        demoSlug: "dropdown-menu-demo-z-index",
      },
      {
        title: "Content without portal",
        description: "Inline popup rendering with `portalled={false}`.",
        demoSlug: "dropdown-menu-demo-content-without-portal",
      },
      {
        title: "Full width dropdown menu",
        description: "Popup width aligned with trigger width.",
        demoSlug: "dropdown-menu-demo-full-width-dropdown-menu",
      },
      {
        title: "Accessible labels",
        description: "Icon-only triggers with explicit accessible labels.",
        demoSlug: "dropdown-menu-demo-accessible-labels",
      },
      {
        title: "Description",
        description: "Dropdown item with secondary description text.",
        demoSlug: "dropdown-menu-demo-item-description",
      },
      {
        title: "Multiline",
        description: "Dropdown item wrapping across multiple lines.",
        demoSlug: "dropdown-menu-demo-item-multiline",
      },
      {
        title: "States (dropdown item)",
        description: "Dropdown item state styling.",
        demoSlug: "dropdown-menu-demo-item-states",
      },
      {
        title: "Disabled (dropdown item)",
        description: "Disabled dropdown item treatment.",
        demoSlug: "dropdown-menu-demo-item-disabled",
      },
      {
        title: "With elements",
        description: "Dropdown item with leading and trailing elements.",
        demoSlug: "dropdown-menu-demo-item-with-elements",
      },
      {
        title: "Elem before",
        description: "Leading element slot usage.",
        demoSlug: "dropdown-menu-demo-item-elem-before",
      },
      {
        title: "Elem after",
        description: "Trailing element slot usage.",
        demoSlug: "dropdown-menu-demo-item-elem-after",
      },
      {
        title: "Custom component",
        description: "Dropdown item rendered as a custom component.",
        demoSlug: "dropdown-menu-demo-item-custom-component",
      },
      {
        title: "Default selected (checkbox)",
        description: "Checkbox items with uncontrolled default selection.",
        demoSlug: "dropdown-menu-demo-checkbox-default-selected",
      },
      {
        title: "Selected (checkbox)",
        description: "Checkbox items with controlled selection.",
        demoSlug: "dropdown-menu-demo-checkbox-selected",
      },
      {
        title: "Default selected (radio)",
        description: "Radio items with uncontrolled default selection.",
        demoSlug: "dropdown-menu-demo-radio-default-selected",
      },
      {
        title: "Selected (radio)",
        description: "Radio items with controlled selection.",
        demoSlug: "dropdown-menu-demo-radio-selected",
      },
      {
        title: "With Checkbox component",
        description:
          "Dropdown items composed with VPK Checkbox for richer toggle controls.",
        demoSlug: "dropdown-menu-demo-with-checkbox",
      },
      {
        title: "With RadioGroup component",
        description:
          "Dropdown items composed with VPK RadioGroup for richer radio controls.",
        demoSlug: "dropdown-menu-demo-with-radio-group",
      },
    ],
  },

  "context-menu": {
    description:
      "A right-click context menu component built on Base UI ContextMenu with items, groups, separators, and sub-menus.",
    usage: `import {
  ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem,
} from "@/components/ui/context-menu";

<ContextMenu>
  <ContextMenuTrigger>
    <div className="border border-dashed p-8">Right-click here</div>
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Cut</ContextMenuItem>
    <ContextMenuItem>Copy</ContextMenuItem>
    <ContextMenuItem>Paste</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`,
    subComponents: [
      {
        name: "ContextMenuTrigger",
        description: "Area that triggers on right-click.",
      },
      { name: "ContextMenuContent", description: "Floating menu container." },
      { name: "ContextMenuItem", description: "Individual menu item." },
      {
        name: "ContextMenuCheckboxItem",
        description: "Toggleable checkbox item.",
      },
      { name: "ContextMenuRadioGroup", description: "Radio group container." },
      { name: "ContextMenuRadioItem", description: "Radio selection item." },
      { name: "ContextMenuLabel", description: "Group label." },
      { name: "ContextMenuSeparator", description: "Visual separator." },
      { name: "ContextMenuShortcut", description: "Keyboard shortcut text." },
      { name: "ContextMenuSub", description: "Sub-menu container." },
      { name: "ContextMenuSubTrigger", description: "Sub-menu trigger." },
      { name: "ContextMenuSubContent", description: "Sub-menu content." },
    ],
    examples: [
      {
        title: "Default",
        description: "Basic context menu.",
        demoSlug: "context-menu-demo-default",
      },
      {
        title: "With shortcuts",
        description: "Context menu with keyboard shortcuts.",
        demoSlug: "context-menu-demo-with-shortcuts",
      },
      { title: "Basic", demoSlug: "context-menu-demo-basic" },
      {
        title: "In dialog",
        description: "Context menu inside a dialog.",
        demoSlug: "context-menu-demo-in-dialog",
      },
      {
        title: "With checkboxes",
        description: "Context menu with toggleable checkbox items.",
        demoSlug: "context-menu-demo-with-checkboxes",
      },
      {
        title: "With destructive items",
        description: "Context menu with destructive-styled items.",
        demoSlug: "context-menu-demo-with-destructive-items",
      },
      {
        title: "With groups, labels, separators",
        description: "Context menu with organized sections.",
        demoSlug: "context-menu-demo-with-groups-labels-separators",
      },
      {
        title: "With icons",
        description: "Context menu items with leading icons.",
        demoSlug: "context-menu-demo-with-icons",
      },
      {
        title: "With inset",
        description: "Context menu items with inset padding.",
        demoSlug: "context-menu-demo-with-inset",
      },
      {
        title: "With radio group",
        description: "Context menu with radio selection items.",
        demoSlug: "context-menu-demo-with-radio-group",
      },
      {
        title: "With sides",
        description: "Context menu opening on different sides.",
        demoSlug: "context-menu-demo-with-sides",
      },
      {
        title: "With submenu",
        description: "Context menu with nested sub-menu.",
        demoSlug: "context-menu-demo-with-submenu",
      },
    ],
  },

  menubar: {
    description:
      "A horizontal menu bar component composing Base UI Menubar and DropdownMenu for application-level menus.",
    usage: `import {
  Menubar, MenubarMenu, MenubarTrigger, MenubarContent,
  MenubarItem, MenubarSeparator,
} from "@/components/ui/menubar";

<Menubar>
  <MenubarMenu>
    <MenubarTrigger>File</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>New</MenubarItem>
      <MenubarSeparator />
      <MenubarItem>Exit</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`,
    subComponents: [
      { name: "MenubarMenu", description: "Individual menu in the bar." },
      { name: "MenubarTrigger", description: "Button that opens the menu." },
      { name: "MenubarContent", description: "Floating menu content." },
      { name: "MenubarItem", description: "Individual menu item." },
      { name: "MenubarCheckboxItem", description: "Toggleable checkbox item." },
      { name: "MenubarRadioGroup", description: "Radio group container." },
      { name: "MenubarRadioItem", description: "Radio selection item." },
      { name: "MenubarLabel", description: "Group label." },
      { name: "MenubarSeparator", description: "Visual separator." },
      { name: "MenubarShortcut", description: "Keyboard shortcut text." },
      { name: "MenubarSub", description: "Sub-menu container." },
      { name: "MenubarSubTrigger", description: "Sub-menu trigger." },
      { name: "MenubarSubContent", description: "Sub-menu content." },
    ],
    examples: [
      {
        title: "Default",
        description: "Basic menubar with menus.",
        demoSlug: "menubar-demo-default",
      },
      {
        title: "With shortcuts",
        description: "Menubar with keyboard shortcuts.",
        demoSlug: "menubar-demo-with-shortcuts",
      },
      { title: "Basic", demoSlug: "menubar-demo-basic" },
      {
        title: "Destructive",
        description: "Menu items with destructive styling.",
        demoSlug: "menubar-demo-destructive",
      },
      {
        title: "Format",
        description: "Format menu with text formatting options.",
        demoSlug: "menubar-demo-format",
      },
      {
        title: "In dialog",
        description: "Menubar inside a dialog.",
        demoSlug: "menubar-demo-in-dialog",
      },
      {
        title: "Insert",
        description: "Insert menu with various content types.",
        demoSlug: "menubar-demo-insert",
      },
      {
        title: "Sides",
        description: "Menubar opening on different sides.",
        demoSlug: "menubar-demo-sides",
      },
      {
        title: "With checkboxes",
        description: "Menu items with toggleable checkboxes.",
        demoSlug: "menubar-demo-with-checkboxes",
      },
      {
        title: "With icons",
        description: "Menu items with leading icons.",
        demoSlug: "menubar-demo-with-icons",
      },
      {
        title: "With inset",
        description: "Menu items with inset padding.",
        demoSlug: "menubar-demo-with-inset",
      },
      {
        title: "With radio",
        description: "Menu items with radio selection.",
        demoSlug: "menubar-demo-with-radio",
      },
      {
        title: "With submenu",
        description: "Menubar with nested sub-menu.",
        demoSlug: "menubar-demo-with-submenu",
      },
    ],
  },

  command: {
    description:
      "A command palette component built on CMDK with search input, item list, groups, and dialog mode.",
    usage: `import { Command, CommandInput, CommandList, CommandItem, CommandGroup, CommandEmpty } from "@/components/ui/command";

<Command>
  <CommandInput placeholder="Search..." />
  <CommandList>
    <CommandEmpty>No results found.</CommandEmpty>
    <CommandGroup heading="Actions">
      <CommandItem>Search</CommandItem>
      <CommandItem>Settings</CommandItem>
    </CommandGroup>
  </CommandList>
</Command>`,
    subComponents: [
      { name: "CommandDialog", description: "Command palette in a dialog." },
      { name: "CommandInput", description: "Search input field." },
      { name: "CommandList", description: "Scrollable results list." },
      {
        name: "CommandEmpty",
        description: "Empty state when no results match.",
      },
      { name: "CommandGroup", description: "Group of related items." },
      { name: "CommandItem", description: "Individual selectable item." },
      { name: "CommandShortcut", description: "Keyboard shortcut display." },
      {
        name: "CommandSeparator",
        description: "Visual separator between groups.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Basic command palette.",
        demoSlug: "command-demo-default",
      },
      {
        title: "Empty",
        description: "Command with no results state.",
        demoSlug: "command-demo-empty",
      },
      {
        title: "Groups",
        description: "Command with grouped items.",
        demoSlug: "command-demo-groups",
      },
      { title: "Basic", demoSlug: "command-demo-basic" },
      {
        title: "Inline",
        description: "Inline command palette.",
        demoSlug: "command-demo-inline",
      },
      {
        title: "Many groups and items",
        description: "Command with many groups and items.",
        demoSlug: "command-demo-many-groups-and-items",
      },
      {
        title: "With groups",
        description: "Command with labeled groups.",
        demoSlug: "command-demo-with-groups",
      },
      {
        title: "With shortcuts",
        description: "Command items with keyboard shortcuts.",
        demoSlug: "command-demo-with-shortcuts",
      },
    ],
  },

  combobox: {
    description:
      "A searchable select component built on Base UI Combobox with input filtering, chips for multi-select, and grouped items.",
    usage: `import {
  Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem,
} from "@/components/ui/combobox";

<Combobox>
  <ComboboxInput placeholder="Search..." />
  <ComboboxContent>
    <ComboboxList>
      <ComboboxItem value="react">React</ComboboxItem>
      <ComboboxItem value="vue">Vue</ComboboxItem>
    </ComboboxList>
  </ComboboxContent>
</Combobox>`,
    props: [
      {
        name: "showTrigger",
        type: "boolean",
        default: "true",
        description: "Show chevron trigger on input.",
      },
      {
        name: "showClear",
        type: "boolean",
        description: "Show clear button on input.",
      },
    ],
    subComponents: [
      {
        name: "ComboboxInput",
        description: "Search input with trigger and clear.",
      },
      { name: "ComboboxContent", description: "Floating dropdown container." },
      { name: "ComboboxList", description: "Scrollable item list." },
      { name: "ComboboxItem", description: "Individual selectable item." },
      { name: "ComboboxGroup", description: "Group of related items." },
      { name: "ComboboxLabel", description: "Group label." },
      { name: "ComboboxEmpty", description: "Empty state." },
      { name: "ComboboxChips", description: "Multi-select chips container." },
      { name: "ComboboxChip", description: "Individual removable chip." },
    ],
    examples: [
      {
        title: "Default",
        description: "Basic searchable select.",
        demoSlug: "combobox-demo-default",
      },
      {
        title: "Grouped",
        description: "Combobox with grouped items.",
        demoSlug: "combobox-demo-grouped",
      },
      { title: "Basic", demoSlug: "combobox-demo-basic" },
      {
        title: "Disabled items",
        description: "Combobox with disabled items.",
        demoSlug: "combobox-demo-disabled-items",
      },
      {
        title: "Disabled",
        description: "Disabled combobox.",
        demoSlug: "combobox-demo-disabled",
      },
      {
        title: "Form with combobox",
        description: "Combobox inside a form.",
        demoSlug: "combobox-demo-form-with-combobox",
      },
      {
        title: "In dialog",
        description: "Combobox inside a dialog.",
        demoSlug: "combobox-demo-in-dialog",
      },
      {
        title: "In popup",
        description: "Combobox inside a popup.",
        demoSlug: "combobox-demo-in-popup",
      },
      {
        title: "Invalid",
        description: "Combobox in invalid/error state.",
        demoSlug: "combobox-demo-invalid",
      },
      {
        title: "Large list",
        description: "Combobox with many options.",
        demoSlug: "combobox-demo-large-list",
      },
      {
        title: "Multiple disabled",
        description: "Multi-select combobox in disabled state.",
        demoSlug: "combobox-demo-multiple-disabled",
      },
      {
        title: "Multiple invalid",
        description: "Multi-select combobox in invalid state.",
        demoSlug: "combobox-demo-multiple-invalid",
      },
      {
        title: "Multiple no remove",
        description: "Multi-select without chip removal.",
        demoSlug: "combobox-demo-multiple-no-remove",
      },
      {
        title: "Multiple",
        description: "Multi-select combobox with chips.",
        demoSlug: "combobox-demo-multiple",
      },
      {
        title: "Sides",
        description: "Combobox opening on different sides.",
        demoSlug: "combobox-demo-sides",
      },
      {
        title: "With auto highlight",
        description: "Combobox with auto-highlighted first item.",
        demoSlug: "combobox-demo-with-auto-highlight",
      },
      {
        title: "With clear button",
        description: "Combobox with a clear button.",
        demoSlug: "combobox-demo-with-clear-button",
      },
      {
        title: "With custom item rendering",
        description: "Combobox with custom-rendered items.",
        demoSlug: "combobox-demo-with-custom-item-rendering",
      },
      {
        title: "With groups and separator",
        description: "Combobox with groups and separators.",
        demoSlug: "combobox-demo-with-groups-and-separator",
      },
      {
        title: "With groups",
        description: "Combobox with labeled groups.",
        demoSlug: "combobox-demo-with-groups",
      },
      {
        title: "With icon addon",
        description: "Combobox with icon addon.",
        demoSlug: "combobox-demo-with-icon-addon",
      },
      {
        title: "With other inputs",
        description: "Combobox combined with other inputs.",
        demoSlug: "combobox-demo-with-other-inputs",
      },
    ],
  },

  "input-group": {
    adsUrl: "https://atlassian.design/components/textfield",
    description:
      "A wrapper component that combines an input or textarea with addons and buttons for composite form controls.",
    usage: `import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from "@/components/ui/input-group";
import SearchIcon from "@atlaskit/icon/core/search";

<InputGroup>
  <InputGroupAddon><SearchIcon label="" /></InputGroupAddon>
  <InputGroupInput placeholder="Search..." />
</InputGroup>`,
    props: [
      {
        name: "align",
        type: '"inline-start" | "inline-end" | "block-start" | "block-end"',
        description: "Addon placement position (on InputGroupAddon).",
      },
      {
        name: "size",
        type: '"xs" | "sm" | "icon-xs" | "icon-sm"',
        description: "Button size variant (on InputGroupButton).",
      },
    ],
    subComponents: [
      { name: "InputGroupInput", description: "Borderless input element." },
      {
        name: "InputGroupTextarea",
        description: "Borderless textarea element.",
      },
      {
        name: "InputGroupAddon",
        description: "Non-interactive addon (icon, text, etc.).",
      },
      { name: "InputGroupButton", description: "Interactive button addon." },
      { name: "InputGroupText", description: "Text addon." },
    ],
    examples: [
      {
        title: "Default",
        description: "Input with search icon addon.",
        demoSlug: "input-group-demo-default",
      },
      {
        title: "Prefix",
        description: "Input with text prefix addon.",
        demoSlug: "input-group-demo-prefix",
      },
      {
        title: "With button",
        description: "Input with action button.",
        demoSlug: "input-group-demo-button",
      },
      {
        title: "Textarea",
        description: "Textarea with addon.",
        demoSlug: "input-group-demo-textarea",
      },
      { title: "Basic", demoSlug: "input-group-demo-basic" },
      {
        title: "In card",
        description: "Input group inside a card.",
        demoSlug: "input-group-demo-in-card",
      },
      {
        title: "With addons",
        description: "Input group with multiple addons.",
        demoSlug: "input-group-demo-with-addons",
      },
      {
        title: "With buttons",
        description: "Input group with multiple buttons.",
        demoSlug: "input-group-demo-with-buttons",
      },
      {
        title: "With kbd",
        description: "Input group with keyboard shortcut indicator.",
        demoSlug: "input-group-demo-with-kbd",
      },
      {
        title: "With tooltip, dropdown, popover",
        description: "Input group with tooltip, dropdown, and popover.",
        demoSlug: "input-group-demo-with-tooltip-dropdown-popover",
      },
    ],
  },

  "aspect-ratio": {
    description:
      "A utility component that maintains a specified aspect ratio for its child content.",
    usage: `import { AspectRatio } from "@/components/ui/aspect-ratio";

<AspectRatio ratio={16 / 9}>
  <img src="/illustration/rich-icon/design/standard.png" alt="Photo" className="h-full w-full object-cover" />
</AspectRatio>`,
    props: [
      {
        name: "ratio",
        type: "number",
        required: true,
        description: "Aspect ratio to maintain (e.g., 16/9, 4/3, 1).",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "16:9 aspect ratio.",
        demoSlug: "aspect-ratio-demo-default",
      },
      {
        title: "Square",
        description: "1:1 square aspect ratio.",
        demoSlug: "aspect-ratio-demo-square",
      },
      {
        title: "16:9",
        description: "16:9 widescreen ratio.",
        demoSlug: "aspect-ratio-demo-16x9",
      },
      {
        title: "1:1",
        description: "1:1 square ratio.",
        demoSlug: "aspect-ratio-demo-1x1",
      },
      {
        title: "21:9",
        description: "21:9 ultrawide ratio.",
        demoSlug: "aspect-ratio-demo-21x9",
      },
      {
        title: "9:16",
        description: "9:16 portrait ratio.",
        demoSlug: "aspect-ratio-demo-9x16",
      },
    ],
  },

  "scroll-area": {
    description:
      "A scrollable area component built on Base UI ScrollArea with custom styled scrollbars.",
    usage: `import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

<ScrollArea className="h-48 w-48 rounded-md border">
  <div className="p-4">Scrollable content</div>
</ScrollArea>`,
    props: [
      {
        name: "orientation",
        type: '"vertical" | "horizontal"',
        default: '"vertical"',
        description: "Scrollbar orientation (on ScrollBar).",
      },
    ],
    subComponents: [
      { name: "ScrollBar", description: "Custom styled scrollbar element." },
    ],
    examples: [
      {
        title: "Default",
        description: "Vertical scrollable list.",
        demoSlug: "scroll-area-demo-default",
      },
      {
        title: "Horizontal",
        description: "Horizontal scroll with scrollbar.",
        demoSlug: "scroll-area-demo-horizontal",
      },
      {
        title: "Vertical",
        description: "Vertical scroll with scrollbar.",
        demoSlug: "scroll-area-demo-vertical",
      },
    ],
  },

  resizable: {
    description:
      "A draggable panel resize system built on react-resizable-panels with configurable orientations and visible handles.",
    usage: `import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

<ResizablePanelGroup orientation="horizontal">
  <ResizablePanel defaultSize={50}>Left</ResizablePanel>
  <ResizableHandle />
  <ResizablePanel defaultSize={50}>Right</ResizablePanel>
</ResizablePanelGroup>`,
    props: [
      {
        name: "orientation",
        type: '"horizontal" | "vertical"',
        default: '"horizontal"',
        description: "Panel layout direction (on ResizablePanelGroup).",
      },
      {
        name: "withHandle",
        type: "boolean",
        description: "Show visible drag handle (on ResizableHandle).",
      },
      {
        name: "defaultSize",
        type: "number",
        description: "Initial size percentage (on ResizablePanel).",
      },
    ],
    subComponents: [
      { name: "ResizablePanel", description: "Individual resizable panel." },
      { name: "ResizableHandle", description: "Drag handle between panels." },
    ],
    examples: [
      {
        title: "Default",
        description: "Horizontal resizable panels.",
        demoSlug: "resizable-demo-default",
      },
      {
        title: "Vertical",
        description: "Vertical resizable panels with handle.",
        demoSlug: "resizable-demo-vertical",
      },
      {
        title: "With handle",
        description: "Three panels with visible handles.",
        demoSlug: "resizable-demo-with-handle",
      },
      {
        title: "Controlled",
        description: "Resizable panels with controlled sizes.",
        demoSlug: "resizable-demo-controlled",
      },
      {
        title: "Horizontal",
        description: "Horizontal panel layout.",
        demoSlug: "resizable-demo-horizontal",
      },
      {
        title: "Nested",
        description: "Nested resizable panel groups.",
        demoSlug: "resizable-demo-nested",
      },
    ],
  },

  direction: {
    description:
      "A provider component for RTL/LTR direction support, wrapping Base UI's DirectionProvider.",
    usage: `import { DirectionProvider } from "@/components/ui/direction";

<DirectionProvider direction="rtl">
  <div>Right-to-left content</div>
</DirectionProvider>`,
    props: [
      {
        name: "direction",
        type: '"ltr" | "rtl"',
        description: "Text direction.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Left-to-right direction.",
        demoSlug: "direction-demo-default",
      },
      {
        title: "RTL",
        description: "Right-to-left direction.",
        demoSlug: "direction-demo-rtl",
      },
    ],
  },

  "button-group": {
    adsUrl: "https://atlassian.design/components/button/button-group",
    description:
      'A group container for related buttons. Use variant="connected" (default) for toolbar-style merged borders, or variant="separated" for ADS-style spaced layout with 4px gaps.',
    usage: `import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

<ButtonGroup>
  <Button variant="outline">Left</Button>
  <Button variant="outline">Center</Button>
  <Button variant="outline">Right</Button>
</ButtonGroup>

<ButtonGroup variant="separated">
  <Button>Save</Button>
  <Button variant="destructive">Delete</Button>
  <Button variant="ghost">Cancel</Button>
</ButtonGroup>`,
    props: [
      {
        name: "variant",
        type: '"connected" | "separated"',
        default: '"connected"',
        description:
          "Connected merges borders between children. Separated adds 4px gap (ADS style).",
      },
      {
        name: "orientation",
        type: '"horizontal" | "vertical"',
        default: '"horizontal"',
        description: "Layout direction.",
      },
    ],
    subComponents: [
      {
        name: "ButtonGroupText",
        description: "Inline text display with icon support.",
      },
      {
        name: "ButtonGroupSeparator",
        description: "Visual separator for split buttons.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Horizontal button group.",
        demoSlug: "button-group-demo-default",
      },
      {
        title: "Separated",
        description: "ADS-style separated buttons with gap.",
        demoSlug: "button-group-demo-separated",
      },
      {
        title: "Separated outline",
        description: "Separated outline buttons.",
        demoSlug: "button-group-demo-separated-outline",
      },
      {
        title: "Variants",
        description: "Connected vs separated side by side.",
        demoSlug: "button-group-demo-variants",
      },
      {
        title: "Vertical",
        description: "Vertical button group.",
        demoSlug: "button-group-demo-vertical",
      },
      {
        title: "With separator",
        description: "Split button with separator.",
        demoSlug: "button-group-demo-with-separator",
      },
      { title: "Basic", demoSlug: "button-group-demo-basic" },
      {
        title: "Navigation",
        description: "Button group as navigation tabs.",
        demoSlug: "button-group-demo-navigation",
      },
      {
        title: "Nested",
        description: "Nested button groups.",
        demoSlug: "button-group-demo-nested",
      },
      {
        title: "Pagination split",
        description: "Split button group for pagination.",
        demoSlug: "button-group-demo-pagination-split",
      },
      {
        title: "Pagination",
        description: "Button group as pagination controls.",
        demoSlug: "button-group-demo-pagination",
      },
      {
        title: "Text alignment",
        description: "Button group with text alignment options.",
        demoSlug: "button-group-demo-text-alignment",
      },
      {
        title: "Vertical icons",
        description: "Vertical button group with icons.",
        demoSlug: "button-group-demo-vertical-icons",
      },
      {
        title: "Vertical nested",
        description: "Vertical nested button groups.",
        demoSlug: "button-group-demo-vertical-nested",
      },
      {
        title: "With dropdown",
        description: "Button group with dropdown menu.",
        demoSlug: "button-group-demo-with-dropdown",
      },
      {
        title: "With fields",
        description: "Button group with form fields.",
        demoSlug: "button-group-demo-with-fields",
      },
      {
        title: "With icons",
        description: "Button group with icon buttons.",
        demoSlug: "button-group-demo-with-icons",
      },
      {
        title: "With input group",
        description: "Button group with input group.",
        demoSlug: "button-group-demo-with-input-group",
      },
      {
        title: "With input",
        description: "Button group with input.",
        demoSlug: "button-group-demo-with-input",
      },
      {
        title: "With like",
        description: "Button group as like/reaction.",
        demoSlug: "button-group-demo-with-like",
      },
      {
        title: "With select and input",
        description: "Button group with select and input.",
        demoSlug: "button-group-demo-with-select-and-input",
      },
      {
        title: "With select",
        description: "Button group with select.",
        demoSlug: "button-group-demo-with-select",
      },
      {
        title: "With text",
        description: "Button group with text display.",
        demoSlug: "button-group-demo-with-text",
      },
    ],
  },

  alert: {
    description:
      "Contextual message bar for informational, warning, success, destructive, and announcement states. Maps to @atlaskit/section-message.",
    adsUrl: "https://atlassian.design/components/section-message",
    usage: `import { Alert, AlertAction, AlertTitle, AlertDescription } from "@/components/ui/alert";
import WarningIcon from "@atlaskit/icon/core/status-warning";
import { Icon } from "@/components/ui/icon";

<Alert variant="warning">
  <Icon render={<WarningIcon label="" />} label="Warning" />
  <AlertTitle>Your license is about to expire</AlertTitle>
  <AlertDescription>Renew before March 1 to avoid service interruption.</AlertDescription>
  <AlertAction>
    <a href="#">Renew</a>
  </AlertAction>
</Alert>`,
    props: [
      {
        name: "variant",
        type: '"default" | "info" | "warning" | "success" | "discovery" | "danger" | "error" | "announcement" | "destructive"',
        default: '"default"',
        description:
          "Visual style variant (`default` maps to information, and `destructive` is kept as an alias for backward compatibility).",
      },
    ],
    subComponents: [
      { name: "AlertTitle", description: "Primary heading text." },
      { name: "AlertDescription", description: "Secondary description text." },
      {
        name: "AlertAction",
        description: "Inline action row rendered below alert content.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Information alert style (ADS default appearance).",
        demoSlug: "alert-demo-default",
      },
      { title: "Info", demoSlug: "alert-demo-info" },
      { title: "Warning", demoSlug: "alert-demo-warning" },
      { title: "Success", demoSlug: "alert-demo-success" },
      { title: "Danger", demoSlug: "alert-demo-danger" },
      { title: "Discovery", demoSlug: "alert-demo-discovery" },
      { title: "Error", demoSlug: "alert-demo-error" },
      { title: "Announcement", demoSlug: "alert-demo-announcement" },
      {
        title: "Compound",
        description: "Alert with title, description, and action.",
        demoSlug: "alert-demo-compound",
      },
      {
        title: "All variants",
        description: "All alert variant types side by side.",
        demoSlug: "alert-demo-appearances",
      },
      {
        title: "Destructive alias",
        description: "Backward-compatible alias for destructive state.",
        demoSlug: "alert-demo-destructive",
      },
      {
        title: "With action",
        description: "Alert with action link.",
        demoSlug: "alert-demo-with-action",
      },
      { title: "Basic", demoSlug: "alert-demo-basic" },
      {
        title: "With actions",
        description: "Alert with multiple action links.",
        demoSlug: "alert-demo-with-actions",
      },
      {
        title: "With icons",
        description: "Alerts with status icons.",
        demoSlug: "alert-demo-with-icons",
      },
    ],
  },

  slider: {
    description:
      "A range slider component built on Base UI Slider with single and multi-thumb support. Maps to @atlaskit/range.",
    adsUrl: "https://atlassian.design/components/range",
    usage: `import { Slider } from "@/components/ui/slider";

<Slider defaultValue={[50]} max={100} />
<Slider defaultValue={[25, 75]} max={100} />`,
    props: [
      {
        name: "defaultValue",
        type: "number[]",
        description: "Initial slider value(s).",
      },
      {
        name: "value",
        type: "number[]",
        description: "Controlled slider value(s).",
      },
      {
        name: "min",
        type: "number",
        default: "0",
        description: "Minimum value.",
      },
      {
        name: "max",
        type: "number",
        default: "100",
        description: "Maximum value.",
      },
      { name: "disabled", type: "boolean", description: "Disable the slider." },
    ],
    examples: [
      {
        title: "Default",
        description: "Single-thumb slider.",
        demoSlug: "slider-demo-default",
      },
      {
        title: "Range",
        description: "Two-thumb range slider.",
        demoSlug: "slider-demo-range",
      },
      {
        title: "Disabled",
        description: "Disabled slider.",
        demoSlug: "slider-demo-disabled",
      },
      { title: "Basic", demoSlug: "slider-demo-basic" },
      {
        title: "Controlled",
        description: "Controlled slider with state management.",
        demoSlug: "slider-demo-controlled",
      },
      {
        title: "Multiple thumbs",
        description: "Slider with multiple thumbs.",
        demoSlug: "slider-demo-multiple-thumbs",
      },
      {
        title: "Vertical",
        description: "Vertically-oriented slider.",
        demoSlug: "slider-demo-vertical",
      },
    ],
  },

  calendar: {
    adsUrl: "https://atlassian.design/components/calendar",
    description:
      "A date picker calendar component built on react-day-picker with comprehensive theme support and selection modes.",
    usage: `import { Calendar } from "@/components/ui/calendar";

<Calendar mode="single" selected={date} onSelect={setDate} />`,
    props: [
      {
        name: "mode",
        type: '"single" | "range" | "multiple"',
        description: "Selection mode.",
      },
      {
        name: "selected",
        type: "Date | DateRange | Date[]",
        description: "Selected date(s).",
      },
      {
        name: "onSelect",
        type: "function",
        description: "Selection change callback.",
      },
      {
        name: "numberOfMonths",
        type: "number",
        description: "Number of months to display.",
      },
      {
        name: "buttonVariant",
        type: "string",
        description: "Button variant for navigation controls.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Calendar with selected date.",
        demoSlug: "calendar-demo-default",
      },
      {
        title: "Range",
        description: "Date range selection with two months.",
        demoSlug: "calendar-demo-range",
      },
      {
        title: "Booked dates",
        description: "Calendar with booked/unavailable dates.",
        demoSlug: "calendar-demo-booked-dates",
      },
      {
        title: "Custom days",
        description: "Calendar with custom day rendering.",
        demoSlug: "calendar-demo-custom-days",
      },
      {
        title: "Date picker range",
        description: "Date picker with range selection.",
        demoSlug: "calendar-demo-date-picker-range",
      },
      {
        title: "Date picker simple",
        description: "Simple date picker.",
        demoSlug: "calendar-demo-date-picker-simple",
      },
      {
        title: "Date picker with dropdowns",
        description: "Date picker with month/year dropdowns.",
        demoSlug: "calendar-demo-date-picker-with-dropdowns",
      },
      {
        title: "In card",
        description: "Calendar inside a card.",
        demoSlug: "calendar-demo-in-card",
      },
      {
        title: "In popover",
        description: "Calendar inside a popover.",
        demoSlug: "calendar-demo-in-popover",
      },
      {
        title: "Multiple",
        description: "Calendar with multiple date selection.",
        demoSlug: "calendar-demo-multiple",
      },
      {
        title: "Range multi month",
        description: "Range selection across two months.",
        demoSlug: "calendar-demo-range-multi-month",
      },
      {
        title: "Range multiple months",
        description: "Range selection across multiple months.",
        demoSlug: "calendar-demo-range-multiple-months",
      },
      {
        title: "Single",
        description: "Single date selection mode.",
        demoSlug: "calendar-demo-single",
      },
      {
        title: "Week numbers",
        description: "Calendar with week numbers.",
        demoSlug: "calendar-demo-week-numbers",
      },
      {
        title: "With presets",
        description: "Calendar with preset date options.",
        demoSlug: "calendar-demo-with-presets",
      },
      {
        title: "With time",
        description: "Calendar with time picker.",
        demoSlug: "calendar-demo-with-time",
      },
    ],
  },

  carousel: {
    description:
      "A carousel component built on embla-carousel-react with horizontal/vertical orientations and navigation controls.",
    usage: `import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";

<Carousel>
  <CarouselContent>
    <CarouselItem>Slide 1</CarouselItem>
    <CarouselItem>Slide 2</CarouselItem>
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`,
    props: [
      {
        name: "orientation",
        type: '"horizontal" | "vertical"',
        default: '"horizontal"',
        description: "Carousel scroll direction.",
      },
      { name: "opts", type: "object", description: "Embla carousel options." },
      {
        name: "plugins",
        type: "array",
        description: "Embla carousel plugins.",
      },
    ],
    subComponents: [
      {
        name: "CarouselContent",
        description: "Scrollable container for slides.",
      },
      { name: "CarouselItem", description: "Individual slide." },
      { name: "CarouselPrevious", description: "Previous slide button." },
      { name: "CarouselNext", description: "Next slide button." },
    ],
    examples: [
      {
        title: "Default",
        description: "Basic horizontal carousel.",
        demoSlug: "carousel-demo-default",
      },
      {
        title: "Sizes",
        description: "Multiple visible slides.",
        demoSlug: "carousel-demo-sizes",
      },
      {
        title: "Vertical",
        description: "Vertical carousel.",
        demoSlug: "carousel-demo-vertical",
      },
      { title: "Basic", demoSlug: "carousel-demo-basic" },
      {
        title: "Multiple",
        description: "Carousel with multiple visible slides.",
        demoSlug: "carousel-demo-multiple",
      },
      {
        title: "With gap",
        description: "Carousel with spacing between slides.",
        demoSlug: "carousel-demo-with-gap",
      },
    ],
  },

  chart: {
    description:
      "A chart container component that wraps recharts with theme-aware colors, tooltip, and legend support.",
    usage: `import { Bar, BarChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const config = {
  value: { label: "Value", color: "var(--color-chart-1)" },
} satisfies ChartConfig;

<ChartContainer config={config}>
  <BarChart data={data}>
    <ChartTooltip content={<ChartTooltipContent />} />
    <Bar dataKey="value" fill="var(--color-value)" />
  </BarChart>
</ChartContainer>`,
    props: [
      {
        name: "config",
        type: "ChartConfig",
        required: true,
        description:
          "Chart configuration mapping data keys to labels and colors.",
      },
    ],
    subComponents: [
      { name: "ChartTooltip", description: "Tooltip wrapper for recharts." },
      { name: "ChartTooltipContent", description: "Styled tooltip content." },
      { name: "ChartLegend", description: "Legend wrapper for recharts." },
      { name: "ChartLegendContent", description: "Styled legend content." },
    ],
    examples: [
      {
        title: "Default",
        description: "Bar chart with tooltip.",
        demoSlug: "chart-demo-default",
      },
      {
        title: "With legend",
        description: "Multi-series chart with legend.",
        demoSlug: "chart-demo-with-legend",
      },
      {
        title: "Area chart",
        description: "Area chart with gradient fill.",
        demoSlug: "chart-demo-area-chart",
      },
      {
        title: "Bar chart",
        description: "Grouped bar chart with multiple series.",
        demoSlug: "chart-demo-bar-chart",
      },
      {
        title: "Line chart",
        description: "Multi-line chart.",
        demoSlug: "chart-demo-line-chart",
      },
      {
        title: "Radar chart",
        description: "Radar chart with multiple series.",
        demoSlug: "chart-demo-radar-chart",
      },
      {
        title: "Radial chart",
        description: "Radial bar chart with center label.",
        demoSlug: "chart-demo-radial-chart",
      },
    ],
  },

  sidebar: {
    description:
      "A comprehensive sidebar navigation component with multiple variants, collapsible modes, mobile adaptation, and rich menu system.",
    usage: `import {
  SidebarProvider, Sidebar, SidebarContent, SidebarGroup,
  SidebarGroupLabel, SidebarMenu, SidebarMenuItem,
  SidebarMenuButton, SidebarTrigger, SidebarInset,
} from "@/components/ui/sidebar";

<SidebarProvider>
  <Sidebar>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Menu</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>Home</SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
  <SidebarInset>Main content</SidebarInset>
</SidebarProvider>`,
    props: [
      {
        name: "variant",
        type: '"sidebar" | "floating" | "inset"',
        default: '"sidebar"',
        description: "Visual style of the sidebar.",
      },
      {
        name: "collapsible",
        type: '"offcanvas" | "icon" | "none"',
        default: '"offcanvas"',
        description: "Collapse behavior.",
      },
      {
        name: "side",
        type: '"left" | "right"',
        default: '"left"',
        description: "Sidebar position.",
      },
      {
        name: "defaultOpen",
        type: "boolean",
        default: "true",
        description: "Initial open state (on SidebarProvider).",
      },
    ],
    subComponents: [
      {
        name: "SidebarProvider",
        description: "Context provider for sidebar state.",
      },
      { name: "SidebarTrigger", description: "Toggle button for sidebar." },
      { name: "SidebarContent", description: "Scrollable content area." },
      { name: "SidebarHeader", description: "Top section." },
      { name: "SidebarFooter", description: "Bottom section." },
      { name: "SidebarGroup", description: "Group container." },
      { name: "SidebarGroupLabel", description: "Group heading." },
      { name: "SidebarMenu", description: "Menu list container." },
      { name: "SidebarMenuItem", description: "Individual menu entry." },
      {
        name: "SidebarMenuButton",
        description: "Clickable menu button with tooltip support.",
      },
      {
        name: "SidebarInset",
        description: "Main content area alongside sidebar.",
      },
      { name: "SidebarRail", description: "Thin toggle rail." },
    ],
    examples: [
      {
        title: "Default",
        description: "Full sidebar with menu items.",
        demoSlug: "sidebar-demo-default",
      },
      {
        title: "Collapsed",
        description: "Icon-only collapsed sidebar.",
        demoSlug: "sidebar-demo-collapsed",
      },
    ],
  },

  "sidebar-nav-item": {
    description:
      "A compact side navigation item with disclosure icons, selected and focus states, trailing actions, and optional numeric metadata.",
    adsUrl: "https://atlassian.design/components/navigation-system/side-nav-items",
    adsLinks: [
      {
        label: "Side nav items",
        url: "https://atlassian.design/components/navigation-system/side-nav-items",
      },
      {
        label: "Badge",
        url: "https://atlassian.design/components/badge/",
      },
      {
        label: "Icon button",
        url: "https://atlassian.design/components/button/icon-button/",
      },
    ],
    importStatement:
      'import { SidebarNavItem, SidebarNavItemAction, SidebarNavItemCount } from "@/components/ui-custom/sidebar-nav-item";',
    usage: `import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import { SidebarNavItem, SidebarNavItemAction, SidebarNavItemCount } from "@/components/ui-custom/sidebar-nav-item";

<div className="w-[276px]">
  <SidebarNavItem
    label="Artifacts"
    leading={<ChevronRightIcon label="" size="small" />}
    meta={<SidebarNavItemCount>25</SidebarNavItemCount>}
    actions={
      <SidebarNavItemAction aria-label="Open artifacts">
        <ShowMoreHorizontalIcon label="" size="small" />
      </SidebarNavItemAction>
    }
  />
</div>`,
    props: [
      {
        name: "label",
        type: "React.ReactNode",
        required: true,
        description: "Primary row label.",
      },
      {
        name: "leading",
        type: "React.ReactNode",
        description: "Optional leading visual, typically a 12px chevron or 16px product icon.",
      },
      {
        name: "leadingSize",
        type: '"small" | "medium"',
        default: '"small"',
        description: "Size contract for the leading icon slot. Use `medium` for 16px product icons.",
      },
      {
        name: "meta",
        type: "React.ReactNode",
        description: "Optional trailing metadata slot, typically a count badge.",
      },
      {
        name: "actions",
        type: "React.ReactNode",
        description: "Optional trailing action area. Keep action buttons separately labelled for accessibility.",
      },
      {
        name: "isSelected",
        type: "boolean",
        default: "false",
        description: "Applies the selected background, text color, and left notch.",
      },
      {
        name: "isExpanded",
        type: "boolean",
        description: "Mirrors disclosure state via `aria-expanded` on the primary action.",
      },
      {
        name: "interactionState",
        type: '"rest" | "hovered" | "focus-visible"',
        default: '"rest"',
        description: "Preview override for docs and static mocks.",
      },
      {
        name: "onClick",
        type: "(event: React.MouseEvent<HTMLButtonElement>) => void",
        description: "Click handler for the primary label area.",
      },
      {
        name: "disabled",
        type: "boolean",
        default: "false",
        description: "Disables the primary action and dims the row.",
      },
    ],
    subComponents: [
      {
        name: "SidebarNavItemAction",
        description: "24px ghost icon button for trailing actions.",
      },
      {
        name: "SidebarNavItemCount",
        description: "Neutral 16px count badge tuned for sidebar metadata.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Collapsed disclosure row with a single trailing action.",
        demoSlug: "sidebar-nav-item-demo-default",
      },
      {
        title: "Expanded",
        description: "Expanded disclosure row with add and drill-in actions.",
        demoSlug: "sidebar-nav-item-demo-expanded",
      },
      {
        title: "Hovered",
        description: "Hovered state from the Figma reference.",
        demoSlug: "sidebar-nav-item-demo-hovered",
      },
      {
        title: "Selected",
        description: "Selected state with left notch and selected icon/text colors.",
        demoSlug: "sidebar-nav-item-demo-selected",
      },
      {
        title: "Focus visible",
        description: "Focused state with the 2px ADS-style focus ring.",
        demoSlug: "sidebar-nav-item-demo-focus-visible",
      },
      {
        title: "With count",
        description: "Trailing neutral count badge plus action slot.",
        demoSlug: "sidebar-nav-item-demo-with-count",
      },
      {
        title: "Project icon",
        description: "Leading 16px project icon with the same count treatment.",
        demoSlug: "sidebar-nav-item-demo-project-count",
      },
      {
        title: "With description",
        description: "Secondary description text below the label, useful for metadata like timestamps.",
        demoSlug: "sidebar-nav-item-demo-with-description",
      },
      {
        title: "Nested levels",
        description: "Nested items use 12px left indentation per level.",
        demoSlug: "sidebar-nav-item-demo-nested-levels",
      },
    ],
  },

  sonner: {
    description:
      "A headless toast notification component wrapping Sonner with fully custom JSX. Maps to ADS Flag for transient notifications with auto-dismiss, actions, and semantic variants.",
    adsUrl: "https://atlassian.design/components/flag",
    usage: `import { toast } from "sonner";
import { SonnerToast, Toaster } from "@/components/ui/sonner";

// In layout/page:
<Toaster />

// To trigger:
toast.custom((id) => (
  <SonnerToast
    appearance="success"
    title="Saved!"
    dismissible
    onDismiss={() => toast.dismiss(id)}
  />
));

toast.custom((id) => (
  <SonnerToast
    appearance="warning"
    title="This action cannot be undone."
    action={{ label: "Undo", onClick: () => {} }}
    dismissible
    onDismiss={() => toast.dismiss(id)}
  />
), { duration: 10000 });`,
    examples: [
      {
        title: "Default",
        description: "Basic toast notification.",
        demoSlug: "sonner-demo-default",
      },
      {
        title: "Variants",
        description: "Success, error, warning, and info toasts.",
        demoSlug: "sonner-demo-variants",
      },
      {
        title: "With description",
        description: "Toast with description text.",
        demoSlug: "sonner-demo-with-description",
      },
      {
        title: "With action",
        description: "Toast with action button (like ADS Flag actions).",
        demoSlug: "sonner-demo-with-action",
      },
      {
        title: "Auto-dismiss",
        description: "Custom auto-dismiss duration (like ADS AutoDismissFlag).",
        demoSlug: "sonner-demo-auto-dismiss",
      },
      {
        title: "Promise",
        description: "Async toast with loading, success, and error states.",
        demoSlug: "sonner-demo-promise",
      },
      {
        title: "With close button",
        description: "Toast with explicit close button.",
        demoSlug: "sonner-demo-close-button",
      },
      {
        title: "Long title",
        description: "Toast with long title text, close button, and action.",
        demoSlug: "sonner-demo-long-title",
      },
    ],
  },

  forms: {
    description:
      "TanStack Form examples using VPK field primitives, validation, arrays, and complex multi-control forms.",
    adsUrl: "https://atlassian.design/components/form/examples",
    usage: `import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters."),
});

const form = useForm({
  defaultValues: { username: "" },
  validators: { onSubmit: schema },
  onSubmit: async ({ value }) => {
    console.log(value);
  },
});

<form onSubmit={(event) => { event.preventDefault(); form.handleSubmit(); }}>
  <form.Field name="username">
    {(field) => {
      const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
      return (
        <Field data-invalid={isInvalid}>
          <FieldLabel htmlFor="username">Username</FieldLabel>
          <Input
            id="username"
            name={field.name}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            aria-invalid={isInvalid}
          />
          {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
        </Field>
      );
    }}
  </form.Field>
  <Button type="submit">Save</Button>
</form>`,
    props: [
      {
        name: "className",
        type: "string",
        description: "Additional CSS classes.",
      },
    ],
    examples: [
      {
        title: "ADS Basic Form",
        description:
          "Mapped from the ADS basic form pattern with required fields and terms acceptance.",
        demoSlug: "forms-demo-ads-basic",
      },
      {
        title: "ADS Field Validation",
        description:
          "Single field validation pattern aligned with ADS form guidance.",
        demoSlug: "forms-demo-ads-validation",
      },
      {
        title: "ADS Disabled Form",
        description: "Disabled controls and actions using VPK form primitives.",
        demoSlug: "forms-demo-ads-disabled",
      },
      {
        title: "TanStack Basic",
        description: "Bug report form with text and textarea validation.",
        demoSlug: "forms-demo-tanstack-basic",
      },
      {
        title: "TanStack Input",
        description: "Single input field with schema validation.",
        demoSlug: "forms-demo-tanstack-input",
      },
      {
        title: "TanStack Textarea",
        description: "Textarea field with min/max validation.",
        demoSlug: "forms-demo-tanstack-textarea",
      },
      {
        title: "TanStack Select",
        description: "Controlled select with validation and grouped options.",
        demoSlug: "forms-demo-tanstack-select",
      },
      {
        title: "TanStack Checkbox",
        description: "Boolean and array checkbox fields.",
        demoSlug: "forms-demo-tanstack-checkbox",
      },
      {
        title: "TanStack Radio Group",
        description: "Required single-choice plan selection.",
        demoSlug: "forms-demo-tanstack-radiogroup",
      },
      {
        title: "TanStack Switch",
        description: "Boolean switch with refinement validation.",
        demoSlug: "forms-demo-tanstack-switch",
      },
      {
        title: "TanStack Complex",
        description:
          "Combined radio, select, checkbox array, and switch controls.",
        demoSlug: "forms-demo-tanstack-complex",
      },
      {
        title: "TanStack Array",
        description: "Dynamic array fields with add/remove controls.",
        demoSlug: "forms-demo-tanstack-array",
      },
    ],
  },

  icon: {
    description:
      'An accessible icon wrapper that renders any icon element with proper ARIA attributes. Wraps icons in a semantic span with role="img".',
    adsUrl: "https://atlassian.design/components/icon",
    usage: `import { Icon } from "@/components/ui/icon";
import SearchIcon from "@atlaskit/icon/core/search";

<Icon render={<SearchIcon label="" />} label="Search" />`,
    props: [
      {
        name: "render",
        type: "React.ReactElement",
        required: true,
        description: "The icon element to render.",
      },
      {
        name: "label",
        type: "string",
        required: true,
        description: "Accessible label for the icon (used as aria-label).",
      },
      {
        name: "className",
        type: "string",
        description: "Additional CSS classes for sizing and color.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "icon-demo-default" },
      {
        title: "Multiple icons",
        description: "Several icons displayed together.",
        demoSlug: "icon-demo-multiple",
      },
      {
        title: "Sizes",
        description:
          'Pass size="small" (12px) or size="medium" (16px, default) directly to the Atlaskit icon.',
        demoSlug: "icon-demo-sized",
      },
      {
        title: "Colors",
        description: "Icons with semantic color classes.",
        demoSlug: "icon-demo-colored",
      },
    ],
  },

  "icon-tile": {
    description:
      "A colored tile that wraps an icon, used for feature lists, navigation items, or visual indicators. Supports 20 color variants (10 subtle + 10 bold), 5 sizes, and square or circle shapes.",
    adsUrl: "https://atlassian.design/components/icon/icon-tile",
    usage: `import { IconTile } from "@/components/ui/icon-tile";
import SearchIcon from "@atlaskit/icon/core/search";

<IconTile icon={<SearchIcon label="" />} label="Search" variant="blue" />
<IconTile icon={<SearchIcon label="" />} label="Search" variant="blueBold" size="large" shape="circle" />`,
    props: [
      {
        name: "icon",
        type: "React.ReactNode",
        required: true,
        description: "The icon element to display inside the tile.",
      },
      {
        name: "label",
        type: "string",
        required: true,
        description: "Accessible label applied as aria-label.",
      },
      {
        name: "variant",
        type: '"gray" | "blue" | "teal" | "green" | "lime" | "yellow" | "orange" | "red" | "magenta" | "purple" | "grayBold" | "blueBold" | ... (20 total)',
        default: '"gray"',
        description:
          "Color variant of the tile. Subtle variants use light background with colored icon; bold variants use solid background with white icon.",
      },
      {
        name: "size",
        type: '"xsmall" | "small" | "medium" | "large" | "xlarge"',
        default: '"medium"',
        description: "Size of the tile.",
      },
      {
        name: "shape",
        type: '"square" | "circle"',
        default: '"square"',
        description: "Shape of the tile.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "icon-tile-demo-default" },
      {
        title: "Sizes",
        description: "All five tile sizes from xsmall to xlarge.",
        demoSlug: "icon-tile-demo-sizes",
      },
      {
        title: "Variants",
        description: "All 10 subtle color variants.",
        demoSlug: "icon-tile-demo-appearances",
      },
      {
        title: "Bold variants",
        description: "All 10 bold color variants.",
        demoSlug: "icon-tile-demo-appearances-bold",
      },
      {
        title: "Shapes",
        description: "Square and circle shapes.",
        demoSlug: "icon-tile-demo-shapes",
      },
    ],
  },

  "inline-edit": {
    description:
      "An ADS-style inline editor with read and edit states, icon-based confirm/cancel controls, optional label/validation, and keyboard-friendly interactions.",
    adsUrl: "https://atlassian.design/components/inline-edit/examples",
    demoLayout: {
      previewContentWidth: "full",
      examplesContentWidth: "full",
    },
    usage: `import { InlineEdit } from "@/components/ui/inline-edit";

const [description, setDescription] = useState("");

<InlineEdit
  label="Description"
  value={description}
  placeholder="Add RFP requirements..."
  onConfirm={setDescription}
  inputProps={{ id: "rfp-description" }}
  textareaProps={{ variant: "subtle", rows: 4 }}
  readViewClassName="border-transparent bg-transparent"
  multiline
/>
<InlineEdit
  label="Team name"
  value=""
  placeholder="Add a name..."
  isRequired
  validate={(nextValue) =>
    nextValue.length > 25 ? "Keep this under 25 characters." : undefined
  }
  onConfirm={setValue}
/>`,
    props: [
      {
        name: "value",
        type: "string",
        required: true,
        description: "The current text value.",
      },
      {
        name: "onConfirm",
        type: "(value: string) => void",
        description: "Callback when the user saves the edited value.",
      },
      {
        name: "onCancel",
        type: "() => void",
        description: "Callback when the user cancels editing.",
      },
      {
        name: "label",
        type: "string",
        description: "Optional field label shown above the inline editor.",
      },
      {
        name: "placeholder",
        type: "string",
        description: "Placeholder text shown when value is empty.",
      },
      {
        name: "isRequired",
        type: "boolean",
        default: "false",
        description: "Prevents confirming an empty value.",
      },
      {
        name: "validate",
        type: "(value: string) => string | undefined",
        description:
          "Custom validation function. Return an error message to keep edit mode open.",
      },
      {
        name: "keepEditViewOpenOnBlur",
        type: "boolean",
        default: "false",
        description: "Keeps edit mode open when focus leaves the input.",
      },
      {
        name: "multiline",
        type: "boolean",
        default: "false",
        description: "Uses Textarea for edit mode instead of Input.",
      },
      {
        name: "inputProps",
        type: "InputProps",
        description:
          "Props passed to the single-line input. Also supplies the shared field id.",
      },
      {
        name: "textareaProps",
        type: "TextareaProps",
        description: "Props passed to the multiline textarea when multiline is true.",
      },
      {
        name: "readViewClassName",
        type: "string",
        description: "Additional CSS classes for the read-view button.",
      },
      {
        name: "hideActionButtons",
        type: "boolean",
        default: "false",
        description:
          "Hides confirm/cancel icon buttons for keyboard-only or blur-confirm flows.",
      },
      {
        name: "className",
        type: "string",
        description: "Additional CSS classes.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "inline-edit-demo-default" },
      {
        title: "With placeholder",
        description: "Empty state with placeholder text.",
        demoSlug: "inline-edit-demo-with-placeholder",
      },
      {
        title: "Multiple fields",
        description: "Several inline editable fields.",
        demoSlug: "inline-edit-demo-multiple",
      },
      {
        title: "With cancel",
        description: "Handling the cancel callback.",
        demoSlug: "inline-edit-demo-with-cancel",
      },
      {
        title: "Validation",
        description: "Required and custom validation rules.",
        demoSlug: "inline-edit-demo-validation",
      },
    ],
  },

  banner: {
    description:
      "Full-width message bar pinned to the top of the page for warnings, errors, and announcements. Maps to @atlaskit/banner.",
    adsUrl: "https://atlassian.design/components/banner",
    usage: `import { Banner } from "@/components/ui/banner";

<Banner variant="warning">
  Your license is about to expire.
</Banner>`,
    props: [
      {
        name: "variant",
        type: '"warning" | "error" | "announcement"',
        default: '"warning"',
        description:
          "Visual style variant. Each variant includes a corresponding icon.",
      },
    ],
    examples: [
      {
        title: "Warning",
        description: "Warning banner.",
        demoSlug: "banner-demo-warning",
      },
      {
        title: "Error",
        description: "Error banner.",
        demoSlug: "banner-demo-error",
      },
      {
        title: "Announcement",
        description: "Announcement banner.",
        demoSlug: "banner-demo-announcement",
      },
      {
        title: "All variants",
        description: "All banner variants.",
        demoSlug: "banner-demo-variants",
      },
    ],
  },

  blanket: {
    description:
      "Fullscreen overlay for modals and focus-trapping. Maps to @atlaskit/blanket.",
    usage: `import { Blanket } from "@/components/ui/blanket"

<Blanket onClick={handleClose} />`,
    props: [
      {
        name: "isTinted",
        type: "boolean",
        default: "true",
        description: "Whether the blanket has a dark tinted background.",
      },
    ],
    examples: [
      { title: "Default (tinted)", demoSlug: "blanket-demo-default" },
      { title: "Transparent", demoSlug: "blanket-demo-transparent" },
      {
        title: "With content",
        description: "Blanket with centered content overlay.",
        demoSlug: "blanket-demo-with-content",
      },
    ],
  },

  code: {
    description:
      "Inline code snippet for embedding code references in text. Maps to @atlaskit/code.",
    usage: `import { Code } from "@/components/ui/code"

<p>Use the <Code>useState</Code> hook for state.</p>`,
    props: [],
    examples: [
      { title: "Default", demoSlug: "code-demo-default" },
      { title: "Inline in text", demoSlug: "code-demo-inline" },
      {
        title: "Multiple inline",
        description: "Multiple code snippets in a sentence.",
        demoSlug: "code-demo-multiple-inline",
      },
      { title: "File path", demoSlug: "code-demo-file-path" },
    ],
  },

  comment: {
    description:
      "Comment or discussion thread UI with avatar, author, timestamp, and actions. Maps to @atlaskit/comment.",
    adsUrl: "https://atlassian.design/components/comment",
    usage: `import { Comment, CommentAction } from "@/components/ui/comment"

<Comment author="Jane" time="2h ago" actions={<><CommentAction>Reply</CommentAction><span aria-hidden>·</span><CommentAction>Like</CommentAction></>}>
  Great work!
</Comment>`,
    props: [
      {
        name: "author",
        type: "string",
        description: "Author name (required).",
      },
      {
        name: "avatarSrc",
        type: "string",
        description: "URL for the author's avatar image.",
      },
      {
        name: "time",
        type: "string",
        description: "Timestamp or relative time string.",
      },
      {
        name: "edited",
        type: "boolean",
        description: "Displays an 'Edited' label in the header.",
      },
      {
        name: "type",
        type: "string",
        description:
          "Label displayed as a lozenge in the header (e.g. 'author').",
      },
      {
        name: "highlighted",
        type: "boolean",
        description: "Highlights the comment with a subtle background.",
      },
      {
        name: "isSaving",
        type: "boolean",
        description:
          "Enables optimistic saving mode which hides actions and shows saving text.",
      },
      {
        name: "savingText",
        type: "string",
        description:
          "Text displayed during saving mode. Defaults to 'Saving...'.",
      },
      {
        name: "actions",
        type: "ReactNode",
        description:
          "Action buttons rendered below the content. Use CommentAction components with dot separators.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "comment-demo-default" },
      { title: "With timestamp", demoSlug: "comment-demo-with-time" },
      { title: "With avatar", demoSlug: "comment-demo-with-avatar" },
      {
        title: "With actions",
        description: "Comment with action buttons and dot separators.",
        demoSlug: "comment-demo-with-actions",
      },
      {
        title: "Full",
        description:
          "Comment with all features: avatar, type lozenge, timestamp, edited, and actions.",
        demoSlug: "comment-demo-full",
      },
      {
        title: "Edited",
        description: "Comment marked as edited.",
        demoSlug: "comment-demo-edited",
      },
      {
        title: "Highlighted",
        description: "Comment with highlighted background.",
        demoSlug: "comment-demo-highlighted",
      },
      {
        title: "Saving",
        description:
          "Optimistic saving mode hides actions and shows saving text.",
        demoSlug: "comment-demo-saving",
      },
      {
        title: "Thread",
        description: "Nested comment thread with indent.",
        demoSlug: "comment-demo-thread",
      },
    ],
  },

  "date-picker": {
    adsUrl: "https://atlassian.design/components/datetime-picker",
    description:
      "Date selection input with calendar popover. Maps to @atlaskit/datetime-picker.",
    usage: `import { DatePicker } from "@/components/ui/date-picker"

const [date, setDate] = useState<Date>()
<DatePicker value={date} onChange={setDate} />`,
    props: [
      {
        name: "value",
        type: "Date",
        description: "Currently selected date.",
      },
      {
        name: "onChange",
        type: "(value: Date | undefined) => void",
        description: "Callback when date changes.",
      },
      {
        name: "placeholder",
        type: "string",
        default: '"Select date"',
        description: "Placeholder text when no date selected.",
      },
      {
        name: "disabled",
        type: "boolean",
        description: "Disables the date picker.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "date-picker-demo-default" },
      {
        title: "With value",
        description: "Pre-selected with today's date.",
        demoSlug: "date-picker-demo-with-value",
      },
      { title: "Custom placeholder", demoSlug: "date-picker-demo-placeholder" },
      { title: "Disabled", demoSlug: "date-picker-demo-disabled" },
    ],
  },

  lozenge: {
    description:
      "A compact status indicator for categorical labels, statuses, and light metadata. Matches the latest ADS filled lozenge visuals with semantic and accent color variants plus compact and spacious sizes.",
    adsUrl: "https://atlassian.design/components/lozenge",
    usage: `import { Lozenge } from "@/components/ui/lozenge";

<Lozenge>Neutral</Lozenge>
<Lozenge variant="information">In progress</Lozenge>
<Lozenge variant="success" metric="0.8">Completed</Lozenge>`,
    props: [
      {
        name: "variant",
        type: '"neutral" | "success" | "danger" | "information" | "discovery" | "warning" | "accent-red" | "accent-orange" | "accent-yellow" | "accent-lime" | "accent-green" | "accent-teal" | "accent-blue" | "accent-purple" | "accent-magenta" | "accent-gray"',
        default: '"neutral"',
        description: "Visual variant of the lozenge.",
      },
      {
        name: "size",
        type: '"compact" | "spacious"',
        default: '"compact"',
        description: "Size variant controlling height, padding, and font size.",
      },
      {
        name: "isBold",
        type: "boolean",
        default: "false",
        description:
          "Deprecated compatibility prop. ADS now renders the filled lozenge appearance by default.",
      },
      {
        name: "icon",
        type: "ReactNode",
        description: "Optional leading icon element.",
      },
      {
        name: "maxWidth",
        type: "string | number",
        description: "Maximum width before text truncation.",
      },
      {
        name: "metric",
        type: "string | number",
        description:
          "Trailing metric displayed inline inside the lozenge. Accent variants should avoid metrics to match ADS guidance.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "lozenge-demo-default" },
      { title: "Appearance", demoSlug: "lozenge-demo-appearances" },
      { title: "Accent colors", demoSlug: "lozenge-demo-accent-colors" },
      { title: "With icon", demoSlug: "lozenge-demo-with-icon" },
      {
        title: "Trailing metric",
        description: "Display inline metric text inside the lozenge.",
        demoSlug: "lozenge-demo-trailing-metric",
      },
      { title: "Spacing", demoSlug: "lozenge-demo-spacing" },
      { title: "Max width", demoSlug: "lozenge-demo-max-width" },
      { title: "Dropdown trigger", demoSlug: "lozenge-demo-dropdown-trigger" },
      {
        title: "Dropdown trigger semantic colors",
        demoSlug: "lozenge-demo-dropdown-trigger-appearances",
      },
      { title: "Usage in context", demoSlug: "lozenge-demo-usage" },
    ],
  },

  "menu-group": {
    description:
      "A family of menu primitives for building structured menus: items with icons and descriptions, link items, sections with headings and separators, and skeleton loading states. Maps to the full @atlaskit/menu API.",
    adsUrl: "https://atlassian.design/components/menu",
    usage: `import { MenuGroup, MenuSection, MenuItem, MenuLinkItem, MenuHeading, MenuSkeletonItem, MenuSkeletonHeading } from "@/components/ui/menu-group";

<MenuGroup>
  <MenuSection title="Actions">
    <MenuItem iconBefore={<EditIcon label="" />}>Edit</MenuItem>
    <MenuItem iconBefore={<CopyIcon label="" />}>Duplicate</MenuItem>
  </MenuSection>
  <MenuSection hasSeparator>
    <MenuItem iconBefore={<DeleteIcon label="" />}>Delete</MenuItem>
  </MenuSection>
</MenuGroup>`,
    props: [
      {
        name: "title",
        type: "React.ReactNode",
        description:
          "Optional group heading label (also used as aria-label when a string).",
      },
      {
        name: "spacing",
        type: '"cozy" | "compact"',
        default: '"cozy"',
        description: "Density of item padding within the group.",
      },
      {
        name: "className",
        type: "string",
        description: "Additional CSS classes.",
      },
      {
        name: "children",
        type: "React.ReactNode",
        description: "Menu items, sections, or headings.",
      },
    ],
    subComponents: [
      {
        name: "MenuSection",
        description: "Groups items with optional title and separator.",
      },
      {
        name: "MenuItem",
        description:
          "Interactive button-style menu item with iconBefore, iconAfter, and description slots.",
      },
      {
        name: "MenuLinkItem",
        description: "Anchor-style menu item for navigation links.",
      },
      { name: "MenuHeading", description: "Non-interactive heading label." },
      {
        name: "MenuSkeletonItem",
        description: "Loading placeholder for a menu item.",
      },
      {
        name: "MenuSkeletonHeading",
        description: "Loading placeholder for a heading.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "menu-group-demo-default" },
      { title: "Menu structure", demoSlug: "menu-group-demo-menu-structure" },
      { title: "Button item", demoSlug: "menu-group-demo-button-item" },
      { title: "Link item", demoSlug: "menu-group-demo-link-item" },
      { title: "Custom item", demoSlug: "menu-group-demo-custom-item" },
      {
        title: "Section and heading item",
        demoSlug: "menu-group-demo-section-and-heading",
      },
      { title: "Density", demoSlug: "menu-group-demo-density" },
      { title: "Scrolling", demoSlug: "menu-group-demo-scrolling" },
      { title: "Loading", demoSlug: "menu-group-demo-loading" },
    ],
  },

  "object-tile": {
    description:
      "A tile that represents Atlassian content (Jira issues, Confluence pages, etc.) with icon, title, description, metadata, and action slots. Optionally interactive when an href is provided.",
    usage: `import { ObjectTile } from "@/components/ui-custom/object-tile";
import { IconTile } from "@/components/ui/icon-tile";
import BugIcon from "@atlaskit/icon/core/bug";

<ObjectTile
  icon={<IconTile icon={<BugIcon label="" />} label="Bug" variant="blue" size="small" />}
  title="PROJ-123: Add user authentication"
  description="Implement OAuth2 login flow"
/>`,
    props: [
      {
        name: "title",
        type: "string",
        required: true,
        description: "Primary text for the tile.",
      },
      {
        name: "icon",
        type: "React.ReactNode",
        description: "Icon slot, typically an IconTile or Avatar.",
      },
      {
        name: "description",
        type: "string",
        description: "Secondary text displayed below the title.",
      },
      {
        name: "meta",
        type: "React.ReactNode",
        description: "Trailing metadata slot (e.g. a Lozenge).",
      },
      {
        name: "action",
        type: "React.ReactNode",
        description: "Action area slot.",
      },
      {
        name: "href",
        type: "string",
        description:
          "Makes the tile an interactive link with hover/active states.",
      },
      {
        name: "hasBorder",
        type: "boolean",
        default: "true",
        description: "Whether the tile has a border.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "object-tile-demo-default" },
      {
        title: "With description",
        description: "Object tile with secondary text.",
        demoSlug: "object-tile-demo-description",
      },
      {
        title: "With metadata",
        description: "Object tile with a trailing lozenge.",
        demoSlug: "object-tile-demo-meta",
      },
      {
        title: "As link",
        description: "Interactive object tile with hover states.",
        demoSlug: "object-tile-demo-link",
      },
      {
        title: "Stacked list",
        description: "Multiple object tiles in a list.",
        demoSlug: "object-tile-demo-list",
      },
      {
        title: "With avatar",
        description: "Object tile using an avatar instead of icon tile.",
        demoSlug: "object-tile-demo-with-avatar",
      },
    ],
  },

  "page-header": {
    description:
      "A page-level header component with title, description, breadcrumbs, and action slots. Provides consistent page header layout across views.",
    usage: `import { PageHeader } from "@/components/ui/page-header";

<PageHeader title="Projects" description="Manage your projects." />
<PageHeader title="Issues" actions={<Button>Create</Button>} />`,
    props: [
      {
        name: "title",
        type: "React.ReactNode",
        description: "Primary page heading.",
      },
      {
        name: "description",
        type: "React.ReactNode",
        description: "Optional subtitle or description text.",
      },
      {
        name: "actions",
        type: "React.ReactNode",
        description: "Action buttons displayed on the right.",
      },
      {
        name: "breadcrumbs",
        type: "React.ReactNode",
        description: "Breadcrumb navigation above the title.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "page-header-demo-default" },
      {
        title: "With description",
        demoSlug: "page-header-demo-with-description",
      },
      { title: "With actions", demoSlug: "page-header-demo-with-actions" },
      {
        title: "With breadcrumbs",
        demoSlug: "page-header-demo-with-breadcrumbs",
      },
      { title: "Title only", demoSlug: "page-header-demo-title-only" },
    ],
  },

  "progress-indicator": {
    description:
      "Dot-based step indicator showing current position in a sequence. Maps to @atlaskit/progress-indicator.",
    adsUrl: "https://atlassian.design/components/progress-indicator",
    usage: `import { ProgressIndicator } from "@/components/ui/progress-indicator"

<ProgressIndicator steps={5} currentStep={2} />
<ProgressIndicator steps={5} currentStep={2} variant="primary" />
<ProgressIndicator steps={5} currentStep={2} size="sm" />`,
    props: [
      { name: "steps", type: "number", description: "Total number of steps." },
      {
        name: "currentStep",
        type: "number",
        description: "Current active step (0-indexed).",
      },
      {
        name: "variant",
        type: '"default" | "primary" | "discovery" | "inverted"',
        description: "Visual appearance of the indicator dots.",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg"',
        description: "Size of the dots.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Default appearance with neutral selected dot.",
        demoSlug: "progress-indicator-demo-default",
      },
      {
        title: "Appearances",
        description: "Default, primary, discovery, and inverted variants.",
        demoSlug: "progress-indicator-demo-appearances",
      },
      {
        title: "Sizes",
        description: "Small, medium, and large dot sizes.",
        demoSlug: "progress-indicator-demo-sizes",
      },
      {
        title: "Interaction",
        description: "Navigate between steps with buttons.",
        demoSlug: "progress-indicator-demo-interaction",
      },
      {
        title: "Start",
        description: "First step active.",
        demoSlug: "progress-indicator-demo-start",
      },
      {
        title: "Complete",
        description: "Last step active.",
        demoSlug: "progress-indicator-demo-complete",
      },
      {
        title: "Three steps",
        description: "Three-step indicator.",
        demoSlug: "progress-indicator-demo-three-steps",
      },
    ],
  },

  "progress-tracker": {
    description:
      "Step tracker with labels, optional bylines, and completion states. Maps to @atlaskit/progress-tracker.",
    usage: `import { ProgressTracker, type ProgressTrackerStep } from "@/components/ui/progress-tracker"

const steps: ProgressTrackerStep[] = [
  { id: "1", label: "Step 1", state: "done" },
  { id: "2", label: "Step 2", byline: "Optional detail", state: "current" },
  { id: "3", label: "Step 3", state: "warning" },
]
<ProgressTracker steps={steps} />`,
    props: [
      {
        name: "steps",
        type: "ProgressTrackerStep[]",
        description: "Array of step objects with id, label, optional byline, and state.",
      },
      {
        name: "labelClassName",
        type: "string",
        description: "Optional classes applied to each step label.",
      },
      {
        name: "bylineClassName",
        type: "string",
        description: "Optional classes applied to each step byline.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Mixed step statuses.",
        demoSlug: "progress-tracker-demo-default",
      },
      {
        title: "All done",
        description: "All steps completed.",
        demoSlug: "progress-tracker-demo-all-done",
      },
      {
        title: "All todo",
        description: "All steps pending.",
        demoSlug: "progress-tracker-demo-all-todo",
      },
    ],
  },

  "split-button": {
    adsUrl: "https://atlassian.design/components/button/split-button",
    description:
      "Button with a primary action and a dropdown for secondary actions. Maps to @atlaskit/button SplitButton.",
    usage: `import { SplitButton } from "@/components/ui/split-button"

<SplitButton
  items={[
    { label: "Save as draft", onSelect: handleDraft },
    { label: "Schedule", onSelect: handleSchedule },
  ]}
>
  Publish
</SplitButton>`,
    props: [
      {
        name: "items",
        type: "SplitButtonItem[]",
        description: "Dropdown menu items.",
      },
      {
        name: "variant",
        type: '"default" | "outline" | "destructive"',
        default: '"default"',
        description: "Visual style variant.",
      },
      {
        name: "disabled",
        type: "boolean",
        description: "Disables the entire split button.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "split-button-demo-default" },
      { title: "Outline", demoSlug: "split-button-demo-outline" },
      { title: "Destructive", demoSlug: "split-button-demo-destructive" },
      { title: "Disabled", demoSlug: "split-button-demo-disabled" },
      {
        title: "Variants",
        description: "All split button variants.",
        demoSlug: "split-button-demo-variants",
      },
    ],
  },

  "skill-card": {
    description:
      "Compound hover-preview card for skills. Built on VPK HoverCard primitives with a trigger, title/description content, optional icon, and attribution source.",
    usage: `import { SkillCard } from "@/components/ui-custom/skill-card"
import { Button } from "@/components/ui/button"
import PageIcon from "@atlaskit/icon/core/page"

<SkillCard.Root>
  <SkillCard.Trigger render={<Button variant="outline" />}>
    Hover to preview
  </SkillCard.Trigger>
  <SkillCard.Content
    skillName="Create Google Drive document"
    description="Create, name, and store a document in the right folder."
    icon={{ render: <PageIcon label="" size="small" />, label: "Document" }}
    source={{ type: "app", name: "Google Drive", logoSrc: "/3p/google-drive/16.svg" }}
  />
</SkillCard.Root>`,
    props: [
      {
        name: "skillName",
        type: "string",
        required: true,
        description: "Primary title shown in the card header.",
      },
      {
        name: "description",
        type: "string",
        description:
          "Optional secondary text. Truncated to two lines when present.",
      },
      {
        name: "icon",
        type: "{ render: ReactElement; label: string; className?: string }",
        description:
          "Optional icon descriptor rendered before the title via VPK Icon wrapper.",
      },
      {
        name: "source",
        type: '{ type: "app"; name: string; logoSrc?: string } | { type: "custom"; name: string; avatarSrc?: string; fallbackInitials?: string }',
        description:
          "Optional attribution row shown at the bottom of the card.",
      },
      {
        name: "side",
        type: '"top" | "right" | "bottom" | "left"',
        default: '"top"',
        description:
          "Popup side relative to trigger (inherited from HoverCardContent).",
      },
      {
        name: "openDelay",
        type: "number",
        description:
          "Delay before opening on hover (inherited from SkillCard.Root).",
      },
      {
        name: "closeDelay",
        type: "number",
        description:
          "Delay before closing after hover leaves (inherited from SkillCard.Root).",
      },
    ],
    subComponents: [
      {
        name: "SkillCard.Root",
        description: "Hover-card root controller (open state and timing).",
      },
      {
        name: "SkillCard.Trigger",
        description: "Interactive trigger element for opening the card.",
      },
      {
        name: "SkillCard.Content",
        description:
          "Card surface with title, description, and source attribution.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "skill-card-demo-default" },
      {
        title: "App source",
        description: "Attribution row with app logo and name.",
        demoSlug: "skill-card-demo-app-source",
      },
      {
        title: "Custom source",
        description: "Attribution row with user avatar and name.",
        demoSlug: "skill-card-demo-custom-source",
      },
      {
        title: "No description",
        description: "Compact content with title and source only.",
        demoSlug: "skill-card-demo-no-description",
      },
    ],
  },

  "skill-tag": {
    description:
      "Skewed parallelogram-shaped tag for displaying AI skill references inline. Features a colored slash bar on the left edge, optional icon, and counter-skewed content.",
    usage: `import { SkillTag, SkillTagGroup } from "@/components/ui-custom/skill-tag"
import SearchIcon from "@atlaskit/icon/core/search"

<SkillTag icon={<SearchIcon label="" size="small" />} color="teamwork">
  Search
</SkillTag>`,
    props: [
      {
        name: "color",
        type: '"default" | "2p3p" | "platform" | "teamwork" | "software" | "strategy" | "service" | "product"',
        default: '"default"',
        description:
          "Collection variant. Controls both slash bar color and icon color. Maps to Figma collection names.",
      },
      {
        name: "icon",
        type: "ReactNode",
        description:
          "Icon rendered before the label (12px, counter-skewed to remain upright).",
      },
      {
        name: "onClick",
        type: "(e: MouseEvent) => void",
        description:
          "Click handler. When provided, adds hover/active states and pointer cursor.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "skill-tag-demo-default" },
      {
        title: "Colors",
        description: "All 8 collection variants.",
        demoSlug: "skill-tag-demo-colors",
      },
      {
        title: "With icon",
        description: "Tags with ADS icons.",
        demoSlug: "skill-tag-demo-with-icon",
      },
      {
        title: "Interactive",
        description: "Clickable tags with hover/active states.",
        demoSlug: "skill-tag-demo-interactive",
      },
      {
        title: "Group",
        description: "SkillTagGroup for organizing multiple tags.",
        demoSlug: "skill-tag-demo-group",
      },
      {
        title: "Inline",
        description: "Tags inline with text.",
        demoSlug: "skill-tag-demo-inline",
      },
    ],
  },

  tag: {
    description:
      "Categorization label with optional remove button and AvatarTag support. Maps to @atlaskit/tag (Tag + AvatarTag examples).",
    adsUrl: "https://atlassian.design/components/tag/tag",
    usage: `import { Tag } from "@/components/ui/tag"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

<Tag color="blue">Label</Tag>
<Tag variant="rounded" onRemove={() => {}}>Removable</Tag>
	<Tag
	  type="user"
	  elemBefore={
	    <Avatar size="xs">
	      <AvatarImage src="/avatar-user/ali/color/asow-teamwork-blue.png" alt="Alex" />
	      <AvatarFallback>AL</AvatarFallback>
	    </Avatar>
	  }
>
  Alex
</Tag>`,
    props: [
      {
        name: "variant",
        type: '"default" | "rounded"',
        default: '"default"',
        description:
          "Tag shape style. Legacy variant values are still supported for compatibility.",
      },
      {
        name: "color",
        type: '"standard" | "gray" | "blue" | "green" | "red" | "yellow" | "purple" | "discovery" | "lime" | "magenta" | "orange" | "teal"',
        default: '"standard"',
        description:
          "Accent color for border and leading icon. Use 'discovery' for semantic purple (ADS discovery tokens).",
      },
      {
        name: "type",
        type: '"default" | "user" | "other" | "agent"',
        default: '"default"',
        description: "AvatarTag mode. Use with `elemBefore` avatar content.",
      },
      {
        name: "elemBefore",
        type: "ReactNode",
        description: "Element rendered before tag text (icon or avatar).",
      },
      {
        name: "isVerified",
        type: "boolean",
        default: "false",
        description: "Shows a verified icon for `type='other'` avatar tags.",
      },
      {
        name: "onRemove",
        type: "() => void",
        description:
          "Callback when remove button is clicked. Shows remove button when provided.",
      },
      {
        name: "maxWidth",
        type: "string | number",
        description: "Maximum width before truncating tag text.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "tag-demo-default" },
      {
        title: "Removable",
        description: "Tag with remove button.",
        demoSlug: "tag-demo-removable",
      },
      {
        title: "Variants",
        description: "Latest ADS Tag color set.",
        demoSlug: "tag-demo-variants",
      },
      {
        title: "Removable variants",
        description: "All variants with remove buttons.",
        demoSlug: "tag-demo-removable-variants",
      },
      {
        title: "Disabled",
        description: "Disabled state.",
        demoSlug: "tag-demo-disabled",
      },
      {
        title: "Colors",
        description: "All supported color tokens.",
        demoSlug: "tag-demo-colors",
      },
      {
        title: "Rounded",
        description: "Rounded tag variant.",
        demoSlug: "tag-demo-rounded",
      },
      {
        title: "Avatar tags",
        description: "User, other, and agent avatar-tag styles.",
        demoSlug: "tag-demo-avatar-tags",
      },
      {
        title: "Tag Group",
        description: "Container for organizing multiple tags.",
        demoSlug: "tag-demo-tag-group",
      },
      {
        title: "Tag Group removable",
        description: "Tag group with removable tags.",
        demoSlug: "tag-demo-tag-group-removable",
      },
      {
        title: "Tag Group variants",
        description: "Tag group with mixed variant styles.",
        demoSlug: "tag-demo-tag-group-variants",
      },
    ],
  },

  "time-picker": {
    description:
      "Time selection input using a native select dropdown. Maps to @atlaskit/datetime-picker TimePicker.",
    usage: `import { TimePicker } from "@/components/ui/time-picker"

const [value, setValue] = useState("")
<TimePicker value={value} onChange={setValue} />`,
    props: [
      {
        name: "value",
        type: "string",
        description: "Selected time in HH:mm format.",
      },
      {
        name: "onChange",
        type: "(value: string) => void",
        description: "Callback when time changes.",
      },
      {
        name: "stepMinutes",
        type: "number",
        default: "30",
        description: "Interval between time options in minutes.",
      },
      {
        name: "disabled",
        type: "boolean",
        description: "Disables the time picker.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "time-picker-demo-default" },
      {
        title: "With value",
        description: "Pre-selected time.",
        demoSlug: "time-picker-demo-with-value",
      },
      {
        title: "15-minute intervals",
        description: "Time options every 15 minutes.",
        demoSlug: "time-picker-demo-15-min",
      },
      { title: "Disabled", demoSlug: "time-picker-demo-disabled" },
    ],
  },

  tile: {
    description:
      "A base tile component — a rounded square that takes an asset and represents a noun. Supports 28 color variants across semantic, accent subtle, and accent bold categories.",
    adsUrl: "https://atlassian.design/components/tile",
    usage: `import { Tile } from "@/components/ui/tile";
import SearchIcon from "@atlaskit/icon/core/search";

<Tile label="Search" variant="blueSubtle" size="medium">
  <SearchIcon label="" />
</Tile>`,
    props: [
      {
        name: "label",
        type: "string",
        required: true,
        description: "Accessible label applied as aria-label.",
      },
      {
        name: "size",
        type: '"xxsmall" | "xsmall" | "small" | "medium" | "large" | "xlarge"',
        default: '"medium"',
        description: "Size of the tile.",
      },
      {
        name: "variant",
        type: '"neutral" | "brand" | "danger" | "warning" | "success" | "discovery" | "information" | "transparent" | "blueSubtle" | "blueBold" | ... (28 total)',
        default: '"neutral"',
        description: "Color variant of the tile.",
      },
      {
        name: "isInset",
        type: "boolean",
        default: "true",
        description: "Whether the tile has internal padding.",
      },
      {
        name: "hasBorder",
        type: "boolean",
        default: "false",
        description: "Whether the tile has a border.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "tile-demo-default" },
      {
        title: "Sizes",
        description: "All six tile sizes.",
        demoSlug: "tile-demo-sizes",
      },
      {
        title: "Variants",
        description: "Semantic, accent subtle, and accent bold variants.",
        demoSlug: "tile-demo-appearances",
      },
      {
        title: "With border",
        description: "Tile with border enabled.",
        demoSlug: "tile-demo-border",
      },
      {
        title: "Custom SVG",
        description:
          "With and without internal padding for edge-to-edge content.",
        demoSlug: "tile-demo-inset",
      },
    ],
  },

  "date-time-picker": {
    adsUrl: "https://atlassian.design/components/datetime-picker",
    description:
      "Combined date and time picker. Maps to @atlaskit/datetime-picker DateTimePicker.",
    usage: `import { DateTimePicker, type DateTimePickerValue } from "@/components/ui/date-time-picker"

const [value, setValue] = useState<DateTimePickerValue>({})
<DateTimePicker value={value} onChange={setValue} />`,
    props: [
      {
        name: "value",
        type: "DateTimePickerValue",
        description: "Object with date and time properties.",
      },
      {
        name: "onChange",
        type: "(value: DateTimePickerValue) => void",
        description: "Callback when value changes.",
      },
      {
        name: "disabled",
        type: "boolean",
        description: "Disables both pickers.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "date-time-picker-demo-default" },
      {
        title: "With value",
        description: "Pre-selected date and time.",
        demoSlug: "date-time-picker-demo-with-value",
      },
      { title: "Disabled", demoSlug: "date-time-picker-demo-disabled" },
    ],
  },
};
