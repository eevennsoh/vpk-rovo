import dynamic from "next/dynamic";
import type { ComponentType } from "react";

const UI_DEMO: Record<string, ComponentType> = {
  accordion: dynamic(() => import("./demos/ui/accordion-demo"), { ssr: false }),
  alert: dynamic(() => import("./demos/ui/alert-demo"), { ssr: false }),
  "alert-dialog": dynamic(() => import("./demos/ui/alert-dialog-demo"), {
    ssr: false,
  }),
  "aspect-ratio": dynamic(() => import("./demos/ui/aspect-ratio-demo"), {
    ssr: false,
  }),
  avatar: dynamic(() => import("./demos/ui/avatar-demo"), { ssr: false }),
  badge: dynamic(() => import("./demos/ui/badge-demo"), { ssr: false }),
  breadcrumb: dynamic(() => import("./demos/ui/breadcrumb-demo"), {
    ssr: false,
  }),
  button: dynamic(() => import("./demos/ui/button-demo"), { ssr: false }),
  "button-group": dynamic(() => import("./demos/ui/button-group-demo"), {
    ssr: false,
  }),
  calendar: dynamic(() => import("./demos/ui/calendar-demo"), { ssr: false }),
  card: dynamic(() => import("./demos/ui/card-demo"), { ssr: false }),
  carousel: dynamic(() => import("./demos/ui/carousel-demo"), { ssr: false }),
  chart: dynamic(() => import("./demos/ui/chart-demo"), { ssr: false }),
  checkbox: dynamic(() => import("./demos/ui/checkbox-demo"), { ssr: false }),
  collapsible: dynamic(() => import("./demos/ui/collapsible-demo"), {
    ssr: false,
  }),
  combobox: dynamic(() => import("./demos/ui/combobox-demo"), { ssr: false }),
  command: dynamic(() => import("./demos/ui/command-demo"), { ssr: false }),
  "context-menu": dynamic(() => import("./demos/ui/context-menu-demo"), {
    ssr: false,
  }),
  dialog: dynamic(() => import("./demos/ui/dialog-demo"), { ssr: false }),
  direction: dynamic(() => import("./demos/ui/direction-demo"), { ssr: false }),
  drawer: dynamic(() => import("./demos/ui/drawer-demo"), { ssr: false }),
  "dropdown-menu": dynamic(() => import("./demos/ui/dropdown-menu-demo"), {
    ssr: false,
  }),
  empty: dynamic(() => import("./demos/ui/empty-demo"), { ssr: false }),
  field: dynamic(() => import("./demos/ui/field-demo"), { ssr: false }),
  footer: dynamic(() => import("./demos/ui/footer-demo"), { ssr: false }),
  "hover-card": dynamic(() => import("./demos/ui/hover-card-demo"), {
    ssr: false,
  }),
  "input-group": dynamic(() => import("./demos/ui/input-group-demo"), {
    ssr: false,
  }),
  "input-otp": dynamic(() => import("./demos/ui/input-otp-demo"), {
    ssr: false,
  }),
  item: dynamic(() => import("./demos/ui/item-demo"), { ssr: false }),
  kbd: dynamic(() => import("./demos/ui/kbd-demo"), { ssr: false }),
  label: dynamic(() => import("./demos/ui/label-demo"), { ssr: false }),
  menubar: dynamic(() => import("./demos/ui/menubar-demo"), { ssr: false }),
  "native-select": dynamic(() => import("./demos/ui/native-select-demo"), {
    ssr: false,
  }),
  "navigation-menu": dynamic(() => import("./demos/ui/navigation-menu-demo"), {
    ssr: false,
  }),
  pagination: dynamic(() => import("./demos/ui/pagination-demo"), {
    ssr: false,
  }),
  popover: dynamic(() => import("./demos/ui/popover-demo"), { ssr: false }),
  progress: dynamic(() => import("./demos/ui/progress-demo"), { ssr: false }),
  "progress-circle": dynamic(() => import("./demos/ui/progress-circle-demo"), {
    ssr: false,
  }),
  "progress-rovo": dynamic(() => import("./demos/ui/progress-rovo-demo"), {
    ssr: false,
  }),
  "radio-group": dynamic(() => import("./demos/ui/radio-group-demo"), {
    ssr: false,
  }),
  resizable: dynamic(() => import("./demos/ui/resizable-demo"), { ssr: false }),
  "scroll-area": dynamic(() => import("./demos/ui/scroll-area-demo"), {
    ssr: false,
  }),
  select: dynamic(() => import("./demos/ui/select-demo"), { ssr: false }),
  separator: dynamic(() => import("./demos/ui/separator-demo"), { ssr: false }),
  sheet: dynamic(() => import("./demos/ui/sheet-demo"), { ssr: false }),
  skeleton: dynamic(() => import("./demos/ui/skeleton-demo"), { ssr: false }),
  "sidebar-nav-item": dynamic(() => import("./demos/ui/sidebar-nav-item-demo"), {
    ssr: false,
  }),
  slider: dynamic(() => import("./demos/ui/slider-demo"), { ssr: false }),
  sonner: dynamic(() => import("./demos/ui/sonner-demo"), { ssr: false }),
  spinner: dynamic(() => import("./demos/ui/spinner-demo"), { ssr: false }),
  switch: dynamic(() => import("./demos/ui/switch-demo"), { ssr: false }),
  table: dynamic(() => import("./demos/ui/table-demo"), { ssr: false }),
  tabs: dynamic(() => import("./demos/ui/tabs-demo"), { ssr: false }),

  toggle: dynamic(() => import("./demos/ui/toggle-demo"), { ssr: false }),
  "toggle-group": dynamic(() => import("./demos/ui/toggle-group-demo"), {
    ssr: false,
  }),
  tooltip: dynamic(() => import("./demos/ui/tooltip-demo"), { ssr: false }),
  blanket: dynamic(() => import("./demos/ui/blanket-demo"), { ssr: false }),
  banner: dynamic(() => import("./demos/ui/banner-demo"), { ssr: false }),
  comment: dynamic(() => import("./demos/ui/comment-demo"), { ssr: false }),
  "date-picker": dynamic(() => import("./demos/ui/date-picker-demo"), {
    ssr: false,
  }),
  "date-time-picker": dynamic(
    () => import("./demos/ui/date-time-picker-demo"),
    { ssr: false },
  ),
  forms: dynamic(() => import("./demos/ui/forms-demo"), { ssr: false }),
  icon: dynamic(() => import("./demos/ui/icon-demo"), { ssr: false }),
  "icon-tile": dynamic(() => import("./demos/ui/icon-tile-demo"), {
    ssr: false,
  }),
  "inline-edit": dynamic(() => import("./demos/ui/inline-edit-demo"), {
    ssr: false,
  }),
  logo: dynamic(() => import("./demos/ui/logo-demo"), { ssr: false }),
  lozenge: dynamic(() => import("./demos/ui/lozenge-demo"), { ssr: false }),
  "menu-group": dynamic(() => import("./demos/ui/menu-group-demo"), {
    ssr: false,
  }),
  "object-tile": dynamic(() => import("./demos/ui/object-tile-demo"), {
    ssr: false,
  }),
  "page-header": dynamic(() => import("./demos/ui/page-header-demo"), {
    ssr: false,
  }),
  "progress-indicator": dynamic(
    () => import("./demos/ui/progress-indicator-demo"),
    { ssr: false },
  ),
  "progress-tracker": dynamic(
    () => import("./demos/ui/progress-tracker-demo"),
    { ssr: false },
  ),
  radio: dynamic(() => import("./demos/ui/radio-group-demo"), { ssr: false }),
  "split-button": dynamic(() => import("./demos/ui/split-button-demo"), {
    ssr: false,
  }),
  "skill-card": dynamic(() => import("./demos/ui/skill-card-demo"), {
    ssr: false,
  }),
  "skill-tag": dynamic(() => import("./demos/ui/skill-tag-demo"), {
    ssr: false,
  }),
  tag: dynamic(() => import("./demos/ui/tag-demo"), { ssr: false }),

  "time-picker": dynamic(() => import("./demos/ui/time-picker-demo"), {
    ssr: false,
  }),
  tile: dynamic(() => import("./demos/ui/tile-demo"), { ssr: false }),
};

const UI_AUDIO_DEMO: Record<string, ComponentType> = {
  "audio-player": dynamic(() => import("./demos/ui-audio/audio-player-demo"), {
    ssr: false,
  }),
  "bar-visualizer": dynamic(
    () => import("./demos/ui-audio/bar-visualizer-demo"),
    { ssr: false },
  ),
  conversation: dynamic(() => import("./demos/ui-audio/conversation-demo"), {
    ssr: false,
  }),
  "conversation-bar": dynamic(
    () => import("./demos/ui-audio/conversation-bar-demo"),
    { ssr: false },
  ),
  "live-waveform": dynamic(
    () => import("./demos/ui-audio/live-waveform-demo"),
    { ssr: false },
  ),
  matrix: dynamic(() => import("./demos/ui-audio/matrix-demo"), { ssr: false }),
  message: dynamic(() => import("./demos/ui-audio/message-demo"), {
    ssr: false,
  }),
  "mic-selector": dynamic(() => import("./demos/ui-audio/mic-selector-demo"), {
    ssr: false,
  }),
  orb: dynamic(() => import("./demos/ui-audio/orb-demo"), { ssr: false }),
  response: dynamic(() => import("./demos/ui-audio/response-demo"), {
    ssr: false,
  }),
  "scrub-bar": dynamic(() => import("./demos/ui-audio/scrub-bar-demo"), {
    ssr: false,
  }),
  "shimmering-text": dynamic(
    () => import("./demos/ui-audio/shimmering-text-demo"),
    { ssr: false },
  ),
  "speech-input": dynamic(() => import("./demos/ui-audio/speech-input-demo"), {
    ssr: false,
  }),
  "transcript-viewer": dynamic(
    () => import("./demos/ui-audio/transcript-viewer-demo"),
    { ssr: false },
  ),
  "voice-button": dynamic(() => import("./demos/ui-audio/voice-button-demo"), {
    ssr: false,
  }),
  "voice-picker": dynamic(() => import("./demos/ui-audio/voice-picker-demo"), {
    ssr: false,
  }),
  waveform: dynamic(() => import("./demos/ui-audio/waveform-demo"), {
    ssr: false,
  }),
};

const UI_CUSTOM_DEMO: Record<string, ComponentType> = {
  agent: dynamic(() => import("./demos/ui-custom/agent-demo"), { ssr: false }),
  "animated-dots": dynamic(() => import("./demos/ui-custom/animated-dots-demo"), {
    ssr: false,
  }),
  artifact: dynamic(() => import("./demos/ui-custom/artifact-demo"), {
    ssr: false,
  }),
  attachments: dynamic(() => import("./demos/ui-custom/attachments-demo"), {
    ssr: false,
  }),
  "audio-player": dynamic(() => import("./demos/ui-custom/audio-player-demo"), {
    ssr: false,
  }),
  canvas: dynamic(() => import("./demos/ui-custom/canvas-demo"), { ssr: false }),
  "chain-of-thought": dynamic(
    () => import("./demos/ui-custom/chain-of-thought-demo"),
    { ssr: false },
  ),
  checkpoint: dynamic(() => import("./demos/ui-custom/checkpoint-demo"), {
    ssr: false,
  }),
  "code-block": dynamic(() => import("./demos/ui-custom/code-block-demo"), {
    ssr: false,
  }),
  commit: dynamic(() => import("./demos/ui-custom/commit-demo"), { ssr: false }),
  confirmation: dynamic(() => import("./demos/ui-custom/confirmation-demo"), {
    ssr: false,
  }),
  connection: dynamic(() => import("./demos/ui-custom/connection-demo"), {
    ssr: false,
  }),
  context: dynamic(() => import("./demos/ui-custom/context-demo"), { ssr: false }),
  controls: dynamic(() => import("./demos/ui-custom/controls-demo"), {
    ssr: false,
  }),
  conversation: dynamic(() => import("./demos/ui-custom/conversation-demo"), {
    ssr: false,
  }),
  edge: dynamic(() => import("./demos/ui-custom/edge-demo"), { ssr: false }),
  "environment-variables": dynamic(
    () => import("./demos/ui-custom/environment-variables-demo"),
    { ssr: false },
  ),
  "file-tree": dynamic(() => import("./demos/ui-custom/file-tree-demo"), {
    ssr: false,
  }),
  image: dynamic(() => import("./demos/ui-custom/image-demo"), { ssr: false }),
  "inline-citation": dynamic(
    () => import("./demos/ui-custom/inline-citation-demo"),
    { ssr: false },
  ),
  "jsx-preview": dynamic(() => import("./demos/ui-custom/jsx-preview-demo"), {
    ssr: false,
  }),
  message: dynamic(() => import("./demos/ui-custom/message-demo"), { ssr: false }),
  "mic-selector": dynamic(() => import("./demos/ui-custom/mic-selector-demo"), {
    ssr: false,
  }),
  "model-selector": dynamic(() => import("./demos/ui-custom/model-selector-demo"), {
    ssr: false,
  }),
  node: dynamic(() => import("./demos/ui-custom/node-demo"), { ssr: false }),
  "open-in-chat": dynamic(() => import("./demos/ui-custom/open-in-chat-demo"), {
    ssr: false,
  }),
  "package-info": dynamic(() => import("./demos/ui-custom/package-info-demo"), {
    ssr: false,
  }),
  panel: dynamic(() => import("./demos/ui-custom/panel-demo"), { ssr: false }),
  persona: dynamic(() => import("./demos/ui-custom/persona-demo"), { ssr: false }),
  plan: dynamic(() => import("./demos/ui-custom/plan-demo"), { ssr: false }),
  "prompt-input": dynamic(() => import("./demos/ui-custom/prompt-input-demo"), {
    ssr: false,
  }),
  queue: dynamic(() => import("./demos/ui-custom/queue-demo"), { ssr: false }),
  reasoning: dynamic(() => import("./demos/ui-custom/reasoning-demo"), {
    ssr: false,
  }),
  sandbox: dynamic(() => import("./demos/ui-custom/sandbox-demo"), { ssr: false }),
  "schema-display": dynamic(() => import("./demos/ui-custom/schema-display-demo"), {
    ssr: false,
  }),
  shimmer: dynamic(() => import("./demos/ui-custom/shimmer-demo"), { ssr: false }),
  snippet: dynamic(() => import("./demos/ui-custom/snippet-demo"), { ssr: false }),
  sources: dynamic(() => import("./demos/ui-custom/sources-demo"), { ssr: false }),
  "speech-input": dynamic(() => import("./demos/ui-custom/speech-input-demo"), {
    ssr: false,
  }),
  "stack-trace": dynamic(() => import("./demos/ui-custom/stack-trace-demo"), {
    ssr: false,
  }),
  suggestion: dynamic(() => import("./demos/ui-custom/suggestion-demo"), {
    ssr: false,
  }),
  task: dynamic(() => import("./demos/ui-custom/task-demo"), { ssr: false }),
  terminal: dynamic(() => import("./demos/ui-custom/terminal-demo"), {
    ssr: false,
  }),
  "test-results": dynamic(() => import("./demos/ui-custom/test-results-demo"), {
    ssr: false,
  }),
  tool: dynamic(() => import("./demos/ui-custom/tool-demo"), { ssr: false }),
  "twg-tool": dynamic(() => import("./demos/ui-custom/twg-tool-demo"), {
    ssr: false,
  }),
  toolbar: dynamic(() => import("./demos/ui-custom/toolbar-demo"), { ssr: false }),
  transcription: dynamic(() => import("./demos/ui-custom/transcription-demo"), {
    ssr: false,
  }),
  "voice-selector": dynamic(() => import("./demos/ui-custom/voice-selector-demo"), {
    ssr: false,
  }),
  "web-preview": dynamic(() => import("./demos/ui-custom/web-preview-demo"), {
    ssr: false,
  }),
  "animated-rovo": dynamic(() => import("./demos/ui-custom/animated-rovo-demo"), {
    ssr: false,
  }),
  "morphing-rovo": dynamic(() => import("./demos/ui-custom/morphing-rovo-demo"), {
    ssr: false,
  }),
  "rovo-generation": dynamic(
    () => import("./demos/ui-custom/rovo-generation-demo"),
    { ssr: false },
  ),
};

const UI_VARIANT_DEMOS: Record<string, ComponentType> = {
  // Button
  "button-demo-default": dynamic(
    () =>
      import("./demos/ui/button-demo").then((mod) => ({
        default: mod.ButtonDemoDefault,
      })),
    { ssr: false },
  ),
  "button-demo-secondary": dynamic(
    () =>
      import("./demos/ui/button-demo").then((mod) => ({
        default: mod.ButtonDemoSecondary,
      })),
    { ssr: false },
  ),
  "button-demo-outline": dynamic(
    () =>
      import("./demos/ui/button-demo").then((mod) => ({
        default: mod.ButtonDemoOutline,
      })),
    { ssr: false },
  ),
  "button-demo-ghost": dynamic(
    () =>
      import("./demos/ui/button-demo").then((mod) => ({
        default: mod.ButtonDemoGhost,
      })),
    { ssr: false },
  ),
  "button-demo-destructive": dynamic(
    () =>
      import("./demos/ui/button-demo").then((mod) => ({
        default: mod.ButtonDemoDestructive,
      })),
    { ssr: false },
  ),
  "button-demo-link": dynamic(
    () =>
      import("./demos/ui/button-demo").then((mod) => ({
        default: mod.ButtonDemoLink,
      })),
    { ssr: false },
  ),
  "button-demo-variants": dynamic(
    () =>
      import("./demos/ui/button-demo").then((mod) => ({
        default: mod.ButtonDemoVariants,
      })),
    { ssr: false },
  ),
  "button-demo-sizes": dynamic(
    () =>
      import("./demos/ui/button-demo").then((mod) => ({
        default: mod.ButtonDemoSizes,
      })),
    { ssr: false },
  ),
  "button-demo-with-icon": dynamic(
    () =>
      import("./demos/ui/button-demo").then((mod) => ({
        default: mod.ButtonDemoWithIcon,
      })),
    { ssr: false },
  ),
  "button-demo-loading": dynamic(
    () =>
      import("./demos/ui/button-demo").then((mod) => ({
        default: mod.ButtonDemoLoading,
      })),
    { ssr: false },
  ),
  "button-demo-disabled": dynamic(
    () =>
      import("./demos/ui/button-demo").then((mod) => ({
        default: mod.ButtonDemoDisabled,
      })),
    { ssr: false },
  ),
  "button-demo-full-width": dynamic(
    () =>
      import("./demos/ui/button-demo").then((mod) => ({
        default: mod.ButtonDemoFullWidth,
      })),
    { ssr: false },
  ),
  "button-demo-icon-left": dynamic(
    () =>
      import("./demos/ui/button-demo").then((mod) => ({
        default: mod.ButtonDemoIconLeft,
      })),
    { ssr: false },
  ),
  "button-demo-icon-only": dynamic(
    () =>
      import("./demos/ui/button-demo").then((mod) => ({
        default: mod.ButtonDemoIconOnly,
      })),
    { ssr: false },
  ),
  "button-demo-icon-right": dynamic(
    () =>
      import("./demos/ui/button-demo").then((mod) => ({
        default: mod.ButtonDemoIconRight,
      })),
    { ssr: false },
  ),
  "button-demo-invalid-states": dynamic(
    () =>
      import("./demos/ui/button-demo").then((mod) => ({
        default: mod.ButtonDemoInvalidStates,
      })),
    { ssr: false },
  ),
  "button-demo-selected": dynamic(
    () =>
      import("./demos/ui/button-demo").then((mod) => ({
        default: mod.ButtonDemoSelected,
      })),
    { ssr: false },
  ),
  "button-demo-usage": dynamic(
    () =>
      import("./demos/ui/button-demo").then((mod) => ({
        default: mod.ButtonDemoUsage,
      })),
    { ssr: false },
  ),
  "button-demo-variants-and-sizes": dynamic(
    () =>
      import("./demos/ui/button-demo").then((mod) => ({
        default: mod.ButtonDemoVariantsAndSizes,
      })),
    { ssr: false },
  ),
  // Badge
  "badge-demo-default": dynamic(
    () =>
      import("./demos/ui/badge-demo").then((mod) => ({
        default: mod.BadgeDemoDefault,
      })),
    { ssr: false },
  ),
  "badge-demo-primary": dynamic(
    () =>
      import("./demos/ui/badge-demo").then((mod) => ({
        default: mod.BadgeDemoPrimary,
      })),
    { ssr: false },
  ),
  "badge-demo-important": dynamic(
    () =>
      import("./demos/ui/badge-demo").then((mod) => ({
        default: mod.BadgeDemoImportant,
      })),
    { ssr: false },
  ),
  "badge-demo-added": dynamic(
    () =>
      import("./demos/ui/badge-demo").then((mod) => ({
        default: mod.BadgeDemoAdded,
      })),
    { ssr: false },
  ),
  "badge-demo-removed": dynamic(
    () =>
      import("./demos/ui/badge-demo").then((mod) => ({
        default: mod.BadgeDemoRemoved,
      })),
    { ssr: false },
  ),
  "badge-demo-secondary": dynamic(
    () =>
      import("./demos/ui/badge-demo").then((mod) => ({
        default: mod.BadgeDemoSecondary,
      })),
    { ssr: false },
  ),
  "badge-demo-destructive": dynamic(
    () =>
      import("./demos/ui/badge-demo").then((mod) => ({
        default: mod.BadgeDemoDestructive,
      })),
    { ssr: false },
  ),
  "badge-demo-success": dynamic(
    () =>
      import("./demos/ui/badge-demo").then((mod) => ({
        default: mod.BadgeDemoSuccess,
      })),
    { ssr: false },
  ),
  "badge-demo-warning": dynamic(
    () =>
      import("./demos/ui/badge-demo").then((mod) => ({
        default: mod.BadgeDemoWarning,
      })),
    { ssr: false },
  ),
  "badge-demo-info": dynamic(
    () =>
      import("./demos/ui/badge-demo").then((mod) => ({
        default: mod.BadgeDemoInfo,
      })),
    { ssr: false },
  ),
  "badge-demo-discovery": dynamic(
    () =>
      import("./demos/ui/badge-demo").then((mod) => ({
        default: mod.BadgeDemoDiscovery,
      })),
    { ssr: false },
  ),
  "badge-demo-outline": dynamic(
    () =>
      import("./demos/ui/badge-demo").then((mod) => ({
        default: mod.BadgeDemoOutline,
      })),
    { ssr: false },
  ),
  "badge-demo-ghost": dynamic(
    () =>
      import("./demos/ui/badge-demo").then((mod) => ({
        default: mod.BadgeDemoGhost,
      })),
    { ssr: false },
  ),
  "badge-demo-link": dynamic(
    () =>
      import("./demos/ui/badge-demo").then((mod) => ({
        default: mod.BadgeDemoLink,
      })),
    { ssr: false },
  ),
  "badge-demo-ads-appearances": dynamic(
    () =>
      import("./demos/ui/badge-demo").then((mod) => ({
        default: mod.BadgeDemoAdsAppearances,
      })),
    { ssr: false },
  ),
  "badge-demo-ads-legacy-aliases": dynamic(
    () =>
      import("./demos/ui/badge-demo").then((mod) => ({
        default: mod.BadgeDemoAdsLegacyAliases,
      })),
    { ssr: false },
  ),
  "badge-demo-variants": dynamic(
    () =>
      import("./demos/ui/badge-demo").then((mod) => ({
        default: mod.BadgeDemoVariants,
      })),
    { ssr: false },
  ),
  "badge-demo-with-icon": dynamic(
    () =>
      import("./demos/ui/badge-demo").then((mod) => ({
        default: mod.BadgeDemoWithIcon,
      })),
    { ssr: false },
  ),
  "badge-demo-max-value": dynamic(
    () =>
      import("./demos/ui/badge-demo").then((mod) => ({
        default: mod.BadgeDemoMaxValue,
      })),
    { ssr: false },
  ),
  "badge-demo-with-spinner": dynamic(
    () =>
      import("./demos/ui/badge-demo").then((mod) => ({
        default: mod.BadgeDemoWithSpinner,
      })),
    { ssr: false },
  ),
  "badge-demo-disabled": dynamic(
    () =>
      import("./demos/ui/badge-demo").then((mod) => ({
        default: mod.BadgeDemoDisabled,
      })),
    { ssr: false },
  ),
  // Dialog
  "dialog-demo-default": dynamic(
    () =>
      import("./demos/ui/dialog-demo").then((mod) => ({
        default: mod.DialogDemoDefault,
      })),
    { ssr: false },
  ),
  "dialog-demo-form": dynamic(
    () =>
      import("./demos/ui/dialog-demo").then((mod) => ({
        default: mod.DialogDemoForm,
      })),
    { ssr: false },
  ),
  "dialog-demo-no-close": dynamic(
    () =>
      import("./demos/ui/dialog-demo").then((mod) => ({
        default: mod.DialogDemoNoClose,
      })),
    { ssr: false },
  ),
  "dialog-demo-custom-width": dynamic(
    () =>
      import("./demos/ui/dialog-demo").then((mod) => ({
        default: mod.DialogDemoCustomWidth,
      })),
    { ssr: false },
  ),
  "dialog-demo-chat-settings": dynamic(
    () =>
      import("./demos/ui/dialog-demo").then((mod) => ({
        default: mod.DialogDemoChatSettings,
      })),
    { ssr: false },
  ),
  "dialog-demo-no-close-button": dynamic(
    () =>
      import("./demos/ui/dialog-demo").then((mod) => ({
        default: mod.DialogDemoNoCloseButton,
      })),
    { ssr: false },
  ),
  "dialog-demo-scrollable-content": dynamic(
    () =>
      import("./demos/ui/dialog-demo").then((mod) => ({
        default: mod.DialogDemoScrollableContent,
      })),
    { ssr: false },
  ),
  "dialog-demo-with-form": dynamic(
    () =>
      import("./demos/ui/dialog-demo").then((mod) => ({
        default: mod.DialogDemoWithForm,
      })),
    { ssr: false },
  ),
  "dialog-demo-with-sticky-footer": dynamic(
    () =>
      import("./demos/ui/dialog-demo").then((mod) => ({
        default: mod.DialogDemoWithStickyFooter,
      })),
    { ssr: false },
  ),
  "dialog-demo-warning": dynamic(
    () =>
      import("./demos/ui/dialog-demo").then((mod) => ({
        default: mod.DialogDemoWarning,
      })),
    { ssr: false },
  ),
  "dialog-demo-destructive": dynamic(
    () =>
      import("./demos/ui/dialog-demo").then((mod) => ({
        default: mod.DialogDemoDestructive,
      })),
    { ssr: false },
  ),
  "dialog-demo-widths": dynamic(
    () =>
      import("./demos/ui/dialog-demo").then((mod) => ({
        default: mod.DialogDemoWidths,
      })),
    { ssr: false },
  ),
  // Tabs
  "tabs-demo-default": dynamic(
    () =>
      import("./demos/ui/tabs-demo").then((mod) => ({
        default: mod.TabsDemoDefault,
      })),
    { ssr: false },
  ),
  "tabs-demo-line": dynamic(
    () =>
      import("./demos/ui/tabs-demo").then((mod) => ({
        default: mod.TabsDemoLine,
      })),
    { ssr: false },
  ),
  "tabs-demo-vertical": dynamic(
    () =>
      import("./demos/ui/tabs-demo").then((mod) => ({
        default: mod.TabsDemoVertical,
      })),
    { ssr: false },
  ),
  "tabs-demo-disabled": dynamic(
    () =>
      import("./demos/ui/tabs-demo").then((mod) => ({
        default: mod.TabsDemoDisabled,
      })),
    { ssr: false },
  ),
  "tabs-demo-basic": dynamic(
    () =>
      import("./demos/ui/tabs-demo").then((mod) => ({
        default: mod.TabsDemoBasic,
      })),
    { ssr: false },
  ),
  "tabs-demo-icon-only": dynamic(
    () =>
      import("./demos/ui/tabs-demo").then((mod) => ({
        default: mod.TabsDemoIconOnly,
      })),
    { ssr: false },
  ),
  "tabs-demo-line-disabled": dynamic(
    () =>
      import("./demos/ui/tabs-demo").then((mod) => ({
        default: mod.TabsDemoLineDisabled,
      })),
    { ssr: false },
  ),
  "tabs-demo-line-with-content": dynamic(
    () =>
      import("./demos/ui/tabs-demo").then((mod) => ({
        default: mod.TabsDemoLineWithContent,
      })),
    { ssr: false },
  ),
  "tabs-demo-multiple": dynamic(
    () =>
      import("./demos/ui/tabs-demo").then((mod) => ({
        default: mod.TabsDemoMultiple,
      })),
    { ssr: false },
  ),
  "tabs-demo-variants-alignment": dynamic(
    () =>
      import("./demos/ui/tabs-demo").then((mod) => ({
        default: mod.TabsDemoVariantsAlignment,
      })),
    { ssr: false },
  ),
  "tabs-demo-with-content": dynamic(
    () =>
      import("./demos/ui/tabs-demo").then((mod) => ({
        default: mod.TabsDemoWithContent,
      })),
    { ssr: false },
  ),
  "tabs-demo-with-dropdown": dynamic(
    () =>
      import("./demos/ui/tabs-demo").then((mod) => ({
        default: mod.TabsDemoWithDropdown,
      })),
    { ssr: false },
  ),
  "tabs-demo-with-icons": dynamic(
    () =>
      import("./demos/ui/tabs-demo").then((mod) => ({
        default: mod.TabsDemoWithIcons,
      })),
    { ssr: false },
  ),
  "tabs-demo-with-input-and-button": dynamic(
    () =>
      import("./demos/ui/tabs-demo").then((mod) => ({
        default: mod.TabsDemoWithInputAndButton,
      })),
    { ssr: false },
  ),
  // Select
  "select-demo-default": dynamic(
    () =>
      import("./demos/ui/select-demo").then((mod) => ({
        default: mod.SelectDemoDefault,
      })),
    { ssr: false },
  ),
  "select-demo-grouped": dynamic(
    () =>
      import("./demos/ui/select-demo").then((mod) => ({
        default: mod.SelectDemoGrouped,
      })),
    { ssr: false },
  ),
  "select-demo-small": dynamic(
    () =>
      import("./demos/ui/select-demo").then((mod) => ({
        default: mod.SelectDemoSmall,
      })),
    { ssr: false },
  ),
  "select-demo-disabled": dynamic(
    () =>
      import("./demos/ui/select-demo").then((mod) => ({
        default: mod.SelectDemoDisabled,
      })),
    { ssr: false },
  ),
  "select-demo-basic": dynamic(
    () =>
      import("./demos/ui/select-demo").then((mod) => ({
        default: mod.SelectDemoBasic,
      })),
    { ssr: false },
  ),
  "select-demo-in-dialog": dynamic(
    () =>
      import("./demos/ui/select-demo").then((mod) => ({
        default: mod.SelectDemoInDialog,
      })),
    { ssr: false },
  ),
  "select-demo-inline-with-input-nativeselect": dynamic(
    () =>
      import("./demos/ui/select-demo").then((mod) => ({
        default: mod.SelectDemoInlineWithInputNativeselect,
      })),
    { ssr: false },
  ),
  "select-demo-invalid": dynamic(
    () =>
      import("./demos/ui/select-demo").then((mod) => ({
        default: mod.SelectDemoInvalid,
      })),
    { ssr: false },
  ),
  "select-demo-item-aligned": dynamic(
    () =>
      import("./demos/ui/select-demo").then((mod) => ({
        default: mod.SelectDemoItemAligned,
      })),
    { ssr: false },
  ),
  "select-demo-large-list": dynamic(
    () =>
      import("./demos/ui/select-demo").then((mod) => ({
        default: mod.SelectDemoLargeList,
      })),
    { ssr: false },
  ),
  "select-demo-multiple-selection": dynamic(
    () =>
      import("./demos/ui/select-demo").then((mod) => ({
        default: mod.SelectDemoMultipleSelection,
      })),
    { ssr: false },
  ),
  "select-demo-sides": dynamic(
    () =>
      import("./demos/ui/select-demo").then((mod) => ({
        default: mod.SelectDemoSides,
      })),
    { ssr: false },
  ),
  "select-demo-sizes": dynamic(
    () =>
      import("./demos/ui/select-demo").then((mod) => ({
        default: mod.SelectDemoSizes,
      })),
    { ssr: false },
  ),
  "select-demo-subscription-plan": dynamic(
    () =>
      import("./demos/ui/select-demo").then((mod) => ({
        default: mod.SelectDemoSubscriptionPlan,
      })),
    { ssr: false },
  ),
  "select-demo-with-button": dynamic(
    () =>
      import("./demos/ui/select-demo").then((mod) => ({
        default: mod.SelectDemoWithButton,
      })),
    { ssr: false },
  ),
  "select-demo-with-field": dynamic(
    () =>
      import("./demos/ui/select-demo").then((mod) => ({
        default: mod.SelectDemoWithField,
      })),
    { ssr: false },
  ),
  "select-demo-with-groups-labels": dynamic(
    () =>
      import("./demos/ui/select-demo").then((mod) => ({
        default: mod.SelectDemoWithGroupsLabels,
      })),
    { ssr: false },
  ),
  "select-demo-with-icons": dynamic(
    () =>
      import("./demos/ui/select-demo").then((mod) => ({
        default: mod.SelectDemoWithIcons,
      })),
    { ssr: false },
  ),
  // Checkbox
  "checkbox-demo-default": dynamic(
    () =>
      import("./demos/ui/checkbox-demo").then((mod) => ({
        default: mod.CheckboxDemoDefault,
      })),
    { ssr: false },
  ),
  "checkbox-demo-checked": dynamic(
    () =>
      import("./demos/ui/checkbox-demo").then((mod) => ({
        default: mod.CheckboxDemoChecked,
      })),
    { ssr: false },
  ),
  "checkbox-demo-disabled": dynamic(
    () =>
      import("./demos/ui/checkbox-demo").then((mod) => ({
        default: mod.CheckboxDemoDisabled,
      })),
    { ssr: false },
  ),
  "checkbox-demo-with-description": dynamic(
    () =>
      import("./demos/ui/checkbox-demo").then((mod) => ({
        default: mod.CheckboxDemoWithDescription,
      })),
    { ssr: false },
  ),
  "checkbox-demo-basic": dynamic(
    () =>
      import("./demos/ui/checkbox-demo").then((mod) => ({
        default: mod.CheckboxDemoBasic,
      })),
    { ssr: false },
  ),
  "checkbox-demo-disabled-full": dynamic(
    () =>
      import("./demos/ui/checkbox-demo").then((mod) => ({
        default: mod.CheckboxDemoDisabledFull,
      })),
    { ssr: false },
  ),
  "checkbox-demo-group": dynamic(
    () =>
      import("./demos/ui/checkbox-demo").then((mod) => ({
        default: mod.CheckboxDemoGroup,
      })),
    { ssr: false },
  ),
  "checkbox-demo-in-table": dynamic(
    () =>
      import("./demos/ui/checkbox-demo").then((mod) => ({
        default: mod.CheckboxDemoInTable,
      })),
    { ssr: false },
  ),
  "checkbox-demo-invalid": dynamic(
    () =>
      import("./demos/ui/checkbox-demo").then((mod) => ({
        default: mod.CheckboxDemoInvalid,
      })),
    { ssr: false },
  ),
  "checkbox-demo-with-description-full": dynamic(
    () =>
      import("./demos/ui/checkbox-demo").then((mod) => ({
        default: mod.CheckboxDemoWithDescriptionFull,
      })),
    { ssr: false },
  ),
  "checkbox-demo-with-title": dynamic(
    () =>
      import("./demos/ui/checkbox-demo").then((mod) => ({
        default: mod.CheckboxDemoWithTitle,
      })),
    { ssr: false },
  ),
  // Radio Group
  "radio-group-demo-default": dynamic(
    () =>
      import("./demos/ui/radio-group-demo").then((mod) => ({
        default: mod.RadioGroupDemoDefault,
      })),
    { ssr: false },
  ),
  "radio-group-demo-horizontal": dynamic(
    () =>
      import("./demos/ui/radio-group-demo").then((mod) => ({
        default: mod.RadioGroupDemoHorizontal,
      })),
    { ssr: false },
  ),
  "radio-group-demo-disabled": dynamic(
    () =>
      import("./demos/ui/radio-group-demo").then((mod) => ({
        default: mod.RadioGroupDemoDisabled,
      })),
    { ssr: false },
  ),
  "radio-group-demo-basic": dynamic(
    () =>
      import("./demos/ui/radio-group-demo").then((mod) => ({
        default: mod.RadioGroupDemoBasic,
      })),
    { ssr: false },
  ),
  "radio-group-demo-grid-layout": dynamic(
    () =>
      import("./demos/ui/radio-group-demo").then((mod) => ({
        default: mod.RadioGroupDemoGridLayout,
      })),
    { ssr: false },
  ),
  "radio-group-demo-invalid": dynamic(
    () =>
      import("./demos/ui/radio-group-demo").then((mod) => ({
        default: mod.RadioGroupDemoInvalid,
      })),
    { ssr: false },
  ),
  "radio-group-demo-with-descriptions": dynamic(
    () =>
      import("./demos/ui/radio-group-demo").then((mod) => ({
        default: mod.RadioGroupDemoWithDescriptions,
      })),
    { ssr: false },
  ),
  "radio-group-demo-with-fieldset": dynamic(
    () =>
      import("./demos/ui/radio-group-demo").then((mod) => ({
        default: mod.RadioGroupDemoWithFieldset,
      })),
    { ssr: false },
  ),
  // Switch
  "switch-demo-default": dynamic(
    () =>
      import("./demos/ui/switch-demo").then((mod) => ({
        default: mod.SwitchDemoDefault,
      })),
    { ssr: false },
  ),
  "switch-demo-small": dynamic(
    () =>
      import("./demos/ui/switch-demo").then((mod) => ({
        default: mod.SwitchDemoSmall,
      })),
    { ssr: false },
  ),
  "switch-demo-checked": dynamic(
    () =>
      import("./demos/ui/switch-demo").then((mod) => ({
        default: mod.SwitchDemoChecked,
      })),
    { ssr: false },
  ),
  "switch-demo-disabled": dynamic(
    () =>
      import("./demos/ui/switch-demo").then((mod) => ({
        default: mod.SwitchDemoDisabled,
      })),
    { ssr: false },
  ),
  "switch-demo-basic": dynamic(
    () =>
      import("./demos/ui/switch-demo").then((mod) => ({
        default: mod.SwitchDemoBasic,
      })),
    { ssr: false },
  ),
  "switch-demo-sizes": dynamic(
    () =>
      import("./demos/ui/switch-demo").then((mod) => ({
        default: mod.SwitchDemoSizes,
      })),
    { ssr: false },
  ),
  "switch-demo-with-description": dynamic(
    () =>
      import("./demos/ui/switch-demo").then((mod) => ({
        default: mod.SwitchDemoWithDescription,
      })),
    { ssr: false },
  ),
  // Toggle
  "toggle-demo-default": dynamic(
    () =>
      import("./demos/ui/toggle-demo").then((mod) => ({
        default: mod.ToggleDemoDefault,
      })),
    { ssr: false },
  ),
  "toggle-demo-outline": dynamic(
    () =>
      import("./demos/ui/toggle-demo").then((mod) => ({
        default: mod.ToggleDemoOutline,
      })),
    { ssr: false },
  ),
  "toggle-demo-with-text": dynamic(
    () =>
      import("./demos/ui/toggle-demo").then((mod) => ({
        default: mod.ToggleDemoWithText,
      })),
    { ssr: false },
  ),
  "toggle-demo-sizes": dynamic(
    () =>
      import("./demos/ui/toggle-demo").then((mod) => ({
        default: mod.ToggleDemoSizes,
      })),
    { ssr: false },
  ),
  "toggle-demo-basic": dynamic(
    () =>
      import("./demos/ui/toggle-demo").then((mod) => ({
        default: mod.ToggleDemoBasic,
      })),
    { ssr: false },
  ),
  "toggle-demo-disabled": dynamic(
    () =>
      import("./demos/ui/toggle-demo").then((mod) => ({
        default: mod.ToggleDemoDisabled,
      })),
    { ssr: false },
  ),
  "toggle-demo-with-button-icon-text": dynamic(
    () =>
      import("./demos/ui/toggle-demo").then((mod) => ({
        default: mod.ToggleDemoWithButtonIconText,
      })),
    { ssr: false },
  ),
  "toggle-demo-with-button-icon": dynamic(
    () =>
      import("./demos/ui/toggle-demo").then((mod) => ({
        default: mod.ToggleDemoWithButtonIcon,
      })),
    { ssr: false },
  ),
  "toggle-demo-with-button-text": dynamic(
    () =>
      import("./demos/ui/toggle-demo").then((mod) => ({
        default: mod.ToggleDemoWithButtonText,
      })),
    { ssr: false },
  ),
  "toggle-demo-with-icon": dynamic(
    () =>
      import("./demos/ui/toggle-demo").then((mod) => ({
        default: mod.ToggleDemoWithIcon,
      })),
    { ssr: false },
  ),
  // Toggle Group
  "toggle-group-demo-default": dynamic(
    () =>
      import("./demos/ui/toggle-group-demo").then((mod) => ({
        default: mod.ToggleGroupDemoDefault,
      })),
    { ssr: false },
  ),
  "toggle-group-demo-outline": dynamic(
    () =>
      import("./demos/ui/toggle-group-demo").then((mod) => ({
        default: mod.ToggleGroupDemoOutline,
      })),
    { ssr: false },
  ),
  "toggle-group-demo-multiple": dynamic(
    () =>
      import("./demos/ui/toggle-group-demo").then((mod) => ({
        default: mod.ToggleGroupDemoMultiple,
      })),
    { ssr: false },
  ),
  "toggle-group-demo-basic": dynamic(
    () =>
      import("./demos/ui/toggle-group-demo").then((mod) => ({
        default: mod.ToggleGroupDemoBasic,
      })),
    { ssr: false },
  ),
  "toggle-group-demo-date-range": dynamic(
    () =>
      import("./demos/ui/toggle-group-demo").then((mod) => ({
        default: mod.ToggleGroupDemoDateRange,
      })),
    { ssr: false },
  ),
  "toggle-group-demo-filter": dynamic(
    () =>
      import("./demos/ui/toggle-group-demo").then((mod) => ({
        default: mod.ToggleGroupDemoFilter,
      })),
    { ssr: false },
  ),
  "toggle-group-demo-outline-with-icons": dynamic(
    () =>
      import("./demos/ui/toggle-group-demo").then((mod) => ({
        default: mod.ToggleGroupDemoOutlineWithIcons,
      })),
    { ssr: false },
  ),
  "toggle-group-demo-sizes": dynamic(
    () =>
      import("./demos/ui/toggle-group-demo").then((mod) => ({
        default: mod.ToggleGroupDemoSizes,
      })),
    { ssr: false },
  ),
  "toggle-group-demo-sort": dynamic(
    () =>
      import("./demos/ui/toggle-group-demo").then((mod) => ({
        default: mod.ToggleGroupDemoSort,
      })),
    { ssr: false },
  ),
  "toggle-group-demo-vertical-outline-with-icons": dynamic(
    () =>
      import("./demos/ui/toggle-group-demo").then((mod) => ({
        default: mod.ToggleGroupDemoVerticalOutlineWithIcons,
      })),
    { ssr: false },
  ),
  "toggle-group-demo-vertical-outline": dynamic(
    () =>
      import("./demos/ui/toggle-group-demo").then((mod) => ({
        default: mod.ToggleGroupDemoVerticalOutline,
      })),
    { ssr: false },
  ),
  "toggle-group-demo-vertical-with-spacing": dynamic(
    () =>
      import("./demos/ui/toggle-group-demo").then((mod) => ({
        default: mod.ToggleGroupDemoVerticalWithSpacing,
      })),
    { ssr: false },
  ),
  "toggle-group-demo-vertical": dynamic(
    () =>
      import("./demos/ui/toggle-group-demo").then((mod) => ({
        default: mod.ToggleGroupDemoVertical,
      })),
    { ssr: false },
  ),
  "toggle-group-demo-with-icons": dynamic(
    () =>
      import("./demos/ui/toggle-group-demo").then((mod) => ({
        default: mod.ToggleGroupDemoWithIcons,
      })),
    { ssr: false },
  ),
  "toggle-group-demo-with-input-and-select": dynamic(
    () =>
      import("./demos/ui/toggle-group-demo").then((mod) => ({
        default: mod.ToggleGroupDemoWithInputAndSelect,
      })),
    { ssr: false },
  ),
  "toggle-group-demo-with-spacing": dynamic(
    () =>
      import("./demos/ui/toggle-group-demo").then((mod) => ({
        default: mod.ToggleGroupDemoWithSpacing,
      })),
    { ssr: false },
  ),
  // Label
  "label-demo-default": dynamic(
    () =>
      import("./demos/ui/label-demo").then((mod) => ({
        default: mod.LabelDemoDefault,
      })),
    { ssr: false },
  ),
  "label-demo-with-input": dynamic(
    () =>
      import("./demos/ui/label-demo").then((mod) => ({
        default: mod.LabelDemoWithInput,
      })),
    { ssr: false },
  ),
  "label-demo-disabled": dynamic(
    () =>
      import("./demos/ui/label-demo").then((mod) => ({
        default: mod.LabelDemoDisabled,
      })),
    { ssr: false },
  ),
  "label-demo-with-checkbox": dynamic(
    () =>
      import("./demos/ui/label-demo").then((mod) => ({
        default: mod.LabelDemoWithCheckbox,
      })),
    { ssr: false },
  ),
  "label-demo-with-textarea": dynamic(
    () =>
      import("./demos/ui/label-demo").then((mod) => ({
        default: mod.LabelDemoWithTextarea,
      })),
    { ssr: false },
  ),
  // Field
  "field-demo-default": dynamic(
    () =>
      import("./demos/ui/field-demo").then((mod) => ({
        default: mod.FieldDemoDefault,
      })),
    { ssr: false },
  ),
  "field-demo-error": dynamic(
    () =>
      import("./demos/ui/field-demo").then((mod) => ({
        default: mod.FieldDemoError,
      })),
    { ssr: false },
  ),
  "field-demo-horizontal": dynamic(
    () =>
      import("./demos/ui/field-demo").then((mod) => ({
        default: mod.FieldDemoHorizontal,
      })),
    { ssr: false },
  ),
  "field-demo-fieldset": dynamic(
    () =>
      import("./demos/ui/field-demo").then((mod) => ({
        default: mod.FieldDemoFieldset,
      })),
    { ssr: false },
  ),
  "field-demo-checkbox-fields": dynamic(
    () =>
      import("./demos/ui/field-demo").then((mod) => ({
        default: mod.FieldDemoCheckboxFields,
      })),
    { ssr: false },
  ),
  "field-demo-horizontal-fields": dynamic(
    () =>
      import("./demos/ui/field-demo").then((mod) => ({
        default: mod.FieldDemoHorizontalFields,
      })),
    { ssr: false },
  ),
  "field-demo-input-fields": dynamic(
    () =>
      import("./demos/ui/field-demo").then((mod) => ({
        default: mod.FieldDemoInputFields,
      })),
    { ssr: false },
  ),
  "field-demo-native-select-fields": dynamic(
    () =>
      import("./demos/ui/field-demo").then((mod) => ({
        default: mod.FieldDemoNativeSelectFields,
      })),
    { ssr: false },
  ),
  "field-demo-otp-input-fields": dynamic(
    () =>
      import("./demos/ui/field-demo").then((mod) => ({
        default: mod.FieldDemoOtpInputFields,
      })),
    { ssr: false },
  ),
  "field-demo-radio-fields": dynamic(
    () =>
      import("./demos/ui/field-demo").then((mod) => ({
        default: mod.FieldDemoRadioFields,
      })),
    { ssr: false },
  ),
  "field-demo-select-fields": dynamic(
    () =>
      import("./demos/ui/field-demo").then((mod) => ({
        default: mod.FieldDemoSelectFields,
      })),
    { ssr: false },
  ),
  "field-demo-slider-fields": dynamic(
    () =>
      import("./demos/ui/field-demo").then((mod) => ({
        default: mod.FieldDemoSliderFields,
      })),
    { ssr: false },
  ),
  "field-demo-switch-fields": dynamic(
    () =>
      import("./demos/ui/field-demo").then((mod) => ({
        default: mod.FieldDemoSwitchFields,
      })),
    { ssr: false },
  ),
  "field-demo-textarea-fields": dynamic(
    () =>
      import("./demos/ui/field-demo").then((mod) => ({
        default: mod.FieldDemoTextareaFields,
      })),
    { ssr: false },
  ),
  "field-demo-text-field": dynamic(
    () =>
      import("./demos/ui/field-demo").then((mod) => ({
        default: mod.FieldDemoTextField,
      })),
    { ssr: false },
  ),
  "field-demo-text-field-disabled": dynamic(
    () =>
      import("./demos/ui/field-demo").then((mod) => ({
        default: mod.FieldDemoTextFieldDisabled,
      })),
    { ssr: false },
  ),
  "field-demo-text-field-invalid": dynamic(
    () =>
      import("./demos/ui/field-demo").then((mod) => ({
        default: mod.FieldDemoTextFieldInvalid,
      })),
    { ssr: false },
  ),
  "field-demo-text-field-variants": dynamic(
    () =>
      import("./demos/ui/field-demo").then((mod) => ({
        default: mod.FieldDemoTextFieldVariants,
      })),
    { ssr: false },
  ),
  "field-demo-textarea": dynamic(
    () =>
      import("./demos/ui/field-demo").then((mod) => ({
        default: mod.FieldDemoTextarea,
      })),
    { ssr: false },
  ),
  "field-demo-textarea-disabled": dynamic(
    () =>
      import("./demos/ui/field-demo").then((mod) => ({
        default: mod.FieldDemoTextareaDisabled,
      })),
    { ssr: false },
  ),
  "field-demo-textarea-invalid": dynamic(
    () =>
      import("./demos/ui/field-demo").then((mod) => ({
        default: mod.FieldDemoTextareaInvalid,
      })),
    { ssr: false },
  ),
  "field-demo-form": dynamic(
    () =>
      import("./demos/ui/field-demo").then((mod) => ({
        default: mod.FieldDemoForm,
      })),
    { ssr: false },
  ),
  "field-demo-input-types": dynamic(
    () =>
      import("./demos/ui/field-demo").then((mod) => ({
        default: mod.FieldDemoInputTypes,
      })),
    { ssr: false },
  ),
  // Footer
  "footer-demo-default": dynamic(
    () =>
      import("./demos/ui/footer-demo").then((mod) => ({
        default: mod.FooterDemoDefault,
      })),
    { ssr: false },
  ),
  "footer-demo-custom-text": dynamic(
    () =>
      import("./demos/ui/footer-demo").then((mod) => ({
        default: mod.FooterDemoCustomText,
      })),
    { ssr: false },
  ),
  "footer-demo-no-icon": dynamic(
    () =>
      import("./demos/ui/footer-demo").then((mod) => ({
        default: mod.FooterDemoNoIcon,
      })),
    { ssr: false },
  ),
  "footer-demo-keyboard-hints": dynamic(
    () =>
      import("./demos/ui/footer-demo").then((mod) => ({
        default: mod.FooterDemoKeyboardHints,
      })),
    { ssr: false },
  ),
  // Native Select
  "native-select-demo-default": dynamic(
    () =>
      import("./demos/ui/native-select-demo").then((mod) => ({
        default: mod.NativeSelectDemoDefault,
      })),
    { ssr: false },
  ),
  "native-select-demo-small": dynamic(
    () =>
      import("./demos/ui/native-select-demo").then((mod) => ({
        default: mod.NativeSelectDemoSmall,
      })),
    { ssr: false },
  ),
  "native-select-demo-disabled": dynamic(
    () =>
      import("./demos/ui/native-select-demo").then((mod) => ({
        default: mod.NativeSelectDemoDisabled,
      })),
    { ssr: false },
  ),
  "native-select-demo-basic": dynamic(
    () =>
      import("./demos/ui/native-select-demo").then((mod) => ({
        default: mod.NativeSelectDemoBasic,
      })),
    { ssr: false },
  ),
  "native-select-demo-invalid": dynamic(
    () =>
      import("./demos/ui/native-select-demo").then((mod) => ({
        default: mod.NativeSelectDemoInvalid,
      })),
    { ssr: false },
  ),
  "native-select-demo-sizes": dynamic(
    () =>
      import("./demos/ui/native-select-demo").then((mod) => ({
        default: mod.NativeSelectDemoSizes,
      })),
    { ssr: false },
  ),
  "native-select-demo-with-field": dynamic(
    () =>
      import("./demos/ui/native-select-demo").then((mod) => ({
        default: mod.NativeSelectDemoWithField,
      })),
    { ssr: false },
  ),
  "native-select-demo-with-groups": dynamic(
    () =>
      import("./demos/ui/native-select-demo").then((mod) => ({
        default: mod.NativeSelectDemoWithGroups,
      })),
    { ssr: false },
  ),
  // Input OTP
  "input-otp-demo-default": dynamic(
    () =>
      import("./demos/ui/input-otp-demo").then((mod) => ({
        default: mod.InputOtpDemoDefault,
      })),
    { ssr: false },
  ),
  "input-otp-demo-with-separator": dynamic(
    () =>
      import("./demos/ui/input-otp-demo").then((mod) => ({
        default: mod.InputOtpDemoWithSeparator,
      })),
    { ssr: false },
  ),
  "input-otp-demo-pattern": dynamic(
    () =>
      import("./demos/ui/input-otp-demo").then((mod) => ({
        default: mod.InputOtpDemoPattern,
      })),
    { ssr: false },
  ),
  "input-otp-demo-4-digits": dynamic(
    () =>
      import("./demos/ui/input-otp-demo").then((mod) => ({
        default: mod.InputOtpDemo4Digits,
      })),
    { ssr: false },
  ),
  "input-otp-demo-alphanumeric": dynamic(
    () =>
      import("./demos/ui/input-otp-demo").then((mod) => ({
        default: mod.InputOtpDemoAlphanumeric,
      })),
    { ssr: false },
  ),
  "input-otp-demo-digits-only": dynamic(
    () =>
      import("./demos/ui/input-otp-demo").then((mod) => ({
        default: mod.InputOtpDemoDigitsOnly,
      })),
    { ssr: false },
  ),
  "input-otp-demo-disabled": dynamic(
    () =>
      import("./demos/ui/input-otp-demo").then((mod) => ({
        default: mod.InputOtpDemoDisabled,
      })),
    { ssr: false },
  ),
  "input-otp-demo-form": dynamic(
    () =>
      import("./demos/ui/input-otp-demo").then((mod) => ({
        default: mod.InputOtpDemoForm,
      })),
    { ssr: false },
  ),
  "input-otp-demo-invalid-state": dynamic(
    () =>
      import("./demos/ui/input-otp-demo").then((mod) => ({
        default: mod.InputOtpDemoInvalidState,
      })),
    { ssr: false },
  ),
  "input-otp-demo-simple": dynamic(
    () =>
      import("./demos/ui/input-otp-demo").then((mod) => ({
        default: mod.InputOtpDemoSimple,
      })),
    { ssr: false },
  ),
  // Alert Dialog
  "alert-dialog-demo-default": dynamic(
    () =>
      import("./demos/ui/alert-dialog-demo").then((mod) => ({
        default: mod.AlertDialogDemoDefault,
      })),
    { ssr: false },
  ),
  "alert-dialog-demo-destructive": dynamic(
    () =>
      import("./demos/ui/alert-dialog-demo").then((mod) => ({
        default: mod.AlertDialogDemoDestructive,
      })),
    { ssr: false },
  ),
  "alert-dialog-demo-small": dynamic(
    () =>
      import("./demos/ui/alert-dialog-demo").then((mod) => ({
        default: mod.AlertDialogDemoSmall,
      })),
    { ssr: false },
  ),
  "alert-dialog-demo-custom-actions": dynamic(
    () =>
      import("./demos/ui/alert-dialog-demo").then((mod) => ({
        default: mod.AlertDialogDemoCustomActions,
      })),
    { ssr: false },
  ),
  "alert-dialog-demo-basic": dynamic(
    () =>
      import("./demos/ui/alert-dialog-demo").then((mod) => ({
        default: mod.AlertDialogDemoBasic,
      })),
    { ssr: false },
  ),
  "alert-dialog-demo-in-dialog": dynamic(
    () =>
      import("./demos/ui/alert-dialog-demo").then((mod) => ({
        default: mod.AlertDialogDemoInDialog,
      })),
    { ssr: false },
  ),
  "alert-dialog-demo-small-with-media": dynamic(
    () =>
      import("./demos/ui/alert-dialog-demo").then((mod) => ({
        default: mod.AlertDialogDemoSmallWithMedia,
      })),
    { ssr: false },
  ),
  "alert-dialog-demo-with-media": dynamic(
    () =>
      import("./demos/ui/alert-dialog-demo").then((mod) => ({
        default: mod.AlertDialogDemoWithMedia,
      })),
    { ssr: false },
  ),
  // Popover
  "popover-demo-default": dynamic(
    () =>
      import("./demos/ui/popover-demo").then((mod) => ({
        default: mod.PopoverDemoDefault,
      })),
    { ssr: false },
  ),
  "popover-demo-with-form": dynamic(
    () =>
      import("./demos/ui/popover-demo").then((mod) => ({
        default: mod.PopoverDemoWithForm,
      })),
    { ssr: false },
  ),
  "popover-demo-placement": dynamic(
    () =>
      import("./demos/ui/popover-demo").then((mod) => ({
        default: mod.PopoverDemoPlacement,
      })),
    { ssr: false },
  ),
  "popover-demo-alignments": dynamic(
    () =>
      import("./demos/ui/popover-demo").then((mod) => ({
        default: mod.PopoverDemoAlignments,
      })),
    { ssr: false },
  ),
  "popover-demo-basic": dynamic(
    () =>
      import("./demos/ui/popover-demo").then((mod) => ({
        default: mod.PopoverDemoBasic,
      })),
    { ssr: false },
  ),
  "popover-demo-in-dialog": dynamic(
    () =>
      import("./demos/ui/popover-demo").then((mod) => ({
        default: mod.PopoverDemoInDialog,
      })),
    { ssr: false },
  ),
  "popover-demo-sides": dynamic(
    () =>
      import("./demos/ui/popover-demo").then((mod) => ({
        default: mod.PopoverDemoSides,
      })),
    { ssr: false },
  ),
  // Tooltip
  "tooltip-demo-default": dynamic(
    () =>
      import("./demos/ui/tooltip-demo").then((mod) => ({
        default: mod.TooltipDemoDefault,
      })),
    { ssr: false },
  ),
  "tooltip-demo-side": dynamic(
    () =>
      import("./demos/ui/tooltip-demo").then((mod) => ({
        default: mod.TooltipDemoSide,
      })),
    { ssr: false },
  ),
  "tooltip-demo-icon-button": dynamic(
    () =>
      import("./demos/ui/tooltip-demo").then((mod) => ({
        default: mod.TooltipDemoIconButton,
      })),
    { ssr: false },
  ),
  "tooltip-demo-basic": dynamic(
    () =>
      import("./demos/ui/tooltip-demo").then((mod) => ({
        default: mod.TooltipDemoBasic,
      })),
    { ssr: false },
  ),
  "tooltip-demo-disabled": dynamic(
    () =>
      import("./demos/ui/tooltip-demo").then((mod) => ({
        default: mod.TooltipDemoDisabled,
      })),
    { ssr: false },
  ),
  "tooltip-demo-formatted-content": dynamic(
    () =>
      import("./demos/ui/tooltip-demo").then((mod) => ({
        default: mod.TooltipDemoFormattedContent,
      })),
    { ssr: false },
  ),
  "tooltip-demo-long-content": dynamic(
    () =>
      import("./demos/ui/tooltip-demo").then((mod) => ({
        default: mod.TooltipDemoLongContent,
      })),
    { ssr: false },
  ),
  "tooltip-demo-on-link": dynamic(
    () =>
      import("./demos/ui/tooltip-demo").then((mod) => ({
        default: mod.TooltipDemoOnLink,
      })),
    { ssr: false },
  ),
  "tooltip-demo-sides": dynamic(
    () =>
      import("./demos/ui/tooltip-demo").then((mod) => ({
        default: mod.TooltipDemoSides,
      })),
    { ssr: false },
  ),
  "tooltip-demo-with-icon": dynamic(
    () =>
      import("./demos/ui/tooltip-demo").then((mod) => ({
        default: mod.TooltipDemoWithIcon,
      })),
    { ssr: false },
  ),
  "tooltip-demo-with-keyboard-shortcut": dynamic(
    () =>
      import("./demos/ui/tooltip-demo").then((mod) => ({
        default: mod.TooltipDemoWithKeyboardShortcut,
      })),
    { ssr: false },
  ),
  // Hover Card
  "hover-card-demo-default": dynamic(
    () =>
      import("./demos/ui/hover-card-demo").then((mod) => ({
        default: mod.HoverCardDemoDefault,
      })),
    { ssr: false },
  ),
  "hover-card-demo-button": dynamic(
    () =>
      import("./demos/ui/hover-card-demo").then((mod) => ({
        default: mod.HoverCardDemoButton,
      })),
    { ssr: false },
  ),
  "hover-card-demo-inline-message": dynamic(
    () =>
      import("./demos/ui/hover-card-demo").then((mod) => ({
        default: mod.HoverCardDemoInlineMessage,
      })),
    { ssr: false },
  ),
  "hover-card-demo-placement": dynamic(
    () =>
      import("./demos/ui/hover-card-demo").then((mod) => ({
        default: mod.HoverCardDemoPlacement,
      })),
    { ssr: false },
  ),
  "hover-card-demo-sides": dynamic(
    () =>
      import("./demos/ui/hover-card-demo").then((mod) => ({
        default: mod.HoverCardDemoSides,
      })),
    { ssr: false },
  ),
  // Sheet
  "sheet-demo-default": dynamic(
    () =>
      import("./demos/ui/sheet-demo").then((mod) => ({
        default: mod.SheetDemoDefault,
      })),
    { ssr: false },
  ),
  "sheet-demo-left": dynamic(
    () =>
      import("./demos/ui/sheet-demo").then((mod) => ({
        default: mod.SheetDemoLeft,
      })),
    { ssr: false },
  ),
  "sheet-demo-top": dynamic(
    () =>
      import("./demos/ui/sheet-demo").then((mod) => ({
        default: mod.SheetDemoTop,
      })),
    { ssr: false },
  ),
  "sheet-demo-no-close": dynamic(
    () =>
      import("./demos/ui/sheet-demo").then((mod) => ({
        default: mod.SheetDemoNoClose,
      })),
    { ssr: false },
  ),
  "sheet-demo-no-close-button": dynamic(
    () =>
      import("./demos/ui/sheet-demo").then((mod) => ({
        default: mod.SheetDemoNoCloseButton,
      })),
    { ssr: false },
  ),
  "sheet-demo-sides": dynamic(
    () =>
      import("./demos/ui/sheet-demo").then((mod) => ({
        default: mod.SheetDemoSides,
      })),
    { ssr: false },
  ),
  "sheet-demo-with-form": dynamic(
    () =>
      import("./demos/ui/sheet-demo").then((mod) => ({
        default: mod.SheetDemoWithForm,
      })),
    { ssr: false },
  ),
  // Drawer
  "drawer-demo-default": dynamic(
    () =>
      import("./demos/ui/drawer-demo").then((mod) => ({
        default: mod.DrawerDemoDefault,
      })),
    { ssr: false },
  ),
  "drawer-demo-with-form": dynamic(
    () =>
      import("./demos/ui/drawer-demo").then((mod) => ({
        default: mod.DrawerDemoWithForm,
      })),
    { ssr: false },
  ),
  "drawer-demo-right": dynamic(
    () =>
      import("./demos/ui/drawer-demo").then((mod) => ({
        default: mod.DrawerDemoRight,
      })),
    { ssr: false },
  ),
  "drawer-demo-scrollable-content": dynamic(
    () =>
      import("./demos/ui/drawer-demo").then((mod) => ({
        default: mod.DrawerDemoScrollableContent,
      })),
    { ssr: false },
  ),
  "drawer-demo-sides": dynamic(
    () =>
      import("./demos/ui/drawer-demo").then((mod) => ({
        default: mod.DrawerDemoSides,
      })),
    { ssr: false },
  ),
  // Collapsible
  "collapsible-demo-default": dynamic(
    () =>
      import("./demos/ui/collapsible-demo").then((mod) => ({
        default: mod.CollapsibleDemoDefault,
      })),
    { ssr: false },
  ),
  "collapsible-demo-open": dynamic(
    () =>
      import("./demos/ui/collapsible-demo").then((mod) => ({
        default: mod.CollapsibleDemoOpen,
      })),
    { ssr: false },
  ),
  "collapsible-demo-styled": dynamic(
    () =>
      import("./demos/ui/collapsible-demo").then((mod) => ({
        default: mod.CollapsibleDemoStyled,
      })),
    { ssr: false },
  ),
  "collapsible-demo-file-tree": dynamic(
    () =>
      import("./demos/ui/collapsible-demo").then((mod) => ({
        default: mod.CollapsibleDemoFileTree,
      })),
    { ssr: false },
  ),
  "collapsible-demo-settings": dynamic(
    () =>
      import("./demos/ui/collapsible-demo").then((mod) => ({
        default: mod.CollapsibleDemoSettings,
      })),
    { ssr: false },
  ),
  // Breadcrumb
  "breadcrumb-demo-default": dynamic(
    () =>
      import("./demos/ui/breadcrumb-demo").then((mod) => ({
        default: mod.BreadcrumbDemoDefault,
      })),
    { ssr: false },
  ),
  "breadcrumb-demo-ellipsis": dynamic(
    () =>
      import("./demos/ui/breadcrumb-demo").then((mod) => ({
        default: mod.BreadcrumbDemoEllipsis,
      })),
    { ssr: false },
  ),
  "breadcrumb-demo-custom-separator": dynamic(
    () =>
      import("./demos/ui/breadcrumb-demo").then((mod) => ({
        default: mod.BreadcrumbDemoCustomSeparator,
      })),
    { ssr: false },
  ),
  "breadcrumb-demo-basic": dynamic(
    () =>
      import("./demos/ui/breadcrumb-demo").then((mod) => ({
        default: mod.BreadcrumbDemoBasic,
      })),
    { ssr: false },
  ),
  "breadcrumb-demo-with-slots": dynamic(
    () =>
      import("./demos/ui/breadcrumb-demo").then((mod) => ({
        default: mod.BreadcrumbDemoWithSlots,
      })),
    { ssr: false },
  ),
  "breadcrumb-demo-with-dropdown": dynamic(
    () =>
      import("./demos/ui/breadcrumb-demo").then((mod) => ({
        default: mod.BreadcrumbDemoWithDropdown,
      })),
    { ssr: false },
  ),
  "breadcrumb-demo-with-link": dynamic(
    () =>
      import("./demos/ui/breadcrumb-demo").then((mod) => ({
        default: mod.BreadcrumbDemoWithLink,
      })),
    { ssr: false },
  ),
  // Pagination
  "pagination-demo-default": dynamic(
    () =>
      import("./demos/ui/pagination-demo").then((mod) => ({
        default: mod.PaginationDemoDefault,
      })),
    { ssr: false },
  ),
  "pagination-demo-with-ellipsis": dynamic(
    () =>
      import("./demos/ui/pagination-demo").then((mod) => ({
        default: mod.PaginationDemoWithEllipsis,
      })),
    { ssr: false },
  ),
  "pagination-demo-simple": dynamic(
    () =>
      import("./demos/ui/pagination-demo").then((mod) => ({
        default: mod.PaginationDemoSimple,
      })),
    { ssr: false },
  ),
  "pagination-demo-basic": dynamic(
    () =>
      import("./demos/ui/pagination-demo").then((mod) => ({
        default: mod.PaginationDemoBasic,
      })),
    { ssr: false },
  ),
  "pagination-demo-with-select": dynamic(
    () =>
      import("./demos/ui/pagination-demo").then((mod) => ({
        default: mod.PaginationDemoWithSelect,
      })),
    { ssr: false },
  ),
  // Accordion
  "accordion-demo-default": dynamic(
    () =>
      import("./demos/ui/accordion-demo").then((mod) => ({
        default: mod.AccordionDemoDefault,
      })),
    { ssr: false },
  ),
  "accordion-demo-open": dynamic(
    () =>
      import("./demos/ui/accordion-demo").then((mod) => ({
        default: mod.AccordionDemoOpen,
      })),
    { ssr: false },
  ),
  "accordion-demo-multiple": dynamic(
    () =>
      import("./demos/ui/accordion-demo").then((mod) => ({
        default: mod.AccordionDemoMultiple,
      })),
    { ssr: false },
  ),
  "accordion-demo-basic": dynamic(
    () =>
      import("./demos/ui/accordion-demo").then((mod) => ({
        default: mod.AccordionDemoBasic,
      })),
    { ssr: false },
  ),
  "accordion-demo-in-card": dynamic(
    () =>
      import("./demos/ui/accordion-demo").then((mod) => ({
        default: mod.AccordionDemoInCard,
      })),
    { ssr: false },
  ),
  "accordion-demo-with-borders": dynamic(
    () =>
      import("./demos/ui/accordion-demo").then((mod) => ({
        default: mod.AccordionDemoWithBorders,
      })),
    { ssr: false },
  ),
  "accordion-demo-with-disabled": dynamic(
    () =>
      import("./demos/ui/accordion-demo").then((mod) => ({
        default: mod.AccordionDemoWithDisabled,
      })),
    { ssr: false },
  ),
  // Separator
  "separator-demo-default": dynamic(
    () =>
      import("./demos/ui/separator-demo").then((mod) => ({
        default: mod.SeparatorDemoDefault,
      })),
    { ssr: false },
  ),
  "separator-demo-vertical": dynamic(
    () =>
      import("./demos/ui/separator-demo").then((mod) => ({
        default: mod.SeparatorDemoVertical,
      })),
    { ssr: false },
  ),
  "separator-demo-horizontal": dynamic(
    () =>
      import("./demos/ui/separator-demo").then((mod) => ({
        default: mod.SeparatorDemoHorizontal,
      })),
    { ssr: false },
  ),
  "separator-demo-in-list": dynamic(
    () =>
      import("./demos/ui/separator-demo").then((mod) => ({
        default: mod.SeparatorDemoInList,
      })),
    { ssr: false },
  ),
  "separator-demo-vertical-menu": dynamic(
    () =>
      import("./demos/ui/separator-demo").then((mod) => ({
        default: mod.SeparatorDemoVerticalMenu,
      })),
    { ssr: false },
  ),
  // Navigation Menu
  "navigation-menu-demo-default": dynamic(
    () =>
      import("./demos/ui/navigation-menu-demo").then((mod) => ({
        default: mod.NavigationMenuDemoDefault,
      })),
    { ssr: false },
  ),
  "navigation-menu-demo-with-trigger": dynamic(
    () =>
      import("./demos/ui/navigation-menu-demo").then((mod) => ({
        default: mod.NavigationMenuDemoWithTrigger,
      })),
    { ssr: false },
  ),
  "navigation-menu-demo-basic": dynamic(
    () =>
      import("./demos/ui/navigation-menu-demo").then((mod) => ({
        default: mod.NavigationMenuDemoBasic,
      })),
    { ssr: false },
  ),
  // Progress
  "progress-demo-default": dynamic(
    () => import("./demos/ui/progress/progress-demo-default"),
    { ssr: false },
  ),
  "progress-demo-variants": dynamic(
    () => import("./demos/ui/progress/progress-demo-variants"),
    { ssr: false },
  ),
  "progress-demo-success": dynamic(
    () => import("./demos/ui/progress/progress-demo-success"),
    { ssr: false },
  ),
  "progress-demo-transparent": dynamic(
    () => import("./demos/ui/progress/progress-demo-transparent"),
    { ssr: false },
  ),
  "progress-demo-indeterminate": dynamic(
    () => import("./demos/ui/progress/progress-demo-indeterminate"),
    { ssr: false },
  ),
  "progress-demo-with-label": dynamic(
    () => import("./demos/ui/progress/progress-demo-with-label"),
    { ssr: false },
  ),
  "progress-demo-controlled": dynamic(
    () =>
      import("./demos/ui/progress-demo").then((mod) => ({
        default: mod.ProgressDemoControlled,
      })),
    { ssr: false },
  ),
  "progress-demo-file-upload-list": dynamic(
    () =>
      import("./demos/ui/progress-demo").then((mod) => ({
        default: mod.ProgressDemoFileUploadList,
      })),
    { ssr: false },
  ),
  "progress-demo-zero": dynamic(
    () =>
      import("./demos/ui/progress-demo").then((mod) => ({
        default: mod.ProgressDemoZero,
      })),
    { ssr: false },
  ),
  // Progress Circle
  "progress-circle-demo-default": dynamic(
    () =>
      import("./demos/ui/progress-circle-demo").then((mod) => ({
        default: mod.ProgressCircleDemoDefault,
      })),
    { ssr: false },
  ),
  "progress-circle-demo-indeterminate": dynamic(
    () =>
      import("./demos/ui/progress-circle-demo").then((mod) => ({
        default: mod.ProgressCircleDemoIndeterminate,
      })),
    { ssr: false },
  ),
  "progress-circle-demo-values": dynamic(
    () =>
      import("./demos/ui/progress-circle-demo").then((mod) => ({
        default: mod.ProgressCircleDemoValues,
      })),
    { ssr: false },
  ),
  "progress-circle-demo-complete": dynamic(
    () =>
      import("./demos/ui/progress-circle-demo").then((mod) => ({
        default: mod.ProgressCircleDemoComplete,
      })),
    { ssr: false },
  ),
  "progress-circle-demo-sizes": dynamic(
    () =>
      import("./demos/ui/progress-circle-demo").then((mod) => ({
        default: mod.ProgressCircleDemoSizes,
      })),
    { ssr: false },
  ),
  "progress-circle-demo-controlled": dynamic(
    () =>
      import("./demos/ui/progress-circle-demo").then((mod) => ({
        default: mod.ProgressCircleDemoControlled,
      })),
    { ssr: false },
  ),
  "progress-circle-demo-filled": dynamic(
    () =>
      import("./demos/ui/progress-circle-demo").then((mod) => ({
        default: mod.ProgressCircleDemoFilled,
      })),
    { ssr: false },
  ),
  "progress-circle-demo-filled-controlled": dynamic(
    () =>
      import("./demos/ui/progress-circle-demo").then((mod) => ({
        default: mod.ProgressCircleDemoFilledControlled,
      })),
    { ssr: false },
  ),
  "progress-circle-demo-status": dynamic(
    () =>
      import("./demos/ui/progress-circle-demo").then((mod) => ({
        default: mod.ProgressCircleDemoStatus,
      })),
    { ssr: false },
  ),
  // Progress Rovo
  "progress-rovo-demo-default": dynamic(
    () => import("./demos/ui/progress-rovo/progress-rovo-demo-default"),
    { ssr: false },
  ),
  "progress-rovo-demo-completed": dynamic(
    () => import("./demos/ui/progress-rovo/progress-rovo-demo-completed"),
    { ssr: false },
  ),
  "progress-rovo-demo-determinate": dynamic(
    () => import("./demos/ui/progress-rovo/progress-rovo-demo-determinate"),
    { ssr: false },
  ),
  "progress-rovo-demo-controlled": dynamic(
    () =>
      import("./demos/ui/progress-rovo-demo").then((mod) => ({
        default: mod.ProgressRovoDemoControlled,
      })),
    { ssr: false },
  ),
  "progress-rovo-demo-transition": dynamic(
    () =>
      import("./demos/ui/progress-rovo-demo").then((mod) => ({
        default: mod.ProgressRovoDemoTransition,
      })),
    { ssr: false },
  ),
  // Spinner
  "spinner-demo-default": dynamic(
    () =>
      import("./demos/ui/spinner-demo").then((mod) => ({
        default: mod.SpinnerDemoDefault,
      })),
    { ssr: false },
  ),
  "spinner-demo-sizes": dynamic(
    () =>
      import("./demos/ui/spinner-demo").then((mod) => ({
        default: mod.SpinnerDemoSizes,
      })),
    { ssr: false },
  ),
  "spinner-demo-basic": dynamic(
    () =>
      import("./demos/ui/spinner-demo").then((mod) => ({
        default: mod.SpinnerDemoBasic,
      })),
    { ssr: false },
  ),
  "spinner-demo-in-badges": dynamic(
    () =>
      import("./demos/ui/spinner-demo").then((mod) => ({
        default: mod.SpinnerDemoInBadges,
      })),
    { ssr: false },
  ),
  "spinner-demo-in-buttons": dynamic(
    () =>
      import("./demos/ui/spinner-demo").then((mod) => ({
        default: mod.SpinnerDemoInButtons,
      })),
    { ssr: false },
  ),
  "spinner-demo-in-empty-state": dynamic(
    () =>
      import("./demos/ui/spinner-demo").then((mod) => ({
        default: mod.SpinnerDemoInEmptyState,
      })),
    { ssr: false },
  ),
  "spinner-demo-in-input-group": dynamic(
    () =>
      import("./demos/ui/spinner-demo").then((mod) => ({
        default: mod.SpinnerDemoInInputGroup,
      })),
    { ssr: false },
  ),
  // Avatar
  "avatar-demo-default": dynamic(
    () =>
      import("./demos/ui/avatar-demo").then((mod) => ({
        default: mod.AvatarDemoDefault,
      })),
    { ssr: false },
  ),
  "avatar-demo-sizes": dynamic(
    () =>
      import("./demos/ui/avatar-demo").then((mod) => ({
        default: mod.AvatarDemoSizes,
      })),
    { ssr: false },
  ),
  "avatar-demo-group": dynamic(
    () =>
      import("./demos/ui/avatar-demo").then((mod) => ({
        default: mod.AvatarDemoGroup,
      })),
    { ssr: false },
  ),
  "avatar-demo-badge-with-icon": dynamic(
    () =>
      import("./demos/ui/avatar-demo").then((mod) => ({
        default: mod.AvatarDemoBadgeWithIcon,
      })),
    { ssr: false },
  ),
  "avatar-demo-badge": dynamic(
    () =>
      import("./demos/ui/avatar-demo").then((mod) => ({
        default: mod.AvatarDemoBadge,
      })),
    { ssr: false },
  ),
  "avatar-demo-group-with-count": dynamic(
    () =>
      import("./demos/ui/avatar-demo").then((mod) => ({
        default: mod.AvatarDemoGroupWithCount,
      })),
    { ssr: false },
  ),
  "avatar-demo-group-with-icon-count": dynamic(
    () =>
      import("./demos/ui/avatar-demo").then((mod) => ({
        default: mod.AvatarDemoGroupWithIconCount,
      })),
    { ssr: false },
  ),
  "avatar-demo-in-empty": dynamic(
    () =>
      import("./demos/ui/avatar-demo").then((mod) => ({
        default: mod.AvatarDemoInEmpty,
      })),
    { ssr: false },
  ),
  "avatar-demo-shapes": dynamic(
    () =>
      import("./demos/ui/avatar-demo").then((mod) => ({
        default: mod.AvatarDemoShapes,
      })),
    { ssr: false },
  ),
  "avatar-demo-all-sizes": dynamic(
    () =>
      import("./demos/ui/avatar-demo").then((mod) => ({
        default: mod.AvatarDemoAllSizes,
      })),
    { ssr: false },
  ),
  "avatar-demo-presence": dynamic(
    () =>
      import("./demos/ui/avatar-demo").then((mod) => ({
        default: mod.AvatarDemoPresence,
      })),
    { ssr: false },
  ),
  "avatar-demo-status": dynamic(
    () =>
      import("./demos/ui/avatar-demo").then((mod) => ({
        default: mod.AvatarDemoStatus,
      })),
    { ssr: false },
  ),
  "avatar-demo-disabled": dynamic(
    () =>
      import("./demos/ui/avatar-demo").then((mod) => ({
        default: mod.AvatarDemoDisabled,
      })),
    { ssr: false },
  ),
  // Card
  "card-demo-default": dynamic(
    () =>
      import("./demos/ui/card-demo").then((mod) => ({
        default: mod.CardDemoDefault,
      })),
    { ssr: false },
  ),
  "card-demo-small": dynamic(
    () =>
      import("./demos/ui/card-demo").then((mod) => ({
        default: mod.CardDemoSmall,
      })),
    { ssr: false },
  ),
  "card-demo-with-action": dynamic(
    () =>
      import("./demos/ui/card-demo").then((mod) => ({
        default: mod.CardDemoWithAction,
      })),
    { ssr: false },
  ),
  "card-demo-simple": dynamic(
    () =>
      import("./demos/ui/card-demo").then((mod) => ({
        default: mod.CardDemoSimple,
      })),
    { ssr: false },
  ),
  "card-demo-default-size": dynamic(
    () =>
      import("./demos/ui/card-demo").then((mod) => ({
        default: mod.CardDemoDefaultSize,
      })),
    { ssr: false },
  ),
  "card-demo-footer-with-border-small": dynamic(
    () =>
      import("./demos/ui/card-demo").then((mod) => ({
        default: mod.CardDemoFooterWithBorderSmall,
      })),
    { ssr: false },
  ),
  "card-demo-footer-with-border": dynamic(
    () =>
      import("./demos/ui/card-demo").then((mod) => ({
        default: mod.CardDemoFooterWithBorder,
      })),
    { ssr: false },
  ),
  "card-demo-header-with-border-small": dynamic(
    () =>
      import("./demos/ui/card-demo").then((mod) => ({
        default: mod.CardDemoHeaderWithBorderSmall,
      })),
    { ssr: false },
  ),
  "card-demo-header-with-border": dynamic(
    () =>
      import("./demos/ui/card-demo").then((mod) => ({
        default: mod.CardDemoHeaderWithBorder,
      })),
    { ssr: false },
  ),
  "card-demo-login": dynamic(
    () =>
      import("./demos/ui/card-demo").then((mod) => ({
        default: mod.CardDemoLogin,
      })),
    { ssr: false },
  ),
  "card-demo-meeting-notes": dynamic(
    () =>
      import("./demos/ui/card-demo").then((mod) => ({
        default: mod.CardDemoMeetingNotes,
      })),
    { ssr: false },
  ),
  "card-demo-small-size": dynamic(
    () =>
      import("./demos/ui/card-demo").then((mod) => ({
        default: mod.CardDemoSmallSize,
      })),
    { ssr: false },
  ),
  "card-demo-with-image-small": dynamic(
    () =>
      import("./demos/ui/card-demo").then((mod) => ({
        default: mod.CardDemoWithImageSmall,
      })),
    { ssr: false },
  ),
  "card-demo-with-image": dynamic(
    () =>
      import("./demos/ui/card-demo").then((mod) => ({
        default: mod.CardDemoWithImage,
      })),
    { ssr: false },
  ),
  // Table
  "table-demo-default": dynamic(
    () =>
      import("./demos/ui/table-demo").then((mod) => ({
        default: mod.TableDemoDefault,
      })),
    { ssr: false },
  ),
  "table-demo-with-caption": dynamic(
    () =>
      import("./demos/ui/table-demo").then((mod) => ({
        default: mod.TableDemoWithCaption,
      })),
    { ssr: false },
  ),
  "table-demo-with-footer": dynamic(
    () =>
      import("./demos/ui/table-demo").then((mod) => ({
        default: mod.TableDemoWithFooter,
      })),
    { ssr: false },
  ),
  "table-demo-basic": dynamic(
    () =>
      import("./demos/ui/table-demo").then((mod) => ({
        default: mod.TableDemoBasic,
      })),
    { ssr: false },
  ),
  "table-demo-simple": dynamic(
    () =>
      import("./demos/ui/table-demo").then((mod) => ({
        default: mod.TableDemoSimple,
      })),
    { ssr: false },
  ),
  "table-demo-with-actions": dynamic(
    () =>
      import("./demos/ui/table-demo").then((mod) => ({
        default: mod.TableDemoWithActions,
      })),
    { ssr: false },
  ),
  "table-demo-with-badges": dynamic(
    () =>
      import("./demos/ui/table-demo").then((mod) => ({
        default: mod.TableDemoWithBadges,
      })),
    { ssr: false },
  ),
  "table-demo-with-input": dynamic(
    () =>
      import("./demos/ui/table-demo").then((mod) => ({
        default: mod.TableDemoWithInput,
      })),
    { ssr: false },
  ),
  "table-demo-with-select": dynamic(
    () =>
      import("./demos/ui/table-demo").then((mod) => ({
        default: mod.TableDemoWithSelect,
      })),
    { ssr: false },
  ),
  "table-demo-striped": dynamic(
    () =>
      import("./demos/ui/table-demo").then((mod) => ({
        default: mod.TableDemoStriped,
      })),
    { ssr: false },
  ),
  "table-demo-row-highlight": dynamic(
    () =>
      import("./demos/ui/table-demo").then((mod) => ({
        default: mod.TableDemoRowHighlight,
      })),
    { ssr: false },
  ),
  // Skeleton
  "skeleton-demo-default": dynamic(
    () =>
      import("./demos/ui/skeleton-demo").then((mod) => ({
        default: mod.SkeletonDemoDefault,
      })),
    { ssr: false },
  ),
  "skeleton-demo-card": dynamic(
    () =>
      import("./demos/ui/skeleton-demo").then((mod) => ({
        default: mod.SkeletonDemoCard,
      })),
    { ssr: false },
  ),
  "skeleton-demo-list": dynamic(
    () =>
      import("./demos/ui/skeleton-demo").then((mod) => ({
        default: mod.SkeletonDemoList,
      })),
    { ssr: false },
  ),
  "skeleton-demo-avatar": dynamic(
    () =>
      import("./demos/ui/skeleton-demo").then((mod) => ({
        default: mod.SkeletonDemoAvatar,
      })),
    { ssr: false },
  ),
  "skeleton-demo-form": dynamic(
    () =>
      import("./demos/ui/skeleton-demo").then((mod) => ({
        default: mod.SkeletonDemoForm,
      })),
    { ssr: false },
  ),
  "skeleton-demo-table": dynamic(
    () =>
      import("./demos/ui/skeleton-demo").then((mod) => ({
        default: mod.SkeletonDemoTable,
      })),
    { ssr: false },
  ),
  "skeleton-demo-text": dynamic(
    () =>
      import("./demos/ui/skeleton-demo").then((mod) => ({
        default: mod.SkeletonDemoText,
      })),
    { ssr: false },
  ),
  // Empty
  "empty-demo-default": dynamic(
    () =>
      import("./demos/ui/empty-demo").then((mod) => ({
        default: mod.EmptyDemoDefault,
      })),
    { ssr: false },
  ),
  "empty-demo-with-action": dynamic(
    () =>
      import("./demos/ui/empty-demo").then((mod) => ({
        default: mod.EmptyDemoWithAction,
      })),
    { ssr: false },
  ),
  "empty-demo-with-actions": dynamic(
    () =>
      import("./demos/ui/empty-demo").then((mod) => ({
        default: mod.EmptyDemoWithActions,
      })),
    { ssr: false },
  ),
  "empty-demo-with-image": dynamic(
    () =>
      import("./demos/ui/empty-demo").then((mod) => ({
        default: mod.EmptyDemoWithImage,
      })),
    { ssr: false },
  ),
  "empty-demo-with-icon": dynamic(
    () =>
      import("./demos/ui/empty-demo").then((mod) => ({
        default: mod.EmptyDemoWithIcon,
      })),
    { ssr: false },
  ),
  "empty-demo-narrow": dynamic(
    () =>
      import("./demos/ui/empty-demo").then((mod) => ({
        default: mod.EmptyDemoNarrow,
      })),
    { ssr: false },
  ),
  "empty-demo-compact": dynamic(
    () =>
      import("./demos/ui/empty-demo").then((mod) => ({
        default: mod.EmptyDemoCompact,
      })),
    { ssr: false },
  ),
  "empty-demo-with-tertiary": dynamic(
    () =>
      import("./demos/ui/empty-demo").then((mod) => ({
        default: mod.EmptyDemoWithTertiary,
      })),
    { ssr: false },
  ),
  // Kbd
  "kbd-demo-default": dynamic(
    () =>
      import("./demos/ui/kbd-demo").then((mod) => ({
        default: mod.KbdDemoDefault,
      })),
    { ssr: false },
  ),
  "kbd-demo-group": dynamic(
    () =>
      import("./demos/ui/kbd-demo").then((mod) => ({
        default: mod.KbdDemoGroup,
      })),
    { ssr: false },
  ),
  "kbd-demo-arrow-keys": dynamic(
    () =>
      import("./demos/ui/kbd-demo").then((mod) => ({
        default: mod.KbdDemoArrowKeys,
      })),
    { ssr: false },
  ),
  "kbd-demo-basic": dynamic(
    () =>
      import("./demos/ui/kbd-demo").then((mod) => ({
        default: mod.KbdDemoBasic,
      })),
    { ssr: false },
  ),
  "kbd-demo-input-group": dynamic(
    () =>
      import("./demos/ui/kbd-demo").then((mod) => ({
        default: mod.KbdDemoInputGroup,
      })),
    { ssr: false },
  ),
  "kbd-demo-kbd-group": dynamic(
    () =>
      import("./demos/ui/kbd-demo").then((mod) => ({
        default: mod.KbdDemoKbdGroup,
      })),
    { ssr: false },
  ),
  "kbd-demo-modifier-keys": dynamic(
    () =>
      import("./demos/ui/kbd-demo").then((mod) => ({
        default: mod.KbdDemoModifierKeys,
      })),
    { ssr: false },
  ),
  "kbd-demo-tooltip": dynamic(
    () =>
      import("./demos/ui/kbd-demo").then((mod) => ({
        default: mod.KbdDemoTooltip,
      })),
    { ssr: false },
  ),
  "kbd-demo-with-icons-and-text": dynamic(
    () =>
      import("./demos/ui/kbd-demo").then((mod) => ({
        default: mod.KbdDemoWithIconsAndText,
      })),
    { ssr: false },
  ),
  "kbd-demo-with-icons": dynamic(
    () =>
      import("./demos/ui/kbd-demo").then((mod) => ({
        default: mod.KbdDemoWithIcons,
      })),
    { ssr: false },
  ),
  "kbd-demo-with-samp": dynamic(
    () =>
      import("./demos/ui/kbd-demo").then((mod) => ({
        default: mod.KbdDemoWithSamp,
      })),
    { ssr: false },
  ),
  // Item
  "item-demo-default": dynamic(
    () =>
      import("./demos/ui/item-demo").then((mod) => ({
        default: mod.ItemDemoDefault,
      })),
    { ssr: false },
  ),
  "item-demo-with-description": dynamic(
    () =>
      import("./demos/ui/item-demo").then((mod) => ({
        default: mod.ItemDemoWithDescription,
      })),
    { ssr: false },
  ),
  "item-demo-with-media": dynamic(
    () =>
      import("./demos/ui/item-demo").then((mod) => ({
        default: mod.ItemDemoWithMedia,
      })),
    { ssr: false },
  ),
  "item-demo-as-child": dynamic(
    () =>
      import("./demos/ui/item-demo").then((mod) => ({
        default: mod.ItemDemoAsChild,
      })),
    { ssr: false },
  ),
  "item-demo-default-item-media-image": dynamic(
    () =>
      import("./demos/ui/item-demo").then((mod) => ({
        default: mod.ItemDemoDefaultItemMediaImage,
      })),
    { ssr: false },
  ),
  "item-demo-extra-small": dynamic(
    () =>
      import("./demos/ui/item-demo").then((mod) => ({
        default: mod.ItemDemoExtraSmall,
      })),
    { ssr: false },
  ),
  "item-demo-item-footer": dynamic(
    () =>
      import("./demos/ui/item-demo").then((mod) => ({
        default: mod.ItemDemoItemFooter,
      })),
    { ssr: false },
  ),
  "item-demo-item-group": dynamic(
    () =>
      import("./demos/ui/item-demo").then((mod) => ({
        default: mod.ItemDemoItemGroup,
      })),
    { ssr: false },
  ),
  "item-demo-item-header-item-footer": dynamic(
    () =>
      import("./demos/ui/item-demo").then((mod) => ({
        default: mod.ItemDemoItemHeaderItemFooter,
      })),
    { ssr: false },
  ),
  "item-demo-item-header": dynamic(
    () =>
      import("./demos/ui/item-demo").then((mod) => ({
        default: mod.ItemDemoItemHeader,
      })),
    { ssr: false },
  ),
  "item-demo-item-separator": dynamic(
    () =>
      import("./demos/ui/item-demo").then((mod) => ({
        default: mod.ItemDemoItemSeparator,
      })),
    { ssr: false },
  ),
  "item-demo-muted-as-child": dynamic(
    () =>
      import("./demos/ui/item-demo").then((mod) => ({
        default: mod.ItemDemoMutedAsChild,
      })),
    { ssr: false },
  ),
  "item-demo-muted-extra-small": dynamic(
    () =>
      import("./demos/ui/item-demo").then((mod) => ({
        default: mod.ItemDemoMutedExtraSmall,
      })),
    { ssr: false },
  ),
  "item-demo-muted-item-group": dynamic(
    () =>
      import("./demos/ui/item-demo").then((mod) => ({
        default: mod.ItemDemoMutedItemGroup,
      })),
    { ssr: false },
  ),
  "item-demo-muted-item-media-image": dynamic(
    () =>
      import("./demos/ui/item-demo").then((mod) => ({
        default: mod.ItemDemoMutedItemMediaImage,
      })),
    { ssr: false },
  ),
  "item-demo-muted-small": dynamic(
    () =>
      import("./demos/ui/item-demo").then((mod) => ({
        default: mod.ItemDemoMutedSmall,
      })),
    { ssr: false },
  ),
  "item-demo-muted": dynamic(
    () =>
      import("./demos/ui/item-demo").then((mod) => ({
        default: mod.ItemDemoMuted,
      })),
    { ssr: false },
  ),
  "item-demo-outline-as-child": dynamic(
    () =>
      import("./demos/ui/item-demo").then((mod) => ({
        default: mod.ItemDemoOutlineAsChild,
      })),
    { ssr: false },
  ),
  "item-demo-outline-extra-small": dynamic(
    () =>
      import("./demos/ui/item-demo").then((mod) => ({
        default: mod.ItemDemoOutlineExtraSmall,
      })),
    { ssr: false },
  ),
  "item-demo-outline-item-group": dynamic(
    () =>
      import("./demos/ui/item-demo").then((mod) => ({
        default: mod.ItemDemoOutlineItemGroup,
      })),
    { ssr: false },
  ),
  "item-demo-outline-item-media-image-extra-small": dynamic(
    () =>
      import("./demos/ui/item-demo").then((mod) => ({
        default: mod.ItemDemoOutlineItemMediaImageExtraSmall,
      })),
    { ssr: false },
  ),
  "item-demo-outline-item-media-image-small": dynamic(
    () =>
      import("./demos/ui/item-demo").then((mod) => ({
        default: mod.ItemDemoOutlineItemMediaImageSmall,
      })),
    { ssr: false },
  ),
  "item-demo-outline-item-media-image": dynamic(
    () =>
      import("./demos/ui/item-demo").then((mod) => ({
        default: mod.ItemDemoOutlineItemMediaImage,
      })),
    { ssr: false },
  ),
  "item-demo-outline-small": dynamic(
    () =>
      import("./demos/ui/item-demo").then((mod) => ({
        default: mod.ItemDemoOutlineSmall,
      })),
    { ssr: false },
  ),
  "item-demo-outline": dynamic(
    () =>
      import("./demos/ui/item-demo").then((mod) => ({
        default: mod.ItemDemoOutline,
      })),
    { ssr: false },
  ),
  "item-demo-small": dynamic(
    () =>
      import("./demos/ui/item-demo").then((mod) => ({
        default: mod.ItemDemoSmall,
      })),
    { ssr: false },
  ),
  // Dropdown Menu
  "dropdown-menu-demo-default": dynamic(
    () =>
      import("./demos/ui/dropdown-menu-demo").then((mod) => ({
        default: mod.DropdownMenuDemoDefault,
      })),
    { ssr: false },
  ),
  "dropdown-menu-demo-appearance": dynamic(
    () =>
      import("./demos/ui/dropdown-menu-demo").then((mod) => ({
        default: mod.DropdownMenuDemoAppearance,
      })),
    { ssr: false },
  ),
  "dropdown-menu-demo-density": dynamic(
    () =>
      import("./demos/ui/dropdown-menu-demo").then((mod) => ({
        default: mod.DropdownMenuDemoDensity,
      })),
    { ssr: false },
  ),
  "dropdown-menu-demo-tall": dynamic(
    () =>
      import("./demos/ui/dropdown-menu-demo").then((mod) => ({
        default: mod.DropdownMenuDemoTall,
      })),
    { ssr: false },
  ),
  "dropdown-menu-demo-custom-triggers": dynamic(
    () =>
      import("./demos/ui/dropdown-menu-demo").then((mod) => ({
        default: mod.DropdownMenuDemoCustomTriggers,
      })),
    { ssr: false },
  ),
  "dropdown-menu-demo-using-trigger": dynamic(
    () =>
      import("./demos/ui/dropdown-menu-demo").then((mod) => ({
        default: mod.DropdownMenuDemoUsingTrigger,
      })),
    { ssr: false },
  ),
  "dropdown-menu-demo-nested-dropdown-menu": dynamic(
    () =>
      import("./demos/ui/dropdown-menu-demo").then((mod) => ({
        default: mod.DropdownMenuDemoNestedDropdownMenu,
      })),
    { ssr: false },
  ),
  "dropdown-menu-demo-states": dynamic(
    () =>
      import("./demos/ui/dropdown-menu-demo").then((mod) => ({
        default: mod.DropdownMenuDemoStates,
      })),
    { ssr: false },
  ),
  "dropdown-menu-demo-loading": dynamic(
    () =>
      import("./demos/ui/dropdown-menu-demo").then((mod) => ({
        default: mod.DropdownMenuDemoLoading,
      })),
    { ssr: false },
  ),
  "dropdown-menu-demo-open": dynamic(
    () =>
      import("./demos/ui/dropdown-menu-demo").then((mod) => ({
        default: mod.DropdownMenuDemoOpen,
      })),
    { ssr: false },
  ),
  "dropdown-menu-demo-positioning": dynamic(
    () =>
      import("./demos/ui/dropdown-menu-demo").then((mod) => ({
        default: mod.DropdownMenuDemoPositioning,
      })),
    { ssr: false },
  ),
  "dropdown-menu-demo-default-placement": dynamic(
    () =>
      import("./demos/ui/dropdown-menu-demo").then((mod) => ({
        default: mod.DropdownMenuDemoDefaultPlacement,
      })),
    { ssr: false },
  ),
  "dropdown-menu-demo-placement": dynamic(
    () =>
      import("./demos/ui/dropdown-menu-demo").then((mod) => ({
        default: mod.DropdownMenuDemoPlacement,
      })),
    { ssr: false },
  ),
  "dropdown-menu-demo-should-flip": dynamic(
    () =>
      import("./demos/ui/dropdown-menu-demo").then((mod) => ({
        default: mod.DropdownMenuDemoShouldFlip,
      })),
    { ssr: false },
  ),
  "dropdown-menu-demo-z-index": dynamic(
    () =>
      import("./demos/ui/dropdown-menu-demo").then((mod) => ({
        default: mod.DropdownMenuDemoZIndex,
      })),
    { ssr: false },
  ),
  "dropdown-menu-demo-content-without-portal": dynamic(
    () =>
      import("./demos/ui/dropdown-menu-demo").then((mod) => ({
        default: mod.DropdownMenuDemoContentWithoutPortal,
      })),
    { ssr: false },
  ),
  "dropdown-menu-demo-full-width-dropdown-menu": dynamic(
    () =>
      import("./demos/ui/dropdown-menu-demo").then((mod) => ({
        default: mod.DropdownMenuDemoFullWidthDropdownMenu,
      })),
    { ssr: false },
  ),
  "dropdown-menu-demo-accessible-labels": dynamic(
    () =>
      import("./demos/ui/dropdown-menu-demo").then((mod) => ({
        default: mod.DropdownMenuDemoAccessibleLabels,
      })),
    { ssr: false },
  ),
  "dropdown-menu-demo-item-description": dynamic(
    () =>
      import("./demos/ui/dropdown-menu-demo").then((mod) => ({
        default: mod.DropdownMenuDemoItemDescription,
      })),
    { ssr: false },
  ),
  "dropdown-menu-demo-item-multiline": dynamic(
    () =>
      import("./demos/ui/dropdown-menu-demo").then((mod) => ({
        default: mod.DropdownMenuDemoItemMultiline,
      })),
    { ssr: false },
  ),
  "dropdown-menu-demo-item-states": dynamic(
    () =>
      import("./demos/ui/dropdown-menu-demo").then((mod) => ({
        default: mod.DropdownMenuDemoItemStates,
      })),
    { ssr: false },
  ),
  "dropdown-menu-demo-item-disabled": dynamic(
    () =>
      import("./demos/ui/dropdown-menu-demo").then((mod) => ({
        default: mod.DropdownMenuDemoItemDisabled,
      })),
    { ssr: false },
  ),
  "dropdown-menu-demo-item-with-elements": dynamic(
    () =>
      import("./demos/ui/dropdown-menu-demo").then((mod) => ({
        default: mod.DropdownMenuDemoItemWithElements,
      })),
    { ssr: false },
  ),
  "dropdown-menu-demo-item-elem-before": dynamic(
    () =>
      import("./demos/ui/dropdown-menu-demo").then((mod) => ({
        default: mod.DropdownMenuDemoItemElemBefore,
      })),
    { ssr: false },
  ),
  "dropdown-menu-demo-item-elem-after": dynamic(
    () =>
      import("./demos/ui/dropdown-menu-demo").then((mod) => ({
        default: mod.DropdownMenuDemoItemElemAfter,
      })),
    { ssr: false },
  ),
  "dropdown-menu-demo-item-custom-component": dynamic(
    () =>
      import("./demos/ui/dropdown-menu-demo").then((mod) => ({
        default: mod.DropdownMenuDemoItemCustomComponent,
      })),
    { ssr: false },
  ),
  "dropdown-menu-demo-checkbox-default-selected": dynamic(
    () =>
      import("./demos/ui/dropdown-menu-demo").then((mod) => ({
        default: mod.DropdownMenuDemoCheckboxDefaultSelected,
      })),
    { ssr: false },
  ),
  "dropdown-menu-demo-checkbox-selected": dynamic(
    () =>
      import("./demos/ui/dropdown-menu-demo").then((mod) => ({
        default: mod.DropdownMenuDemoCheckboxSelected,
      })),
    { ssr: false },
  ),
  "dropdown-menu-demo-radio-default-selected": dynamic(
    () =>
      import("./demos/ui/dropdown-menu-demo").then((mod) => ({
        default: mod.DropdownMenuDemoRadioDefaultSelected,
      })),
    { ssr: false },
  ),
  "dropdown-menu-demo-radio-selected": dynamic(
    () =>
      import("./demos/ui/dropdown-menu-demo").then((mod) => ({
        default: mod.DropdownMenuDemoRadioSelected,
      })),
    { ssr: false },
  ),
  "dropdown-menu-demo-with-checkbox": dynamic(
    () =>
      import("./demos/ui/dropdown-menu-demo").then((mod) => ({
        default: mod.DropdownMenuDemoWithCheckbox,
      })),
    { ssr: false },
  ),
  "dropdown-menu-demo-with-radio-group": dynamic(
    () =>
      import("./demos/ui/dropdown-menu-demo").then((mod) => ({
        default: mod.DropdownMenuDemoWithRadioGroup,
      })),
    { ssr: false },
  ),
  // Context Menu
  "context-menu-demo-default": dynamic(
    () =>
      import("./demos/ui/context-menu-demo").then((mod) => ({
        default: mod.ContextMenuDemoDefault,
      })),
    { ssr: false },
  ),
  "context-menu-demo-with-shortcuts": dynamic(
    () =>
      import("./demos/ui/context-menu-demo").then((mod) => ({
        default: mod.ContextMenuDemoWithShortcuts,
      })),
    { ssr: false },
  ),
  "context-menu-demo-basic": dynamic(
    () =>
      import("./demos/ui/context-menu-demo").then((mod) => ({
        default: mod.ContextMenuDemoBasic,
      })),
    { ssr: false },
  ),
  "context-menu-demo-in-dialog": dynamic(
    () =>
      import("./demos/ui/context-menu-demo").then((mod) => ({
        default: mod.ContextMenuDemoInDialog,
      })),
    { ssr: false },
  ),
  "context-menu-demo-with-checkboxes": dynamic(
    () =>
      import("./demos/ui/context-menu-demo").then((mod) => ({
        default: mod.ContextMenuDemoWithCheckboxes,
      })),
    { ssr: false },
  ),
  "context-menu-demo-with-destructive-items": dynamic(
    () =>
      import("./demos/ui/context-menu-demo").then((mod) => ({
        default: mod.ContextMenuDemoWithDestructiveItems,
      })),
    { ssr: false },
  ),
  "context-menu-demo-with-groups-labels-separators": dynamic(
    () =>
      import("./demos/ui/context-menu-demo").then((mod) => ({
        default: mod.ContextMenuDemoWithGroupsLabelsSeparators,
      })),
    { ssr: false },
  ),
  "context-menu-demo-with-icons": dynamic(
    () =>
      import("./demos/ui/context-menu-demo").then((mod) => ({
        default: mod.ContextMenuDemoWithIcons,
      })),
    { ssr: false },
  ),
  "context-menu-demo-with-inset": dynamic(
    () =>
      import("./demos/ui/context-menu-demo").then((mod) => ({
        default: mod.ContextMenuDemoWithInset,
      })),
    { ssr: false },
  ),
  "context-menu-demo-with-radio-group": dynamic(
    () =>
      import("./demos/ui/context-menu-demo").then((mod) => ({
        default: mod.ContextMenuDemoWithRadioGroup,
      })),
    { ssr: false },
  ),
  "context-menu-demo-with-sides": dynamic(
    () =>
      import("./demos/ui/context-menu-demo").then((mod) => ({
        default: mod.ContextMenuDemoWithSides,
      })),
    { ssr: false },
  ),
  "context-menu-demo-with-submenu": dynamic(
    () =>
      import("./demos/ui/context-menu-demo").then((mod) => ({
        default: mod.ContextMenuDemoWithSubmenu,
      })),
    { ssr: false },
  ),
  // Menubar
  "menubar-demo-default": dynamic(
    () =>
      import("./demos/ui/menubar-demo").then((mod) => ({
        default: mod.MenubarDemoDefault,
      })),
    { ssr: false },
  ),
  "menubar-demo-with-shortcuts": dynamic(
    () =>
      import("./demos/ui/menubar-demo").then((mod) => ({
        default: mod.MenubarDemoWithShortcuts,
      })),
    { ssr: false },
  ),
  "menubar-demo-basic": dynamic(
    () =>
      import("./demos/ui/menubar-demo").then((mod) => ({
        default: mod.MenubarDemoBasic,
      })),
    { ssr: false },
  ),
  "menubar-demo-destructive": dynamic(
    () =>
      import("./demos/ui/menubar-demo").then((mod) => ({
        default: mod.MenubarDemoDestructive,
      })),
    { ssr: false },
  ),
  "menubar-demo-format": dynamic(
    () =>
      import("./demos/ui/menubar-demo").then((mod) => ({
        default: mod.MenubarDemoFormat,
      })),
    { ssr: false },
  ),
  "menubar-demo-in-dialog": dynamic(
    () =>
      import("./demos/ui/menubar-demo").then((mod) => ({
        default: mod.MenubarDemoInDialog,
      })),
    { ssr: false },
  ),
  "menubar-demo-insert": dynamic(
    () =>
      import("./demos/ui/menubar-demo").then((mod) => ({
        default: mod.MenubarDemoInsert,
      })),
    { ssr: false },
  ),
  "menubar-demo-sides": dynamic(
    () =>
      import("./demos/ui/menubar-demo").then((mod) => ({
        default: mod.MenubarDemoSides,
      })),
    { ssr: false },
  ),
  "menubar-demo-with-checkboxes": dynamic(
    () =>
      import("./demos/ui/menubar-demo").then((mod) => ({
        default: mod.MenubarDemoWithCheckboxes,
      })),
    { ssr: false },
  ),
  "menubar-demo-with-icons": dynamic(
    () =>
      import("./demos/ui/menubar-demo").then((mod) => ({
        default: mod.MenubarDemoWithIcons,
      })),
    { ssr: false },
  ),
  "menubar-demo-with-inset": dynamic(
    () =>
      import("./demos/ui/menubar-demo").then((mod) => ({
        default: mod.MenubarDemoWithInset,
      })),
    { ssr: false },
  ),
  "menubar-demo-with-radio": dynamic(
    () =>
      import("./demos/ui/menubar-demo").then((mod) => ({
        default: mod.MenubarDemoWithRadio,
      })),
    { ssr: false },
  ),
  "menubar-demo-with-submenu": dynamic(
    () =>
      import("./demos/ui/menubar-demo").then((mod) => ({
        default: mod.MenubarDemoWithSubmenu,
      })),
    { ssr: false },
  ),
  // Command
  "command-demo-default": dynamic(
    () =>
      import("./demos/ui/command-demo").then((mod) => ({
        default: mod.CommandDemoDefault,
      })),
    { ssr: false },
  ),
  "command-demo-empty": dynamic(
    () =>
      import("./demos/ui/command-demo").then((mod) => ({
        default: mod.CommandDemoEmpty,
      })),
    { ssr: false },
  ),
  "command-demo-groups": dynamic(
    () =>
      import("./demos/ui/command-demo").then((mod) => ({
        default: mod.CommandDemoGroups,
      })),
    { ssr: false },
  ),
  "command-demo-basic": dynamic(
    () =>
      import("./demos/ui/command-demo").then((mod) => ({
        default: mod.CommandDemoBasic,
      })),
    { ssr: false },
  ),
  "command-demo-inline": dynamic(
    () =>
      import("./demos/ui/command-demo").then((mod) => ({
        default: mod.CommandDemoInline,
      })),
    { ssr: false },
  ),
  "command-demo-many-groups-and-items": dynamic(
    () =>
      import("./demos/ui/command-demo").then((mod) => ({
        default: mod.CommandDemoManyGroupsAndItems,
      })),
    { ssr: false },
  ),
  "command-demo-with-groups": dynamic(
    () =>
      import("./demos/ui/command-demo").then((mod) => ({
        default: mod.CommandDemoWithGroups,
      })),
    { ssr: false },
  ),
  "command-demo-with-shortcuts": dynamic(
    () =>
      import("./demos/ui/command-demo").then((mod) => ({
        default: mod.CommandDemoWithShortcuts,
      })),
    { ssr: false },
  ),
  // Combobox
  "combobox-demo-default": dynamic(
    () =>
      import("./demos/ui/combobox-demo").then((mod) => ({
        default: mod.ComboboxDemoDefault,
      })),
    { ssr: false },
  ),
  "combobox-demo-grouped": dynamic(
    () =>
      import("./demos/ui/combobox-demo").then((mod) => ({
        default: mod.ComboboxDemoGrouped,
      })),
    { ssr: false },
  ),
  "combobox-demo-basic": dynamic(
    () =>
      import("./demos/ui/combobox-demo").then((mod) => ({
        default: mod.ComboboxDemoBasic,
      })),
    { ssr: false },
  ),
  "combobox-demo-disabled-items": dynamic(
    () =>
      import("./demos/ui/combobox-demo").then((mod) => ({
        default: mod.ComboboxDemoDisabledItems,
      })),
    { ssr: false },
  ),
  "combobox-demo-disabled": dynamic(
    () =>
      import("./demos/ui/combobox-demo").then((mod) => ({
        default: mod.ComboboxDemoDisabled,
      })),
    { ssr: false },
  ),
  "combobox-demo-form-with-combobox": dynamic(
    () =>
      import("./demos/ui/combobox-demo").then((mod) => ({
        default: mod.ComboboxDemoFormWithCombobox,
      })),
    { ssr: false },
  ),
  "combobox-demo-in-dialog": dynamic(
    () =>
      import("./demos/ui/combobox-demo").then((mod) => ({
        default: mod.ComboboxDemoInDialog,
      })),
    { ssr: false },
  ),
  "combobox-demo-in-popup": dynamic(
    () =>
      import("./demos/ui/combobox-demo").then((mod) => ({
        default: mod.ComboboxDemoInPopup,
      })),
    { ssr: false },
  ),
  "combobox-demo-invalid": dynamic(
    () =>
      import("./demos/ui/combobox-demo").then((mod) => ({
        default: mod.ComboboxDemoInvalid,
      })),
    { ssr: false },
  ),
  "combobox-demo-large-list": dynamic(
    () =>
      import("./demos/ui/combobox-demo").then((mod) => ({
        default: mod.ComboboxDemoLargeList,
      })),
    { ssr: false },
  ),
  "combobox-demo-multiple-disabled": dynamic(
    () =>
      import("./demos/ui/combobox-demo").then((mod) => ({
        default: mod.ComboboxDemoMultipleDisabled,
      })),
    { ssr: false },
  ),
  "combobox-demo-multiple-invalid": dynamic(
    () =>
      import("./demos/ui/combobox-demo").then((mod) => ({
        default: mod.ComboboxDemoMultipleInvalid,
      })),
    { ssr: false },
  ),
  "combobox-demo-multiple-no-remove": dynamic(
    () =>
      import("./demos/ui/combobox-demo").then((mod) => ({
        default: mod.ComboboxDemoMultipleNoRemove,
      })),
    { ssr: false },
  ),
  "combobox-demo-multiple": dynamic(
    () =>
      import("./demos/ui/combobox-demo").then((mod) => ({
        default: mod.ComboboxDemoMultiple,
      })),
    { ssr: false },
  ),
  "combobox-demo-sides": dynamic(
    () =>
      import("./demos/ui/combobox-demo").then((mod) => ({
        default: mod.ComboboxDemoSides,
      })),
    { ssr: false },
  ),
  "combobox-demo-with-auto-highlight": dynamic(
    () =>
      import("./demos/ui/combobox-demo").then((mod) => ({
        default: mod.ComboboxDemoWithAutoHighlight,
      })),
    { ssr: false },
  ),
  "combobox-demo-with-clear-button": dynamic(
    () =>
      import("./demos/ui/combobox-demo").then((mod) => ({
        default: mod.ComboboxDemoWithClearButton,
      })),
    { ssr: false },
  ),
  "combobox-demo-with-custom-item-rendering": dynamic(
    () =>
      import("./demos/ui/combobox-demo").then((mod) => ({
        default: mod.ComboboxDemoWithCustomItemRendering,
      })),
    { ssr: false },
  ),
  "combobox-demo-with-groups-and-separator": dynamic(
    () =>
      import("./demos/ui/combobox-demo").then((mod) => ({
        default: mod.ComboboxDemoWithGroupsAndSeparator,
      })),
    { ssr: false },
  ),
  "combobox-demo-with-groups": dynamic(
    () =>
      import("./demos/ui/combobox-demo").then((mod) => ({
        default: mod.ComboboxDemoWithGroups,
      })),
    { ssr: false },
  ),
  "combobox-demo-with-icon-addon": dynamic(
    () =>
      import("./demos/ui/combobox-demo").then((mod) => ({
        default: mod.ComboboxDemoWithIconAddon,
      })),
    { ssr: false },
  ),
  "combobox-demo-with-other-inputs": dynamic(
    () =>
      import("./demos/ui/combobox-demo").then((mod) => ({
        default: mod.ComboboxDemoWithOtherInputs,
      })),
    { ssr: false },
  ),
  // Input Group
  "input-group-demo-default": dynamic(
    () =>
      import("./demos/ui/input-group-demo").then((mod) => ({
        default: mod.InputGroupDemoDefault,
      })),
    { ssr: false },
  ),
  "input-group-demo-prefix": dynamic(
    () =>
      import("./demos/ui/input-group-demo").then((mod) => ({
        default: mod.InputGroupDemoPrefix,
      })),
    { ssr: false },
  ),
  "input-group-demo-button": dynamic(
    () =>
      import("./demos/ui/input-group-demo").then((mod) => ({
        default: mod.InputGroupDemoButton,
      })),
    { ssr: false },
  ),
  "input-group-demo-textarea": dynamic(
    () =>
      import("./demos/ui/input-group-demo").then((mod) => ({
        default: mod.InputGroupDemoTextarea,
      })),
    { ssr: false },
  ),
  "input-group-demo-basic": dynamic(
    () =>
      import("./demos/ui/input-group-demo").then((mod) => ({
        default: mod.InputGroupDemoBasic,
      })),
    { ssr: false },
  ),
  "input-group-demo-in-card": dynamic(
    () =>
      import("./demos/ui/input-group-demo").then((mod) => ({
        default: mod.InputGroupDemoInCard,
      })),
    { ssr: false },
  ),
  "input-group-demo-with-addons": dynamic(
    () =>
      import("./demos/ui/input-group-demo").then((mod) => ({
        default: mod.InputGroupDemoWithAddons,
      })),
    { ssr: false },
  ),
  "input-group-demo-with-buttons": dynamic(
    () =>
      import("./demos/ui/input-group-demo").then((mod) => ({
        default: mod.InputGroupDemoWithButtons,
      })),
    { ssr: false },
  ),
  "input-group-demo-with-kbd": dynamic(
    () =>
      import("./demos/ui/input-group-demo").then((mod) => ({
        default: mod.InputGroupDemoWithKbd,
      })),
    { ssr: false },
  ),
  "input-group-demo-with-tooltip-dropdown-popover": dynamic(
    () =>
      import("./demos/ui/input-group-demo").then((mod) => ({
        default: mod.InputGroupDemoWithTooltipDropdownPopover,
      })),
    { ssr: false },
  ),
  // Aspect Ratio
  "aspect-ratio-demo-default": dynamic(
    () =>
      import("./demos/ui/aspect-ratio-demo").then((mod) => ({
        default: mod.AspectRatioDemoDefault,
      })),
    { ssr: false },
  ),
  "aspect-ratio-demo-square": dynamic(
    () =>
      import("./demos/ui/aspect-ratio-demo").then((mod) => ({
        default: mod.AspectRatioDemoSquare,
      })),
    { ssr: false },
  ),
  "aspect-ratio-demo-16x9": dynamic(
    () =>
      import("./demos/ui/aspect-ratio-demo").then((mod) => ({
        default: mod.AspectRatioDemo16x9,
      })),
    { ssr: false },
  ),
  "aspect-ratio-demo-1x1": dynamic(
    () =>
      import("./demos/ui/aspect-ratio-demo").then((mod) => ({
        default: mod.AspectRatioDemo1x1,
      })),
    { ssr: false },
  ),
  "aspect-ratio-demo-21x9": dynamic(
    () =>
      import("./demos/ui/aspect-ratio-demo").then((mod) => ({
        default: mod.AspectRatioDemo21x9,
      })),
    { ssr: false },
  ),
  "aspect-ratio-demo-9x16": dynamic(
    () =>
      import("./demos/ui/aspect-ratio-demo").then((mod) => ({
        default: mod.AspectRatioDemo9x16,
      })),
    { ssr: false },
  ),
  // Scroll Area
  "scroll-area-demo-default": dynamic(
    () =>
      import("./demos/ui/scroll-area-demo").then((mod) => ({
        default: mod.ScrollAreaDemoDefault,
      })),
    { ssr: false },
  ),
  "scroll-area-demo-horizontal": dynamic(
    () =>
      import("./demos/ui/scroll-area-demo").then((mod) => ({
        default: mod.ScrollAreaDemoHorizontal,
      })),
    { ssr: false },
  ),
  "scroll-area-demo-vertical": dynamic(
    () =>
      import("./demos/ui/scroll-area-demo").then((mod) => ({
        default: mod.ScrollAreaDemoVertical,
      })),
    { ssr: false },
  ),
  // Resizable
  "resizable-demo-default": dynamic(
    () =>
      import("./demos/ui/resizable-demo").then((mod) => ({
        default: mod.ResizableDemoDefault,
      })),
    { ssr: false },
  ),
  "resizable-demo-vertical": dynamic(
    () =>
      import("./demos/ui/resizable-demo").then((mod) => ({
        default: mod.ResizableDemoVertical,
      })),
    { ssr: false },
  ),
  "resizable-demo-with-handle": dynamic(
    () =>
      import("./demos/ui/resizable-demo").then((mod) => ({
        default: mod.ResizableDemoWithHandle,
      })),
    { ssr: false },
  ),
  "resizable-demo-controlled": dynamic(
    () =>
      import("./demos/ui/resizable-demo").then((mod) => ({
        default: mod.ResizableDemoControlled,
      })),
    { ssr: false },
  ),
  "resizable-demo-horizontal": dynamic(
    () =>
      import("./demos/ui/resizable-demo").then((mod) => ({
        default: mod.ResizableDemoHorizontal,
      })),
    { ssr: false },
  ),
  "resizable-demo-nested": dynamic(
    () =>
      import("./demos/ui/resizable-demo").then((mod) => ({
        default: mod.ResizableDemoNested,
      })),
    { ssr: false },
  ),
  // Direction
  "direction-demo-default": dynamic(
    () =>
      import("./demos/ui/direction-demo").then((mod) => ({
        default: mod.DirectionDemoDefault,
      })),
    { ssr: false },
  ),
  "direction-demo-rtl": dynamic(
    () =>
      import("./demos/ui/direction-demo").then((mod) => ({
        default: mod.DirectionDemoRtl,
      })),
    { ssr: false },
  ),
  // Button Group
  "button-group-demo-default": dynamic(
    () =>
      import("./demos/ui/button-group-demo").then((mod) => ({
        default: mod.ButtonGroupDemoDefault,
      })),
    { ssr: false },
  ),
  "button-group-demo-vertical": dynamic(
    () =>
      import("./demos/ui/button-group-demo").then((mod) => ({
        default: mod.ButtonGroupDemoVertical,
      })),
    { ssr: false },
  ),
  "button-group-demo-with-separator": dynamic(
    () =>
      import("./demos/ui/button-group-demo").then((mod) => ({
        default: mod.ButtonGroupDemoWithSeparator,
      })),
    { ssr: false },
  ),
  "button-group-demo-basic": dynamic(
    () =>
      import("./demos/ui/button-group-demo").then((mod) => ({
        default: mod.ButtonGroupDemoBasic,
      })),
    { ssr: false },
  ),
  "button-group-demo-navigation": dynamic(
    () =>
      import("./demos/ui/button-group-demo").then((mod) => ({
        default: mod.ButtonGroupDemoNavigation,
      })),
    { ssr: false },
  ),
  "button-group-demo-nested": dynamic(
    () =>
      import("./demos/ui/button-group-demo").then((mod) => ({
        default: mod.ButtonGroupDemoNested,
      })),
    { ssr: false },
  ),
  "button-group-demo-pagination-split": dynamic(
    () =>
      import("./demos/ui/button-group-demo").then((mod) => ({
        default: mod.ButtonGroupDemoPaginationSplit,
      })),
    { ssr: false },
  ),
  "button-group-demo-pagination": dynamic(
    () =>
      import("./demos/ui/button-group-demo").then((mod) => ({
        default: mod.ButtonGroupDemoPagination,
      })),
    { ssr: false },
  ),
  "button-group-demo-text-alignment": dynamic(
    () =>
      import("./demos/ui/button-group-demo").then((mod) => ({
        default: mod.ButtonGroupDemoTextAlignment,
      })),
    { ssr: false },
  ),
  "button-group-demo-vertical-icons": dynamic(
    () =>
      import("./demos/ui/button-group-demo").then((mod) => ({
        default: mod.ButtonGroupDemoVerticalIcons,
      })),
    { ssr: false },
  ),
  "button-group-demo-vertical-nested": dynamic(
    () =>
      import("./demos/ui/button-group-demo").then((mod) => ({
        default: mod.ButtonGroupDemoVerticalNested,
      })),
    { ssr: false },
  ),
  "button-group-demo-with-dropdown": dynamic(
    () =>
      import("./demos/ui/button-group-demo").then((mod) => ({
        default: mod.ButtonGroupDemoWithDropdown,
      })),
    { ssr: false },
  ),
  "button-group-demo-with-fields": dynamic(
    () =>
      import("./demos/ui/button-group-demo").then((mod) => ({
        default: mod.ButtonGroupDemoWithFields,
      })),
    { ssr: false },
  ),
  "button-group-demo-with-icons": dynamic(
    () =>
      import("./demos/ui/button-group-demo").then((mod) => ({
        default: mod.ButtonGroupDemoWithIcons,
      })),
    { ssr: false },
  ),
  "button-group-demo-with-input-group": dynamic(
    () =>
      import("./demos/ui/button-group-demo").then((mod) => ({
        default: mod.ButtonGroupDemoWithInputGroup,
      })),
    { ssr: false },
  ),
  "button-group-demo-with-input": dynamic(
    () =>
      import("./demos/ui/button-group-demo").then((mod) => ({
        default: mod.ButtonGroupDemoWithInput,
      })),
    { ssr: false },
  ),
  "button-group-demo-with-like": dynamic(
    () =>
      import("./demos/ui/button-group-demo").then((mod) => ({
        default: mod.ButtonGroupDemoWithLike,
      })),
    { ssr: false },
  ),
  "button-group-demo-with-select-and-input": dynamic(
    () =>
      import("./demos/ui/button-group-demo").then((mod) => ({
        default: mod.ButtonGroupDemoWithSelectAndInput,
      })),
    { ssr: false },
  ),
  "button-group-demo-with-select": dynamic(
    () =>
      import("./demos/ui/button-group-demo").then((mod) => ({
        default: mod.ButtonGroupDemoWithSelect,
      })),
    { ssr: false },
  ),
  "button-group-demo-with-text": dynamic(
    () =>
      import("./demos/ui/button-group-demo").then((mod) => ({
        default: mod.ButtonGroupDemoWithText,
      })),
    { ssr: false },
  ),
  "button-group-demo-separated": dynamic(
    () =>
      import("./demos/ui/button-group-demo").then((mod) => ({
        default: mod.ButtonGroupDemoSeparated,
      })),
    { ssr: false },
  ),
  "button-group-demo-separated-outline": dynamic(
    () =>
      import("./demos/ui/button-group-demo").then((mod) => ({
        default: mod.ButtonGroupDemoSeparatedOutline,
      })),
    { ssr: false },
  ),
  "button-group-demo-variants": dynamic(
    () =>
      import("./demos/ui/button-group-demo").then((mod) => ({
        default: mod.ButtonGroupDemoVariants,
      })),
    { ssr: false },
  ),
  // Alert
  "alert-demo-default": dynamic(
    () =>
      import("./demos/ui/alert-demo").then((mod) => ({
        default: mod.AlertDemoDefault,
      })),
    { ssr: false },
  ),
  "alert-demo-info": dynamic(
    () =>
      import("./demos/ui/alert-demo").then((mod) => ({
        default: mod.AlertDemoInfo,
      })),
    { ssr: false },
  ),
  "alert-demo-warning": dynamic(
    () =>
      import("./demos/ui/alert-demo").then((mod) => ({
        default: mod.AlertDemoWarning,
      })),
    { ssr: false },
  ),
  "alert-demo-success": dynamic(
    () =>
      import("./demos/ui/alert-demo").then((mod) => ({
        default: mod.AlertDemoSuccess,
      })),
    { ssr: false },
  ),
  "alert-demo-danger": dynamic(
    () =>
      import("./demos/ui/alert-demo").then((mod) => ({
        default: mod.AlertDemoDanger,
      })),
    { ssr: false },
  ),
  "alert-demo-discovery": dynamic(
    () =>
      import("./demos/ui/alert-demo").then((mod) => ({
        default: mod.AlertDemoDiscovery,
      })),
    { ssr: false },
  ),
  "alert-demo-error": dynamic(
    () =>
      import("./demos/ui/alert-demo").then((mod) => ({
        default: mod.AlertDemoError,
      })),
    { ssr: false },
  ),
  "alert-demo-announcement": dynamic(
    () =>
      import("./demos/ui/alert-demo").then((mod) => ({
        default: mod.AlertDemoAnnouncement,
      })),
    { ssr: false },
  ),
  "alert-demo-compound": dynamic(
    () =>
      import("./demos/ui/alert-demo").then((mod) => ({
        default: mod.AlertDemoCompound,
      })),
    { ssr: false },
  ),
  "alert-demo-appearances": dynamic(
    () =>
      import("./demos/ui/alert-demo").then((mod) => ({
        default: mod.AlertDemoAppearances,
      })),
    { ssr: false },
  ),
  "alert-demo-destructive": dynamic(
    () =>
      import("./demos/ui/alert-demo").then((mod) => ({
        default: mod.AlertDemoDestructive,
      })),
    { ssr: false },
  ),
  "alert-demo-with-action": dynamic(
    () =>
      import("./demos/ui/alert-demo").then((mod) => ({
        default: mod.AlertDemoWithAction,
      })),
    { ssr: false },
  ),
  "alert-demo-basic": dynamic(
    () =>
      import("./demos/ui/alert-demo").then((mod) => ({
        default: mod.AlertDemoBasic,
      })),
    { ssr: false },
  ),
  "alert-demo-with-actions": dynamic(
    () =>
      import("./demos/ui/alert-demo").then((mod) => ({
        default: mod.AlertDemoWithActions,
      })),
    { ssr: false },
  ),
  "alert-demo-with-icons": dynamic(
    () =>
      import("./demos/ui/alert-demo").then((mod) => ({
        default: mod.AlertDemoWithIcons,
      })),
    { ssr: false },
  ),
  // Slider
  "slider-demo-default": dynamic(
    () =>
      import("./demos/ui/slider-demo").then((mod) => ({
        default: mod.SliderDemoDefault,
      })),
    { ssr: false },
  ),
  "slider-demo-range": dynamic(
    () =>
      import("./demos/ui/slider-demo").then((mod) => ({
        default: mod.SliderDemoRange,
      })),
    { ssr: false },
  ),
  "slider-demo-disabled": dynamic(
    () =>
      import("./demos/ui/slider-demo").then((mod) => ({
        default: mod.SliderDemoDisabled,
      })),
    { ssr: false },
  ),
  "slider-demo-basic": dynamic(
    () =>
      import("./demos/ui/slider-demo").then((mod) => ({
        default: mod.SliderDemoBasic,
      })),
    { ssr: false },
  ),
  "slider-demo-controlled": dynamic(
    () =>
      import("./demos/ui/slider-demo").then((mod) => ({
        default: mod.SliderDemoControlled,
      })),
    { ssr: false },
  ),
  "slider-demo-multiple-thumbs": dynamic(
    () =>
      import("./demos/ui/slider-demo").then((mod) => ({
        default: mod.SliderDemoMultipleThumbs,
      })),
    { ssr: false },
  ),
  "slider-demo-vertical": dynamic(
    () =>
      import("./demos/ui/slider-demo").then((mod) => ({
        default: mod.SliderDemoVertical,
      })),
    { ssr: false },
  ),
  // Calendar
  "calendar-demo-default": dynamic(
    () =>
      import("./demos/ui/calendar-demo").then((mod) => ({
        default: mod.CalendarDemoDefault,
      })),
    { ssr: false },
  ),
  "calendar-demo-range": dynamic(
    () =>
      import("./demos/ui/calendar-demo").then((mod) => ({
        default: mod.CalendarDemoRange,
      })),
    { ssr: false },
  ),
  "calendar-demo-booked-dates": dynamic(
    () =>
      import("./demos/ui/calendar-demo").then((mod) => ({
        default: mod.CalendarDemoBookedDates,
      })),
    { ssr: false },
  ),
  "calendar-demo-custom-days": dynamic(
    () =>
      import("./demos/ui/calendar-demo").then((mod) => ({
        default: mod.CalendarDemoCustomDays,
      })),
    { ssr: false },
  ),
  "calendar-demo-date-picker-range": dynamic(
    () =>
      import("./demos/ui/calendar-demo").then((mod) => ({
        default: mod.CalendarDemoDatePickerRange,
      })),
    { ssr: false },
  ),
  "calendar-demo-date-picker-simple": dynamic(
    () =>
      import("./demos/ui/calendar-demo").then((mod) => ({
        default: mod.CalendarDemoDatePickerSimple,
      })),
    { ssr: false },
  ),
  "calendar-demo-date-picker-with-dropdowns": dynamic(
    () =>
      import("./demos/ui/calendar-demo").then((mod) => ({
        default: mod.CalendarDemoDatePickerWithDropdowns,
      })),
    { ssr: false },
  ),
  "calendar-demo-in-card": dynamic(
    () =>
      import("./demos/ui/calendar-demo").then((mod) => ({
        default: mod.CalendarDemoInCard,
      })),
    { ssr: false },
  ),
  "calendar-demo-in-popover": dynamic(
    () =>
      import("./demos/ui/calendar-demo").then((mod) => ({
        default: mod.CalendarDemoInPopover,
      })),
    { ssr: false },
  ),
  "calendar-demo-multiple": dynamic(
    () =>
      import("./demos/ui/calendar-demo").then((mod) => ({
        default: mod.CalendarDemoMultiple,
      })),
    { ssr: false },
  ),
  "calendar-demo-range-multi-month": dynamic(
    () =>
      import("./demos/ui/calendar-demo").then((mod) => ({
        default: mod.CalendarDemoRangeMultiMonth,
      })),
    { ssr: false },
  ),
  "calendar-demo-range-multiple-months": dynamic(
    () =>
      import("./demos/ui/calendar-demo").then((mod) => ({
        default: mod.CalendarDemoRangeMultipleMonths,
      })),
    { ssr: false },
  ),
  "calendar-demo-single": dynamic(
    () =>
      import("./demos/ui/calendar-demo").then((mod) => ({
        default: mod.CalendarDemoSingle,
      })),
    { ssr: false },
  ),
  "calendar-demo-week-numbers": dynamic(
    () =>
      import("./demos/ui/calendar-demo").then((mod) => ({
        default: mod.CalendarDemoWeekNumbers,
      })),
    { ssr: false },
  ),
  "calendar-demo-with-presets": dynamic(
    () =>
      import("./demos/ui/calendar-demo").then((mod) => ({
        default: mod.CalendarDemoWithPresets,
      })),
    { ssr: false },
  ),
  "calendar-demo-with-time": dynamic(
    () =>
      import("./demos/ui/calendar-demo").then((mod) => ({
        default: mod.CalendarDemoWithTime,
      })),
    { ssr: false },
  ),
  // Carousel
  "carousel-demo-default": dynamic(
    () =>
      import("./demos/ui/carousel-demo").then((mod) => ({
        default: mod.CarouselDemoDefault,
      })),
    { ssr: false },
  ),
  "carousel-demo-sizes": dynamic(
    () =>
      import("./demos/ui/carousel-demo").then((mod) => ({
        default: mod.CarouselDemoSizes,
      })),
    { ssr: false },
  ),
  "carousel-demo-vertical": dynamic(
    () =>
      import("./demos/ui/carousel-demo").then((mod) => ({
        default: mod.CarouselDemoVertical,
      })),
    { ssr: false },
  ),
  "carousel-demo-basic": dynamic(
    () =>
      import("./demos/ui/carousel-demo").then((mod) => ({
        default: mod.CarouselDemoBasic,
      })),
    { ssr: false },
  ),
  "carousel-demo-multiple": dynamic(
    () =>
      import("./demos/ui/carousel-demo").then((mod) => ({
        default: mod.CarouselDemoMultiple,
      })),
    { ssr: false },
  ),
  "carousel-demo-with-gap": dynamic(
    () =>
      import("./demos/ui/carousel-demo").then((mod) => ({
        default: mod.CarouselDemoWithGap,
      })),
    { ssr: false },
  ),
  // Chart
  "chart-demo-default": dynamic(
    () =>
      import("./demos/ui/chart-demo").then((mod) => ({
        default: mod.ChartDemoDefault,
      })),
    { ssr: false },
  ),
  "chart-demo-with-legend": dynamic(
    () =>
      import("./demos/ui/chart-demo").then((mod) => ({
        default: mod.ChartDemoWithLegend,
      })),
    { ssr: false },
  ),
  "chart-demo-area-chart": dynamic(
    () =>
      import("./demos/ui/chart-demo").then((mod) => ({
        default: mod.ChartDemoAreaChart,
      })),
    { ssr: false },
  ),
  "chart-demo-bar-chart": dynamic(
    () =>
      import("./demos/ui/chart-demo").then((mod) => ({
        default: mod.ChartDemoBarChart,
      })),
    { ssr: false },
  ),
  "chart-demo-line-chart": dynamic(
    () =>
      import("./demos/ui/chart-demo").then((mod) => ({
        default: mod.ChartDemoLineChart,
      })),
    { ssr: false },
  ),
  "chart-demo-radar-chart": dynamic(
    () =>
      import("./demos/ui/chart-demo").then((mod) => ({
        default: mod.ChartDemoRadarChart,
      })),
    { ssr: false },
  ),
  "chart-demo-radial-chart": dynamic(
    () =>
      import("./demos/ui/chart-demo").then((mod) => ({
        default: mod.ChartDemoRadialChart,
      })),
    { ssr: false },
  ),
  // Sidebar
  "sidebar-demo-default": dynamic(
    () =>
      import("./demos/ui/sidebar-demo").then((mod) => ({
        default: mod.SidebarDemoDefault,
      })),
    { ssr: false },
  ),
  "sidebar-demo-collapsed": dynamic(
    () =>
      import("./demos/ui/sidebar-demo").then((mod) => ({
        default: mod.SidebarDemoCollapsed,
      })),
    { ssr: false },
  ),
  "sidebar-nav-item-demo-default": dynamic(
    () =>
      import("./demos/ui/sidebar-nav-item-demo").then((mod) => ({
        default: mod.SidebarNavItemDemoDefault,
      })),
    { ssr: false },
  ),
  "sidebar-nav-item-demo-expanded": dynamic(
    () =>
      import("./demos/ui/sidebar-nav-item-demo").then((mod) => ({
        default: mod.SidebarNavItemDemoExpanded,
      })),
    { ssr: false },
  ),
  "sidebar-nav-item-demo-hovered": dynamic(
    () =>
      import("./demos/ui/sidebar-nav-item-demo").then((mod) => ({
        default: mod.SidebarNavItemDemoHovered,
      })),
    { ssr: false },
  ),
  "sidebar-nav-item-demo-selected": dynamic(
    () =>
      import("./demos/ui/sidebar-nav-item-demo").then((mod) => ({
        default: mod.SidebarNavItemDemoSelected,
      })),
    { ssr: false },
  ),
  "sidebar-nav-item-demo-focus-visible": dynamic(
    () =>
      import("./demos/ui/sidebar-nav-item-demo").then((mod) => ({
        default: mod.SidebarNavItemDemoFocusVisible,
      })),
    { ssr: false },
  ),
  "sidebar-nav-item-demo-with-count": dynamic(
    () =>
      import("./demos/ui/sidebar-nav-item-demo").then((mod) => ({
        default: mod.SidebarNavItemDemoWithCount,
      })),
    { ssr: false },
  ),
  "sidebar-nav-item-demo-project-count": dynamic(
    () =>
      import("./demos/ui/sidebar-nav-item-demo").then((mod) => ({
        default: mod.SidebarNavItemDemoProjectCount,
      })),
    { ssr: false },
  ),
  // Sonner
  "sonner-demo-default": dynamic(
    () =>
      import("./demos/ui/sonner-demo").then((mod) => ({
        default: mod.SonnerDemoDefault,
      })),
    { ssr: false },
  ),
  "sonner-demo-variants": dynamic(
    () =>
      import("./demos/ui/sonner-demo").then((mod) => ({
        default: mod.SonnerDemoVariants,
      })),
    { ssr: false },
  ),
  "sonner-demo-with-description": dynamic(
    () =>
      import("./demos/ui/sonner-demo").then((mod) => ({
        default: mod.SonnerDemoWithDescription,
      })),
    { ssr: false },
  ),
  "sonner-demo-with-action": dynamic(
    () =>
      import("./demos/ui/sonner-demo").then((mod) => ({
        default: mod.SonnerDemoWithAction,
      })),
    { ssr: false },
  ),
  "sonner-demo-auto-dismiss": dynamic(
    () =>
      import("./demos/ui/sonner-demo").then((mod) => ({
        default: mod.SonnerDemoAutoDismiss,
      })),
    { ssr: false },
  ),
  "sonner-demo-promise": dynamic(
    () =>
      import("./demos/ui/sonner-demo").then((mod) => ({
        default: mod.SonnerDemoPromise,
      })),
    { ssr: false },
  ),
  "sonner-demo-close-button": dynamic(
    () =>
      import("./demos/ui/sonner-demo").then((mod) => ({
        default: mod.SonnerDemoCloseButton,
      })),
    { ssr: false },
  ),
  "sonner-demo-long-title": dynamic(
    () =>
      import("./demos/ui/sonner-demo").then((mod) => ({
        default: mod.SonnerDemoLongTitle,
      })),
    { ssr: false },
  ),
  // Blanket
  "blanket-demo-default": dynamic(
    () =>
      import("./demos/ui/blanket-demo").then((mod) => ({
        default: mod.BlanketDemoDefault,
      })),
    { ssr: false },
  ),
  "blanket-demo-transparent": dynamic(
    () =>
      import("./demos/ui/blanket-demo").then((mod) => ({
        default: mod.BlanketDemoTransparent,
      })),
    { ssr: false },
  ),
  "blanket-demo-with-content": dynamic(
    () =>
      import("./demos/ui/blanket-demo").then((mod) => ({
        default: mod.BlanketDemoWithContent,
      })),
    { ssr: false },
  ),
  // Banner
  "banner-demo-warning": dynamic(
    () =>
      import("./demos/ui/banner-demo").then((mod) => ({
        default: mod.BannerDemoWarning,
      })),
    { ssr: false },
  ),
  "banner-demo-error": dynamic(
    () =>
      import("./demos/ui/banner-demo").then((mod) => ({
        default: mod.BannerDemoError,
      })),
    { ssr: false },
  ),
  "banner-demo-announcement": dynamic(
    () =>
      import("./demos/ui/banner-demo").then((mod) => ({
        default: mod.BannerDemoAnnouncement,
      })),
    { ssr: false },
  ),
  "banner-demo-variants": dynamic(
    () =>
      import("./demos/ui/banner-demo").then((mod) => ({
        default: mod.BannerDemoVariants,
      })),
    { ssr: false },
  ),
  // Comment
  "comment-demo-default": dynamic(
    () =>
      import("./demos/ui/comment-demo").then((mod) => ({
        default: mod.CommentDemoDefault,
      })),
    { ssr: false },
  ),
  "comment-demo-with-time": dynamic(
    () =>
      import("./demos/ui/comment-demo").then((mod) => ({
        default: mod.CommentDemoWithTime,
      })),
    { ssr: false },
  ),
  "comment-demo-with-avatar": dynamic(
    () =>
      import("./demos/ui/comment-demo").then((mod) => ({
        default: mod.CommentDemoWithAvatar,
      })),
    { ssr: false },
  ),
  "comment-demo-with-actions": dynamic(
    () =>
      import("./demos/ui/comment-demo").then((mod) => ({
        default: mod.CommentDemoWithActions,
      })),
    { ssr: false },
  ),
  "comment-demo-full": dynamic(
    () =>
      import("./demos/ui/comment-demo").then((mod) => ({
        default: mod.CommentDemoFull,
      })),
    { ssr: false },
  ),
  "comment-demo-edited": dynamic(
    () =>
      import("./demos/ui/comment-demo").then((mod) => ({
        default: mod.CommentDemoEdited,
      })),
    { ssr: false },
  ),
  "comment-demo-highlighted": dynamic(
    () =>
      import("./demos/ui/comment-demo").then((mod) => ({
        default: mod.CommentDemoHighlighted,
      })),
    { ssr: false },
  ),
  "comment-demo-saving": dynamic(
    () =>
      import("./demos/ui/comment-demo").then((mod) => ({
        default: mod.CommentDemoSaving,
      })),
    { ssr: false },
  ),
  "comment-demo-thread": dynamic(
    () =>
      import("./demos/ui/comment-demo").then((mod) => ({
        default: mod.CommentDemoThread,
      })),
    { ssr: false },
  ),
  // DatePicker
  "date-picker-demo-default": dynamic(
    () =>
      import("./demos/ui/date-picker-demo").then((mod) => ({
        default: mod.DatePickerDemoDefault,
      })),
    { ssr: false },
  ),
  "date-picker-demo-with-value": dynamic(
    () =>
      import("./demos/ui/date-picker-demo").then((mod) => ({
        default: mod.DatePickerDemoWithValue,
      })),
    { ssr: false },
  ),
  "date-picker-demo-placeholder": dynamic(
    () =>
      import("./demos/ui/date-picker-demo").then((mod) => ({
        default: mod.DatePickerDemoPlaceholder,
      })),
    { ssr: false },
  ),
  "date-picker-demo-disabled": dynamic(
    () =>
      import("./demos/ui/date-picker-demo").then((mod) => ({
        default: mod.DatePickerDemoDisabled,
      })),
    { ssr: false },
  ),
  // Forms
  "forms-demo-tanstack-basic": dynamic(
    () =>
      import("./demos/ui/forms-demo").then((mod) => ({
        default: mod.FormDemoTanstackBasic,
      })),
    { ssr: false },
  ),
  "forms-demo-tanstack-input": dynamic(
    () =>
      import("./demos/ui/forms-demo").then((mod) => ({
        default: mod.FormDemoTanstackInput,
      })),
    { ssr: false },
  ),
  "forms-demo-tanstack-textarea": dynamic(
    () =>
      import("./demos/ui/forms-demo").then((mod) => ({
        default: mod.FormDemoTanstackTextarea,
      })),
    { ssr: false },
  ),
  "forms-demo-tanstack-select": dynamic(
    () =>
      import("./demos/ui/forms-demo").then((mod) => ({
        default: mod.FormDemoTanstackSelect,
      })),
    { ssr: false },
  ),
  "forms-demo-tanstack-checkbox": dynamic(
    () =>
      import("./demos/ui/forms-demo").then((mod) => ({
        default: mod.FormDemoTanstackCheckbox,
      })),
    { ssr: false },
  ),
  "forms-demo-tanstack-radiogroup": dynamic(
    () =>
      import("./demos/ui/forms-demo").then((mod) => ({
        default: mod.FormDemoTanstackRadioGroup,
      })),
    { ssr: false },
  ),
  "forms-demo-tanstack-switch": dynamic(
    () =>
      import("./demos/ui/forms-demo").then((mod) => ({
        default: mod.FormDemoTanstackSwitch,
      })),
    { ssr: false },
  ),
  "forms-demo-tanstack-complex": dynamic(
    () =>
      import("./demos/ui/forms-demo").then((mod) => ({
        default: mod.FormDemoTanstackComplex,
      })),
    { ssr: false },
  ),
  "forms-demo-tanstack-array": dynamic(
    () =>
      import("./demos/ui/forms-demo").then((mod) => ({
        default: mod.FormDemoTanstackArray,
      })),
    { ssr: false },
  ),
  "forms-demo-ads-basic": dynamic(
    () =>
      import("./demos/ui/forms-demo").then((mod) => ({
        default: mod.FormDemoAdsBasicForm,
      })),
    { ssr: false },
  ),
  "forms-demo-ads-validation": dynamic(
    () =>
      import("./demos/ui/forms-demo").then((mod) => ({
        default: mod.FormDemoAdsFieldValidation,
      })),
    { ssr: false },
  ),
  "forms-demo-ads-disabled": dynamic(
    () =>
      import("./demos/ui/forms-demo").then((mod) => ({
        default: mod.FormDemoAdsDisabled,
      })),
    { ssr: false },
  ),
  // Icon
  "icon-demo-default": dynamic(
    () =>
      import("./demos/ui/icon-demo").then((mod) => ({
        default: mod.IconDemoDefault,
      })),
    { ssr: false },
  ),
  "icon-demo-multiple": dynamic(
    () =>
      import("./demos/ui/icon-demo").then((mod) => ({
        default: mod.IconDemoMultiple,
      })),
    { ssr: false },
  ),
  "icon-demo-sized": dynamic(
    () =>
      import("./demos/ui/icon-demo").then((mod) => ({
        default: mod.IconDemoSized,
      })),
    { ssr: false },
  ),
  "icon-demo-colored": dynamic(
    () =>
      import("./demos/ui/icon-demo").then((mod) => ({
        default: mod.IconDemoColored,
      })),
    { ssr: false },
  ),
  // Icon Tile
  "icon-tile-demo-default": dynamic(
    () =>
      import("./demos/ui/icon-tile-demo").then((mod) => ({
        default: mod.IconTileDemoDefault,
      })),
    { ssr: false },
  ),
  "icon-tile-demo-sizes": dynamic(
    () =>
      import("./demos/ui/icon-tile-demo").then((mod) => ({
        default: mod.IconTileDemoSizes,
      })),
    { ssr: false },
  ),
  "icon-tile-demo-appearances": dynamic(
    () =>
      import("./demos/ui/icon-tile-demo").then((mod) => ({
        default: mod.IconTileDemoAppearances,
      })),
    { ssr: false },
  ),
  "icon-tile-demo-appearances-bold": dynamic(
    () =>
      import("./demos/ui/icon-tile-demo").then((mod) => ({
        default: mod.IconTileDemoAppearancesBold,
      })),
    { ssr: false },
  ),
  "icon-tile-demo-shapes": dynamic(
    () =>
      import("./demos/ui/icon-tile-demo").then((mod) => ({
        default: mod.IconTileDemoShapes,
      })),
    { ssr: false },
  ),
  // Inline Edit
  "inline-edit-demo-default": dynamic(
    () =>
      import("./demos/ui/inline-edit-demo").then((mod) => ({
        default: mod.InlineEditDemoDefault,
      })),
    { ssr: false },
  ),
  "inline-edit-demo-with-placeholder": dynamic(
    () =>
      import("./demos/ui/inline-edit-demo").then((mod) => ({
        default: mod.InlineEditDemoWithPlaceholder,
      })),
    { ssr: false },
  ),
  "inline-edit-demo-multiple": dynamic(
    () =>
      import("./demos/ui/inline-edit-demo").then((mod) => ({
        default: mod.InlineEditDemoMultiple,
      })),
    { ssr: false },
  ),
  "inline-edit-demo-with-cancel": dynamic(
    () =>
      import("./demos/ui/inline-edit-demo").then((mod) => ({
        default: mod.InlineEditDemoWithCancel,
      })),
    { ssr: false },
  ),
  "inline-edit-demo-validation": dynamic(
    () =>
      import("./demos/ui/inline-edit-demo").then((mod) => ({
        default: mod.InlineEditDemoValidation,
      })),
    { ssr: false },
  ),
  // Logo
  "logo-demo-icons": dynamic(
    () =>
      import("./demos/ui/logo-demo").then((mod) => ({
        default: mod.LogoDemoIcons,
      })),
    { ssr: false },
  ),
  "logo-demo-lockups": dynamic(
    () =>
      import("./demos/ui/logo-demo").then((mod) => ({
        default: mod.LogoDemoLockups,
      })),
    { ssr: false },
  ),
  "logo-demo-sizes": dynamic(
    () =>
      import("./demos/ui/logo-demo").then((mod) => ({
        default: mod.LogoDemoSizes,
      })),
    { ssr: false },
  ),
  "logo-demo-appearances": dynamic(
    () =>
      import("./demos/ui/logo-demo").then((mod) => ({
        default: mod.LogoDemoAppearances,
      })),
    { ssr: false },
  ),
  "logo-demo-custom": dynamic(
    () =>
      import("./demos/ui/logo-demo").then((mod) => ({
        default: mod.LogoDemoCustom,
      })),
    { ssr: false },
  ),
  "logo-demo-named-exports": dynamic(
    () =>
      import("./demos/ui/logo-demo").then((mod) => ({
        default: mod.LogoDemoNamedExports,
      })),
    { ssr: false },
  ),
  // Lozenge
  "lozenge-demo-default": dynamic(
    () =>
      import("./demos/ui/lozenge-demo").then((mod) => ({
        default: mod.LozengeDemoDefault,
      })),
    { ssr: false },
  ),
  "lozenge-demo-appearances": dynamic(
    () =>
      import("./demos/ui/lozenge-demo").then((mod) => ({
        default: mod.LozengeDemoAppearances,
      })),
    { ssr: false },
  ),
  "lozenge-demo-accent-colors": dynamic(
    () =>
      import("./demos/ui/lozenge-demo").then((mod) => ({
        default: mod.LozengeDemoAccentColors,
      })),
    { ssr: false },
  ),
  "lozenge-demo-spacing": dynamic(
    () =>
      import("./demos/ui/lozenge-demo").then((mod) => ({
        default: mod.LozengeDemoSpacing,
      })),
    { ssr: false },
  ),
  "lozenge-demo-with-icon": dynamic(
    () =>
      import("./demos/ui/lozenge-demo").then((mod) => ({
        default: mod.LozengeDemoWithIcon,
      })),
    { ssr: false },
  ),
  "lozenge-demo-trailing-metric": dynamic(
    () =>
      import("./demos/ui/lozenge-demo").then((mod) => ({
        default: mod.LozengeDemoTrailingMetric,
      })),
    { ssr: false },
  ),
  "lozenge-demo-max-width": dynamic(
    () =>
      import("./demos/ui/lozenge-demo").then((mod) => ({
        default: mod.LozengeDemoMaxWidth,
      })),
    { ssr: false },
  ),
  "lozenge-demo-dropdown-trigger": dynamic(
    () =>
      import("./demos/ui/lozenge-demo").then((mod) => ({
        default: mod.LozengeDemoDropdownTrigger,
      })),
    { ssr: false },
  ),
  "lozenge-demo-dropdown-trigger-appearances": dynamic(
    () =>
      import("./demos/ui/lozenge-demo").then((mod) => ({
        default: mod.LozengeDemoDropdownTriggerAppearances,
      })),
    { ssr: false },
  ),
  "lozenge-demo-usage": dynamic(
    () =>
      import("./demos/ui/lozenge-demo").then((mod) => ({
        default: mod.LozengeDemoUsage,
      })),
    { ssr: false },
  ),
  // Menu Group
  "menu-group-demo-default": dynamic(
    () =>
      import("./demos/ui/menu-group-demo").then((mod) => ({
        default: mod.MenuGroupDemoDefault,
      })),
    { ssr: false },
  ),
  "menu-group-demo-menu-structure": dynamic(
    () =>
      import("./demos/ui/menu-group-demo").then((mod) => ({
        default: mod.MenuGroupDemoMenuStructure,
      })),
    { ssr: false },
  ),
  "menu-group-demo-button-item": dynamic(
    () =>
      import("./demos/ui/menu-group-demo").then((mod) => ({
        default: mod.MenuGroupDemoButtonItem,
      })),
    { ssr: false },
  ),
  "menu-group-demo-link-item": dynamic(
    () =>
      import("./demos/ui/menu-group-demo").then((mod) => ({
        default: mod.MenuGroupDemoLinkItem,
      })),
    { ssr: false },
  ),
  "menu-group-demo-custom-item": dynamic(
    () =>
      import("./demos/ui/menu-group-demo").then((mod) => ({
        default: mod.MenuGroupDemoCustomItem,
      })),
    { ssr: false },
  ),
  "menu-group-demo-section-and-heading": dynamic(
    () =>
      import("./demos/ui/menu-group-demo").then((mod) => ({
        default: mod.MenuGroupDemoSectionAndHeading,
      })),
    { ssr: false },
  ),
  "menu-group-demo-density": dynamic(
    () =>
      import("./demos/ui/menu-group-demo").then((mod) => ({
        default: mod.MenuGroupDemoDensity,
      })),
    { ssr: false },
  ),
  "menu-group-demo-scrolling": dynamic(
    () =>
      import("./demos/ui/menu-group-demo").then((mod) => ({
        default: mod.MenuGroupDemoScrolling,
      })),
    { ssr: false },
  ),
  "menu-group-demo-loading": dynamic(
    () =>
      import("./demos/ui/menu-group-demo").then((mod) => ({
        default: mod.MenuGroupDemoLoading,
      })),
    { ssr: false },
  ),
  // Object Tile
  "object-tile-demo-default": dynamic(
    () =>
      import("./demos/ui/object-tile-demo").then((mod) => ({
        default: mod.ObjectTileDemoDefault,
      })),
    { ssr: false },
  ),
  "object-tile-demo-description": dynamic(
    () =>
      import("./demos/ui/object-tile-demo").then((mod) => ({
        default: mod.ObjectTileDemoDescription,
      })),
    { ssr: false },
  ),
  "object-tile-demo-meta": dynamic(
    () =>
      import("./demos/ui/object-tile-demo").then((mod) => ({
        default: mod.ObjectTileDemoMeta,
      })),
    { ssr: false },
  ),
  "object-tile-demo-link": dynamic(
    () =>
      import("./demos/ui/object-tile-demo").then((mod) => ({
        default: mod.ObjectTileDemoLink,
      })),
    { ssr: false },
  ),
  "object-tile-demo-list": dynamic(
    () =>
      import("./demos/ui/object-tile-demo").then((mod) => ({
        default: mod.ObjectTileDemoList,
      })),
    { ssr: false },
  ),
  "object-tile-demo-with-avatar": dynamic(
    () =>
      import("./demos/ui/object-tile-demo").then((mod) => ({
        default: mod.ObjectTileDemoWithAvatar,
      })),
    { ssr: false },
  ),
  // Page Header
  "page-header-demo-default": dynamic(
    () =>
      import("./demos/ui/page-header-demo").then((mod) => ({
        default: mod.PageHeaderDemoDefault,
      })),
    { ssr: false },
  ),
  "page-header-demo-with-description": dynamic(
    () =>
      import("./demos/ui/page-header-demo").then((mod) => ({
        default: mod.PageHeaderDemoWithDescription,
      })),
    { ssr: false },
  ),
  "page-header-demo-with-actions": dynamic(
    () =>
      import("./demos/ui/page-header-demo").then((mod) => ({
        default: mod.PageHeaderDemoWithActions,
      })),
    { ssr: false },
  ),
  "page-header-demo-with-breadcrumbs": dynamic(
    () =>
      import("./demos/ui/page-header-demo").then((mod) => ({
        default: mod.PageHeaderDemoWithBreadcrumbs,
      })),
    { ssr: false },
  ),
  "page-header-demo-title-only": dynamic(
    () =>
      import("./demos/ui/page-header-demo").then((mod) => ({
        default: mod.PageHeaderDemoTitleOnly,
      })),
    { ssr: false },
  ),
  // Progress Indicator
  "progress-indicator-demo-default": dynamic(
    () =>
      import("./demos/ui/progress-indicator-demo").then((mod) => ({
        default: mod.ProgressIndicatorDemoDefault,
      })),
    { ssr: false },
  ),
  "progress-indicator-demo-appearances": dynamic(
    () =>
      import("./demos/ui/progress-indicator-demo").then((mod) => ({
        default: mod.ProgressIndicatorDemoAppearances,
      })),
    { ssr: false },
  ),
  "progress-indicator-demo-sizes": dynamic(
    () =>
      import("./demos/ui/progress-indicator-demo").then((mod) => ({
        default: mod.ProgressIndicatorDemoSizes,
      })),
    { ssr: false },
  ),
  "progress-indicator-demo-interaction": dynamic(
    () =>
      import("./demos/ui/progress-indicator-demo").then((mod) => ({
        default: mod.ProgressIndicatorDemoInteraction,
      })),
    { ssr: false },
  ),
  "progress-indicator-demo-start": dynamic(
    () =>
      import("./demos/ui/progress-indicator-demo").then((mod) => ({
        default: mod.ProgressIndicatorDemoStart,
      })),
    { ssr: false },
  ),
  "progress-indicator-demo-complete": dynamic(
    () =>
      import("./demos/ui/progress-indicator-demo").then((mod) => ({
        default: mod.ProgressIndicatorDemoComplete,
      })),
    { ssr: false },
  ),
  "progress-indicator-demo-three-steps": dynamic(
    () =>
      import("./demos/ui/progress-indicator-demo").then((mod) => ({
        default: mod.ProgressIndicatorDemoThreeSteps,
      })),
    { ssr: false },
  ),
  // Progress Tracker
  "progress-tracker-demo-default": dynamic(
    () =>
      import("./demos/ui/progress-tracker-demo").then((mod) => ({
        default: mod.ProgressTrackerDemoDefault,
      })),
    { ssr: false },
  ),
  "progress-tracker-demo-all-done": dynamic(
    () =>
      import("./demos/ui/progress-tracker-demo").then((mod) => ({
        default: mod.ProgressTrackerDemoAllDone,
      })),
    { ssr: false },
  ),
  "progress-tracker-demo-all-todo": dynamic(
    () =>
      import("./demos/ui/progress-tracker-demo").then((mod) => ({
        default: mod.ProgressTrackerDemoAllTodo,
      })),
    { ssr: false },
  ),
  // Split Button
  "split-button-demo-default": dynamic(
    () =>
      import("./demos/ui/split-button-demo").then((mod) => ({
        default: mod.SplitButtonDemoDefault,
      })),
    { ssr: false },
  ),
  "split-button-demo-outline": dynamic(
    () =>
      import("./demos/ui/split-button-demo").then((mod) => ({
        default: mod.SplitButtonDemoOutline,
      })),
    { ssr: false },
  ),
  "split-button-demo-destructive": dynamic(
    () =>
      import("./demos/ui/split-button-demo").then((mod) => ({
        default: mod.SplitButtonDemoDestructive,
      })),
    { ssr: false },
  ),
  "split-button-demo-disabled": dynamic(
    () =>
      import("./demos/ui/split-button-demo").then((mod) => ({
        default: mod.SplitButtonDemoDisabled,
      })),
    { ssr: false },
  ),
  "split-button-demo-variants": dynamic(
    () =>
      import("./demos/ui/split-button-demo").then((mod) => ({
        default: mod.SplitButtonDemoVariants,
      })),
    { ssr: false },
  ),
  // Skill Card
  "skill-card-demo-default": dynamic(
    () =>
      import("./demos/ui/skill-card-demo").then((mod) => ({
        default: mod.default,
      })),
    { ssr: false },
  ),
  "skill-card-demo-app-source": dynamic(
    () =>
      import("./demos/ui/skill-card-demo").then((mod) => ({
        default: mod.SkillCardDemoAppSource,
      })),
    { ssr: false },
  ),
  "skill-card-demo-custom-source": dynamic(
    () =>
      import("./demos/ui/skill-card-demo").then((mod) => ({
        default: mod.SkillCardDemoCustomSource,
      })),
    { ssr: false },
  ),
  "skill-card-demo-no-description": dynamic(
    () =>
      import("./demos/ui/skill-card-demo").then((mod) => ({
        default: mod.SkillCardDemoWithoutDescription,
      })),
    { ssr: false },
  ),
  // Skill Tag
  "skill-tag-demo-default": dynamic(
    () =>
      import("./demos/ui/skill-tag-demo").then((mod) => ({
        default: mod.SkillTagDemoDefault,
      })),
    { ssr: false },
  ),
  "skill-tag-demo-colors": dynamic(
    () =>
      import("./demos/ui/skill-tag-demo").then((mod) => ({
        default: mod.SkillTagDemoColors,
      })),
    { ssr: false },
  ),
  "skill-tag-demo-with-icon": dynamic(
    () =>
      import("./demos/ui/skill-tag-demo").then((mod) => ({
        default: mod.SkillTagDemoWithIcon,
      })),
    { ssr: false },
  ),
  "skill-tag-demo-interactive": dynamic(
    () =>
      import("./demos/ui/skill-tag-demo").then((mod) => ({
        default: mod.SkillTagDemoInteractive,
      })),
    { ssr: false },
  ),
  "skill-tag-demo-group": dynamic(
    () =>
      import("./demos/ui/skill-tag-demo").then((mod) => ({
        default: mod.SkillTagDemoGroup,
      })),
    { ssr: false },
  ),
  "skill-tag-demo-inline": dynamic(
    () =>
      import("./demos/ui/skill-tag-demo").then((mod) => ({
        default: mod.SkillTagDemoInline,
      })),
    { ssr: false },
  ),
  // Tag
  "tag-demo-default": dynamic(
    () =>
      import("./demos/ui/tag-demo").then((mod) => ({
        default: mod.TagDemoDefault,
      })),
    { ssr: false },
  ),
  "tag-demo-removable": dynamic(
    () =>
      import("./demos/ui/tag-demo").then((mod) => ({
        default: mod.TagDemoRemovable,
      })),
    { ssr: false },
  ),
  "tag-demo-variants": dynamic(
    () =>
      import("./demos/ui/tag-demo").then((mod) => ({
        default: mod.TagDemoVariants,
      })),
    { ssr: false },
  ),
  "tag-demo-removable-variants": dynamic(
    () =>
      import("./demos/ui/tag-demo").then((mod) => ({
        default: mod.TagDemoRemovableVariants,
      })),
    { ssr: false },
  ),
  "tag-demo-disabled": dynamic(
    () =>
      import("./demos/ui/tag-demo").then((mod) => ({
        default: mod.TagDemoDisabled,
      })),
    { ssr: false },
  ),
  "tag-demo-colors": dynamic(
    () =>
      import("./demos/ui/tag-demo").then((mod) => ({
        default: mod.TagDemoColors,
      })),
    { ssr: false },
  ),
  "tag-demo-rounded": dynamic(
    () =>
      import("./demos/ui/tag-demo").then((mod) => ({
        default: mod.TagDemoRounded,
      })),
    { ssr: false },
  ),
  "tag-demo-avatar-tags": dynamic(
    () =>
      import("./demos/ui/tag-demo").then((mod) => ({
        default: mod.TagDemoAvatarTags,
      })),
    { ssr: false },
  ),
  "tag-demo-tag-group": dynamic(
    () =>
      import("./demos/ui/tag-demo").then((mod) => ({
        default: mod.TagDemoTagGroup,
      })),
    { ssr: false },
  ),
  "tag-demo-tag-group-removable": dynamic(
    () =>
      import("./demos/ui/tag-demo").then((mod) => ({
        default: mod.TagDemoTagGroupRemovable,
      })),
    { ssr: false },
  ),
  "tag-demo-tag-group-variants": dynamic(
    () =>
      import("./demos/ui/tag-demo").then((mod) => ({
        default: mod.TagDemoTagGroupVariants,
      })),
    { ssr: false },
  ),
  // Time Picker
  "time-picker-demo-default": dynamic(
    () =>
      import("./demos/ui/time-picker-demo").then((mod) => ({
        default: mod.TimePickerDemoDefault,
      })),
    { ssr: false },
  ),
  "time-picker-demo-with-value": dynamic(
    () =>
      import("./demos/ui/time-picker-demo").then((mod) => ({
        default: mod.TimePickerDemoWithValue,
      })),
    { ssr: false },
  ),
  "time-picker-demo-15-min": dynamic(
    () =>
      import("./demos/ui/time-picker-demo").then((mod) => ({
        default: mod.TimePickerDemo15Min,
      })),
    { ssr: false },
  ),
  "time-picker-demo-disabled": dynamic(
    () =>
      import("./demos/ui/time-picker-demo").then((mod) => ({
        default: mod.TimePickerDemoDisabled,
      })),
    { ssr: false },
  ),
  // Tile
  "tile-demo-default": dynamic(
    () =>
      import("./demos/ui/tile-demo").then((mod) => ({
        default: mod.TileDemoDefault,
      })),
    { ssr: false },
  ),
  "tile-demo-sizes": dynamic(
    () =>
      import("./demos/ui/tile-demo").then((mod) => ({
        default: mod.TileDemoSizes,
      })),
    { ssr: false },
  ),
  "tile-demo-appearances": dynamic(
    () =>
      import("./demos/ui/tile-demo").then((mod) => ({
        default: mod.TileDemoAppearances,
      })),
    { ssr: false },
  ),
  "tile-demo-border": dynamic(
    () =>
      import("./demos/ui/tile-demo").then((mod) => ({
        default: mod.TileDemoBorder,
      })),
    { ssr: false },
  ),
  "tile-demo-inset": dynamic(
    () =>
      import("./demos/ui/tile-demo").then((mod) => ({
        default: mod.TileDemoInset,
      })),
    { ssr: false },
  ),
  // Date Time Picker
  "date-time-picker-demo-default": dynamic(
    () =>
      import("./demos/ui/date-time-picker-demo").then((mod) => ({
        default: mod.DateTimePickerDemoDefault,
      })),
    { ssr: false },
  ),
  "date-time-picker-demo-with-value": dynamic(
    () =>
      import("./demos/ui/date-time-picker-demo").then((mod) => ({
        default: mod.DateTimePickerDemoWithValue,
      })),
    { ssr: false },
  ),
  "date-time-picker-demo-disabled": dynamic(
    () =>
      import("./demos/ui/date-time-picker-demo").then((mod) => ({
        default: mod.DateTimePickerDemoDisabled,
      })),
    { ssr: false },
  ),
};

const UI_CUSTOM_VARIANT_DEMOS: Record<string, ComponentType> = {
  "audio-player-demo-full": dynamic(
    () =>
      import("./demos/ui-custom/audio-player-demo").then((mod) => ({
        default: mod.AudioPlayerDemoFull,
      })),
    { ssr: false },
  ),
  "audio-player-demo-compact": dynamic(
    () =>
      import("./demos/ui-custom/audio-player-demo").then((mod) => ({
        default: mod.AudioPlayerDemoCompact,
      })),
    { ssr: false },
  ),
  "audio-player-demo-with-volume": dynamic(
    () =>
      import("./demos/ui-custom/audio-player-demo").then((mod) => ({
        default: mod.AudioPlayerDemoWithVolume,
      })),
    { ssr: false },
  ),
  "agent-demo-full": dynamic(
    () =>
      import("./demos/ui-custom/agent-demo").then((mod) => ({
        default: mod.AgentDemoFull,
      })),
    { ssr: false },
  ),
  "agent-demo-with-tools": dynamic(
    () =>
      import("./demos/ui-custom/agent-demo").then((mod) => ({
        default: mod.AgentDemoWithTools,
      })),
    { ssr: false },
  ),
  "agent-demo-with-output": dynamic(
    () =>
      import("./demos/ui-custom/agent-demo").then((mod) => ({
        default: mod.AgentDemoWithOutput,
      })),
    { ssr: false },
  ),
  "agent-demo-minimal": dynamic(
    () =>
      import("./demos/ui-custom/agent-demo").then((mod) => ({
        default: mod.AgentDemoMinimal,
      })),
    { ssr: false },
  ),
  "animated-dots-demo-custom-colors": dynamic(
    () =>
      import("./demos/ui-custom/animated-dots-demo").then((mod) => ({
        default: mod.AnimatedDotsDemoCustomColors,
      })),
    { ssr: false },
  ),
  "animated-dots-demo-timing": dynamic(
    () =>
      import("./demos/ui-custom/animated-dots-demo").then((mod) => ({
        default: mod.AnimatedDotsDemoTiming,
      })),
    { ssr: false },
  ),
  "animated-dots-demo-sizes": dynamic(
    () =>
      import("./demos/ui-custom/animated-dots-demo").then((mod) => ({
        default: mod.AnimatedDotsDemoSizes,
      })),
    { ssr: false },
  ),
  "animated-rovo-demo": dynamic(
    () => import("./demos/ui-custom/animated-rovo-demo"),
    { ssr: false },
  ),
  "rovo-generation-demo-default": dynamic(
    () =>
      import("./demos/ui-custom/rovo-generation-demo").then((mod) => ({
        default: mod.RovoGenerationDemoDefault,
      })),
    { ssr: false },
  ),
  "rovo-generation-demo-rainbow-glow": dynamic(
    () =>
      import("./demos/ui-custom/rovo-generation-demo").then((mod) => ({
        default: mod.RovoGenerationDemoRainbowGlow,
      })),
    { ssr: false },
  ),
  "rovo-generation-demo-rainbow-border": dynamic(
    () =>
      import("./demos/ui-custom/rovo-generation-demo").then((mod) => ({
        default: mod.RovoGenerationDemoRainbowBorder,
      })),
    { ssr: false },
  ),
  "rovo-generation-demo-rainbow-glow-and-border": dynamic(
    () =>
      import("./demos/ui-custom/rovo-generation-demo").then((mod) => ({
        default: mod.RovoGenerationDemoRainbowGlowAndBorder,
      })),
    { ssr: false },
  ),
  "attachments-demo-grid": dynamic(
    () =>
      import("./demos/ui-custom/attachments-demo").then((mod) => ({
        default: mod.AttachmentsDemoGrid,
      })),
    { ssr: false },
  ),
  "attachments-demo-inline": dynamic(
    () =>
      import("./demos/ui-custom/attachments-demo").then((mod) => ({
        default: mod.AttachmentsDemoInline,
      })),
    { ssr: false },
  ),
  "attachments-demo-list": dynamic(
    () =>
      import("./demos/ui-custom/attachments-demo").then((mod) => ({
        default: mod.AttachmentsDemoList,
      })),
    { ssr: false },
  ),
  "attachments-demo-hover-card": dynamic(
    () =>
      import("./demos/ui-custom/attachments-demo").then((mod) => ({
        default: mod.AttachmentsDemoHoverCard,
      })),
    { ssr: false },
  ),
  "attachments-demo-read-only": dynamic(
    () =>
      import("./demos/ui-custom/attachments-demo").then((mod) => ({
        default: mod.AttachmentsDemoReadOnly,
      })),
    { ssr: false },
  ),
  "attachments-demo-empty": dynamic(
    () =>
      import("./demos/ui-custom/attachments-demo").then((mod) => ({
        default: mod.AttachmentsDemoEmpty,
      })),
    { ssr: false },
  ),
  "artifact-demo-code-preview": dynamic(
    () =>
      import("./demos/ui-custom/artifact-demo").then((mod) => ({
        default: mod.ArtifactDemoCodePreview,
      })),
    { ssr: false },
  ),
  "artifact-demo-image-preview": dynamic(
    () =>
      import("./demos/ui-custom/artifact-demo").then((mod) => ({
        default: mod.ArtifactDemoImagePreview,
      })),
    { ssr: false },
  ),
  "artifact-demo-streaming": dynamic(
    () =>
      import("./demos/ui-custom/artifact-demo").then((mod) => ({
        default: mod.ArtifactDemoStreaming,
      })),
    { ssr: false },
  ),
  "artifact-demo-chip": dynamic(
    () =>
      import("./demos/ui-custom/artifact-demo").then((mod) => ({
        default: mod.ArtifactDemoChip,
      })),
    { ssr: false },
  ),
  "artifact-demo-compound": dynamic(
    () =>
      import("./demos/ui-custom/artifact-demo").then((mod) => ({
        default: mod.ArtifactDemoCompound,
      })),
    { ssr: false },
  ),
  "checkpoint-demo-conversation": dynamic(
    () =>
      import("./demos/ui-custom/checkpoint-demo").then((mod) => ({
        default: mod.CheckpointDemoConversation,
      })),
    { ssr: false },
  ),
  "checkpoint-demo-basic": dynamic(
    () =>
      import("./demos/ui-custom/checkpoint-demo").then((mod) => ({
        default: mod.CheckpointDemoBasic,
      })),
    { ssr: false },
  ),
  "checkpoint-demo-with-tooltip": dynamic(
    () =>
      import("./demos/ui-custom/checkpoint-demo").then((mod) => ({
        default: mod.CheckpointDemoWithTooltip,
      })),
    { ssr: false },
  ),
  "checkpoint-demo-custom-icon": dynamic(
    () =>
      import("./demos/ui-custom/checkpoint-demo").then((mod) => ({
        default: mod.CheckpointDemoCustomIcon,
      })),
    { ssr: false },
  ),
  "commit-demo-full": dynamic(
    () =>
      import("./demos/ui-custom/commit-demo").then((mod) => ({
        default: mod.CommitDemoFull,
      })),
    { ssr: false },
  ),
  "commit-demo-with-files": dynamic(
    () =>
      import("./demos/ui-custom/commit-demo").then((mod) => ({
        default: mod.CommitDemoWithFiles,
      })),
    { ssr: false },
  ),
  "commit-demo-minimal": dynamic(
    () =>
      import("./demos/ui-custom/commit-demo").then((mod) => ({
        default: mod.CommitDemoMinimal,
      })),
    { ssr: false },
  ),
  "commit-demo-multiple": dynamic(
    () =>
      import("./demos/ui-custom/commit-demo").then((mod) => ({
        default: mod.CommitDemoMultiple,
      })),
    { ssr: false },
  ),
  "confirmation-demo-request": dynamic(
    () =>
      import("./demos/ui-custom/confirmation-demo").then((mod) => ({
        default: mod.ConfirmationDemoRequest,
      })),
    { ssr: false },
  ),
  "confirmation-demo-accepted": dynamic(
    () =>
      import("./demos/ui-custom/confirmation-demo").then((mod) => ({
        default: mod.ConfirmationDemoAccepted,
      })),
    { ssr: false },
  ),
  "confirmation-demo-rejected": dynamic(
    () =>
      import("./demos/ui-custom/confirmation-demo").then((mod) => ({
        default: mod.ConfirmationDemoRejected,
      })),
    { ssr: false },
  ),
  "confirmation-demo-interactive": dynamic(
    () =>
      import("./demos/ui-custom/confirmation-demo").then((mod) => ({
        default: mod.ConfirmationDemoInteractive,
      })),
    { ssr: false },
  ),
  "confirmation-demo-variants": dynamic(
    () =>
      import("./demos/ui-custom/confirmation-demo").then((mod) => ({
        default: mod.ConfirmationDemoVariants,
      })),
    { ssr: false },
  ),
  "context-demo-with-cost": dynamic(
    () =>
      import("./demos/ui-custom/context-demo").then((mod) => ({
        default: mod.ContextDemoWithCost,
      })),
    { ssr: false },
  ),
  "context-demo-minimal": dynamic(
    () =>
      import("./demos/ui-custom/context-demo").then((mod) => ({
        default: mod.ContextDemoMinimal,
      })),
    { ssr: false },
  ),
  "context-demo-high-usage": dynamic(
    () =>
      import("./demos/ui-custom/context-demo").then((mod) => ({
        default: mod.ContextDemoHighUsage,
      })),
    { ssr: false },
  ),
  "context-demo-custom-trigger": dynamic(
    () =>
      import("./demos/ui-custom/context-demo").then((mod) => ({
        default: mod.ContextDemoCustomTrigger,
      })),
    { ssr: false },
  ),
  "environment-variables-demo-with-copy": dynamic(
    () =>
      import("./demos/ui-custom/environment-variables-demo").then((mod) => ({
        default: mod.EnvironmentVariablesDemoWithCopy,
      })),
    { ssr: false },
  ),
  "environment-variables-demo-with-required": dynamic(
    () =>
      import("./demos/ui-custom/environment-variables-demo").then((mod) => ({
        default: mod.EnvironmentVariablesDemoWithRequired,
      })),
    { ssr: false },
  ),
  "environment-variables-demo-revealed": dynamic(
    () =>
      import("./demos/ui-custom/environment-variables-demo").then((mod) => ({
        default: mod.EnvironmentVariablesDemoRevealed,
      })),
    { ssr: false },
  ),
  "environment-variables-demo-minimal": dynamic(
    () =>
      import("./demos/ui-custom/environment-variables-demo").then((mod) => ({
        default: mod.EnvironmentVariablesDemoMinimal,
      })),
    { ssr: false },
  ),
  "controls-demo-default": dynamic(
    () =>
      import("./demos/ui-custom/controls-demo").then((mod) => ({
        default: mod.ControlsDemoDefault,
      })),
    { ssr: false },
  ),
  "controls-demo-position": dynamic(
    () =>
      import("./demos/ui-custom/controls-demo").then((mod) => ({
        default: mod.ControlsDemoPosition,
      })),
    { ssr: false },
  ),
  "controls-demo-zoom-only": dynamic(
    () =>
      import("./demos/ui-custom/controls-demo").then((mod) => ({
        default: mod.ControlsDemoZoomOnly,
      })),
    { ssr: false },
  ),
  "controls-demo-fit-only": dynamic(
    () =>
      import("./demos/ui-custom/controls-demo").then((mod) => ({
        default: mod.ControlsDemoFitOnly,
      })),
    { ssr: false },
  ),
  "edge-demo-animated": dynamic(
    () =>
      import("./demos/ui-custom/edge-demo").then((mod) => ({
        default: mod.EdgeDemoAnimated,
      })),
    { ssr: false },
  ),
  "edge-demo-temporary": dynamic(
    () =>
      import("./demos/ui-custom/edge-demo").then((mod) => ({
        default: mod.EdgeDemoTemporary,
      })),
    { ssr: false },
  ),
  "edge-demo-mixed": dynamic(
    () =>
      import("./demos/ui-custom/edge-demo").then((mod) => ({
        default: mod.EdgeDemoMixed,
      })),
    { ssr: false },
  ),
  "file-tree-demo-project": dynamic(
    () =>
      import("./demos/ui-custom/file-tree-demo").then((mod) => ({
        default: mod.FileTreeDemoProject,
      })),
    { ssr: false },
  ),
  "file-tree-demo-with-selection": dynamic(
    () =>
      import("./demos/ui-custom/file-tree-demo").then((mod) => ({
        default: mod.FileTreeDemoWithSelection,
      })),
    { ssr: false },
  ),
  "file-tree-demo-custom-icons": dynamic(
    () =>
      import("./demos/ui-custom/file-tree-demo").then((mod) => ({
        default: mod.FileTreeDemoCustomIcons,
      })),
    { ssr: false },
  ),
  "file-tree-demo-with-actions": dynamic(
    () =>
      import("./demos/ui-custom/file-tree-demo").then((mod) => ({
        default: mod.FileTreeDemoWithActions,
      })),
    { ssr: false },
  ),
  "code-block-demo-ads-basic": dynamic(
    () =>
      import("./demos/ui-custom/code-block-demo").then((mod) => ({
        default: mod.CodeBlockDemoAdsBasic,
      })),
    { ssr: false },
  ),
  "code-block-demo-ads-small": dynamic(
    () =>
      import("./demos/ui-custom/code-block-demo").then((mod) => ({
        default: mod.CodeBlockDemoAdsSmall,
      })),
    { ssr: false },
  ),
  "code-block-demo-ads-line-numbers": dynamic(
    () =>
      import("./demos/ui-custom/code-block-demo").then((mod) => ({
        default: mod.CodeBlockDemoAdsLineNumbers,
      })),
    { ssr: false },
  ),
  "code-block-demo-ads-shell": dynamic(
    () =>
      import("./demos/ui-custom/code-block-demo").then((mod) => ({
        default: mod.CodeBlockDemoAdsShell,
      })),
    { ssr: false },
  ),
  "code-block-demo-ads-language-selector": dynamic(
    () =>
      import("./demos/ui-custom/code-block-demo").then((mod) => ({
        default: mod.CodeBlockDemoAdsLanguageSelector,
      })),
    { ssr: false },
  ),
  "chain-of-thought-demo-preload": dynamic(
    () =>
      import("./demos/ui-custom/chain-of-thought-demo").then((mod) => ({
        default: mod.ChainOfThoughtDemoPreload,
      })),
    { ssr: false },
  ),
  "chain-of-thought-demo-thinking": dynamic(
    () =>
      import("./demos/ui-custom/chain-of-thought-demo").then((mod) => ({
        default: mod.ChainOfThoughtDemoThinking,
      })),
    { ssr: false },
  ),
  "chain-of-thought-demo-completed": dynamic(
    () =>
      import("./demos/ui-custom/chain-of-thought-demo").then((mod) => ({
        default: mod.ChainOfThoughtDemoCompleted,
      })),
    { ssr: false },
  ),
  "chain-of-thought-demo-status-variants": dynamic(
    () =>
      import("./demos/ui-custom/chain-of-thought-demo").then((mod) => ({
        default: mod.ChainOfThoughtDemoStatusVariants,
      })),
    { ssr: false },
  ),
  "chain-of-thought-demo-search-results": dynamic(
    () =>
      import("./demos/ui-custom/chain-of-thought-demo").then((mod) => ({
        default: mod.ChainOfThoughtDemoSearchResults,
      })),
    { ssr: false },
  ),
  "chain-of-thought-demo-image-step": dynamic(
    () =>
      import("./demos/ui-custom/chain-of-thought-demo").then((mod) => ({
        default: mod.ChainOfThoughtDemoImageStep,
      })),
    { ssr: false },
  ),
  "chain-of-thought-demo-tool-icon-table": dynamic(
    () =>
      import("./demos/ui-custom/chain-of-thought-demo").then((mod) => ({
        default: mod.ChainOfThoughtDemoToolIconTable,
      })),
    { ssr: false },
  ),
  "canvas-demo-workflow": dynamic(
    () =>
      import("./demos/ui-custom/canvas-demo").then((mod) => ({
        default: mod.CanvasDemoWorkflow,
      })),
    { ssr: false },
  ),
  "canvas-demo-minimal": dynamic(
    () =>
      import("./demos/ui-custom/canvas-demo").then((mod) => ({
        default: mod.CanvasDemoMinimal,
      })),
    { ssr: false },
  ),
  "canvas-demo-with-controls": dynamic(
    () =>
      import("./demos/ui-custom/canvas-demo").then((mod) => ({
        default: mod.CanvasDemoWithControls,
      })),
    { ssr: false },
  ),
  "canvas-demo-with-panel": dynamic(
    () =>
      import("./demos/ui-custom/canvas-demo").then((mod) => ({
        default: mod.CanvasDemoWithPanel,
      })),
    { ssr: false },
  ),
  "canvas-demo-with-toolbar": dynamic(
    () =>
      import("./demos/ui-custom/canvas-demo").then((mod) => ({
        default: mod.CanvasDemoWithToolbar,
      })),
    { ssr: false },
  ),
  "toolbar-demo-with-nodes": dynamic(
    () =>
      import("./demos/ui-custom/toolbar-demo").then((mod) => ({
        default: mod.ToolbarDemoWithNodes,
      })),
    { ssr: false },
  ),
  "image-demo-custom-styling": dynamic(
    () =>
      import("./demos/ui-custom/image-demo").then((mod) => ({
        default: mod.ImageDemoCustomStyling,
      })),
    { ssr: false },
  ),
  "image-demo-gallery": dynamic(
    () =>
      import("./demos/ui-custom/image-demo").then((mod) => ({
        default: mod.ImageDemoGallery,
      })),
    { ssr: false },
  ),
  "image-demo-in-message": dynamic(
    () =>
      import("./demos/ui-custom/image-demo").then((mod) => ({
        default: mod.ImageDemoInMessage,
      })),
    { ssr: false },
  ),
  "jsx-preview-demo-basic": dynamic(
    () =>
      import("./demos/ui-custom/jsx-preview-demo").then((mod) => ({
        default: mod.JsxPreviewDemoBasic,
      })),
    { ssr: false },
  ),
  "jsx-preview-demo-streaming": dynamic(
    () =>
      import("./demos/ui-custom/jsx-preview-demo").then((mod) => ({
        default: mod.JsxPreviewDemoStreaming,
      })),
    { ssr: false },
  ),
  "jsx-preview-demo-with-components": dynamic(
    () =>
      import("./demos/ui-custom/jsx-preview-demo").then((mod) => ({
        default: mod.JsxPreviewDemoWithComponents,
      })),
    { ssr: false },
  ),
  "jsx-preview-demo-with-error": dynamic(
    () =>
      import("./demos/ui-custom/jsx-preview-demo").then((mod) => ({
        default: mod.JsxPreviewDemoWithError,
      })),
    { ssr: false },
  ),
  "jsx-preview-demo-custom-error": dynamic(
    () =>
      import("./demos/ui-custom/jsx-preview-demo").then((mod) => ({
        default: mod.JsxPreviewDemoCustomError,
      })),
    { ssr: false },
  ),
  "prompt-input-demo-chat-composer": dynamic(
    () =>
      import("./demos/ui-custom/prompt-input-demo").then((mod) => ({
        default: mod.PromptInputDemoChatComposer,
      })),
    { ssr: false },
  ),
  "prompt-input-demo-cursor-style": dynamic(
    () =>
      import("./demos/ui-custom/prompt-input-demo").then((mod) => ({
        default: mod.PromptInputDemoCursorStyle,
      })),
    { ssr: false },
  ),
  "prompt-input-demo-button-tooltips": dynamic(
    () =>
      import("./demos/ui-custom/prompt-input-demo").then((mod) => ({
        default: mod.PromptInputDemoButtonTooltips,
      })),
    { ssr: false },
  ),
  "prompt-input-demo-action-menu": dynamic(
    () =>
      import("./demos/ui-custom/prompt-input-demo").then((mod) => ({
        default: mod.PromptInputDemoActionMenu,
      })),
    { ssr: false },
  ),
  "prompt-input-demo-submit-status": dynamic(
    () =>
      import("./demos/ui-custom/prompt-input-demo").then((mod) => ({
        default: mod.PromptInputDemoSubmitStatus,
      })),
    { ssr: false },
  ),
  "prompt-input-demo-model-select": dynamic(
    () =>
      import("./demos/ui-custom/prompt-input-demo").then((mod) => ({
        default: mod.PromptInputDemoModelSelect,
      })),
    { ssr: false },
  ),
  "prompt-input-demo-provider-controlled": dynamic(
    () =>
      import("./demos/ui-custom/prompt-input-demo").then((mod) => ({
        default: mod.PromptInputDemoProviderControlled,
      })),
    { ssr: false },
  ),
  "prompt-input-demo-floating-bar": dynamic(
    () =>
      import("./demos/ui-custom/prompt-input-demo").then((mod) => ({
        default: mod.PromptInputDemoFloatingBar,
      })),
    { ssr: false },
  ),
  "queue-demo-prompt-queue": dynamic(
    () =>
      import("./demos/ui-custom/queue-demo").then((mod) => ({
        default: mod.QueueDemoPromptQueue,
      })),
    { ssr: false },
  ),
  "queue-demo-with-actions": dynamic(
    () =>
      import("./demos/ui-custom/queue-demo").then((mod) => ({
        default: mod.QueueDemoWithActions,
      })),
    { ssr: false },
  ),
  "queue-demo-with-attachments": dynamic(
    () =>
      import("./demos/ui-custom/queue-demo").then((mod) => ({
        default: mod.QueueDemoWithAttachments,
      })),
    { ssr: false },
  ),
  "queue-demo-minimal": dynamic(
    () =>
      import("./demos/ui-custom/queue-demo").then((mod) => ({
        default: mod.QueueDemoMinimal,
      })),
    { ssr: false },
  ),
  "reasoning-demo-preload": dynamic(
    () =>
      import("./demos/ui-custom/reasoning-demo").then((mod) => ({
        default: mod.ReasoningDemoPreload,
      })),
    { ssr: false },
  ),
  "reasoning-demo-thinking": dynamic(
    () =>
      import("./demos/ui-custom/reasoning-demo").then((mod) => ({
        default: mod.ReasoningDemoThinking,
      })),
    { ssr: false },
  ),
  "reasoning-demo-completed": dynamic(
    () =>
      import("./demos/ui-custom/reasoning-demo").then((mod) => ({
        default: mod.ReasoningDemoCompleted,
      })),
    { ssr: false },
  ),
  "sandbox-demo-running": dynamic(
    () =>
      import("./demos/ui-custom/sandbox-demo").then((mod) => ({
        default: mod.SandboxDemoRunning,
      })),
    { ssr: false },
  ),
  "sandbox-demo-error": dynamic(
    () =>
      import("./demos/ui-custom/sandbox-demo").then((mod) => ({
        default: mod.SandboxDemoError,
      })),
    { ssr: false },
  ),
  "sandbox-demo-collapsed": dynamic(
    () =>
      import("./demos/ui-custom/sandbox-demo").then((mod) => ({
        default: mod.SandboxDemoCollapsed,
      })),
    { ssr: false },
  ),
  "inline-citation-demo-with-carousel": dynamic(
    () =>
      import("./demos/ui-custom/inline-citation-demo").then((mod) => ({
        default: mod.InlineCitationDemoWithCarousel,
      })),
    { ssr: false },
  ),
  "inline-citation-demo-basic": dynamic(
    () =>
      import("./demos/ui-custom/inline-citation-demo").then((mod) => ({
        default: mod.InlineCitationDemoBasic,
      })),
    { ssr: false },
  ),
  "inline-citation-demo-multiple": dynamic(
    () =>
      import("./demos/ui-custom/inline-citation-demo").then((mod) => ({
        default: mod.InlineCitationDemoMultiple,
      })),
    { ssr: false },
  ),
  "inline-citation-demo-single-source": dynamic(
    () =>
      import("./demos/ui-custom/inline-citation-demo").then((mod) => ({
        default: mod.InlineCitationDemoSingleSource,
      })),
    { ssr: false },
  ),
  "mic-selector-demo-controlled": dynamic(
    () =>
      import("./demos/ui-custom/mic-selector-demo").then((mod) => ({
        default: mod.MicSelectorDemoControlled,
      })),
    { ssr: false },
  ),
  "mic-selector-demo-with-checkmark": dynamic(
    () =>
      import("./demos/ui-custom/mic-selector-demo").then((mod) => ({
        default: mod.MicSelectorDemoWithCheckmark,
      })),
    { ssr: false },
  ),
  "mic-selector-demo-compact": dynamic(
    () =>
      import("./demos/ui-custom/mic-selector-demo").then((mod) => ({
        default: mod.MicSelectorDemoCompact,
      })),
    { ssr: false },
  ),
  "model-selector-demo-with-search": dynamic(
    () =>
      import("./demos/ui-custom/model-selector-demo").then((mod) => ({
        default: mod.ModelSelectorDemoWithSearch,
      })),
    { ssr: false },
  ),
  "model-selector-demo-with-logos": dynamic(
    () =>
      import("./demos/ui-custom/model-selector-demo").then((mod) => ({
        default: mod.ModelSelectorDemoWithLogos,
      })),
    { ssr: false },
  ),
  "model-selector-demo-multi-provider": dynamic(
    () =>
      import("./demos/ui-custom/model-selector-demo").then((mod) => ({
        default: mod.ModelSelectorDemoMultiProvider,
      })),
    { ssr: false },
  ),
  "node-demo-full": dynamic(
    () =>
      import("./demos/ui-custom/node-demo").then((mod) => ({
        default: mod.NodeDemoFull,
      })),
    { ssr: false },
  ),
  "node-demo-header-only": dynamic(
    () =>
      import("./demos/ui-custom/node-demo").then((mod) => ({
        default: mod.NodeDemoHeaderOnly,
      })),
    { ssr: false },
  ),
  "node-demo-with-action": dynamic(
    () =>
      import("./demos/ui-custom/node-demo").then((mod) => ({
        default: mod.NodeDemoWithAction,
      })),
    { ssr: false },
  ),
  "node-demo-with-badge": dynamic(
    () =>
      import("./demos/ui-custom/node-demo").then((mod) => ({
        default: mod.NodeDemoWithBadge,
      })),
    { ssr: false },
  ),
  "open-in-chat-demo-all-providers": dynamic(
    () =>
      import("./demos/ui-custom/open-in-chat-demo").then((mod) => ({
        default: mod.OpenInChatDemoAllProviders,
      })),
    { ssr: false },
  ),
  "open-in-chat-demo-minimal": dynamic(
    () =>
      import("./demos/ui-custom/open-in-chat-demo").then((mod) => ({
        default: mod.OpenInChatDemoMinimal,
      })),
    { ssr: false },
  ),
  "open-in-chat-demo-custom-trigger": dynamic(
    () =>
      import("./demos/ui-custom/open-in-chat-demo").then((mod) => ({
        default: mod.OpenInChatDemoCustomTrigger,
      })),
    { ssr: false },
  ),
  "open-in-chat-demo-grouped": dynamic(
    () =>
      import("./demos/ui-custom/open-in-chat-demo").then((mod) => ({
        default: mod.OpenInChatDemoGrouped,
      })),
    { ssr: false },
  ),
  "package-info-demo-full": dynamic(
    () =>
      import("./demos/ui-custom/package-info-demo").then((mod) => ({
        default: mod.PackageInfoDemoFull,
      })),
    { ssr: false },
  ),
  "package-info-demo-change-types": dynamic(
    () =>
      import("./demos/ui-custom/package-info-demo").then((mod) => ({
        default: mod.PackageInfoDemoChangeTypes,
      })),
    { ssr: false },
  ),
  "package-info-demo-with-dependencies": dynamic(
    () =>
      import("./demos/ui-custom/package-info-demo").then((mod) => ({
        default: mod.PackageInfoDemoWithDependencies,
      })),
    { ssr: false },
  ),
  "package-info-demo-minimal": dynamic(
    () =>
      import("./demos/ui-custom/package-info-demo").then((mod) => ({
        default: mod.PackageInfoDemoMinimal,
      })),
    { ssr: false },
  ),
  "panel-demo-status-badge": dynamic(
    () =>
      import("./demos/ui-custom/panel-demo").then((mod) => ({
        default: mod.PanelDemoStatusBadge,
      })),
    { ssr: false },
  ),
  "panel-demo-positions": dynamic(
    () =>
      import("./demos/ui-custom/panel-demo").then((mod) => ({
        default: mod.PanelDemoPositions,
      })),
    { ssr: false },
  ),
  "persona-demo-states": dynamic(
    () =>
      import("./demos/ui-custom/persona-demo").then((mod) => ({
        default: mod.PersonaDemoStates,
      })),
    { ssr: false },
  ),
  "persona-demo-variants": dynamic(
    () =>
      import("./demos/ui-custom/persona-demo").then((mod) => ({
        default: mod.PersonaDemoVariants,
      })),
    { ssr: false },
  ),
  "persona-demo-custom-styling": dynamic(
    () =>
      import("./demos/ui-custom/persona-demo").then((mod) => ({
        default: mod.PersonaDemoCustomStyling,
      })),
    { ssr: false },
  ),
  "schema-display-demo-with-params": dynamic(
    () =>
      import("./demos/ui-custom/schema-display-demo").then((mod) => ({
        default: mod.SchemaDisplayDemoWithParams,
      })),
    { ssr: false },
  ),
  "schema-display-demo-with-body": dynamic(
    () =>
      import("./demos/ui-custom/schema-display-demo").then((mod) => ({
        default: mod.SchemaDisplayDemoWithBody,
      })),
    { ssr: false },
  ),
  "schema-display-demo-nested": dynamic(
    () =>
      import("./demos/ui-custom/schema-display-demo").then((mod) => ({
        default: mod.SchemaDisplayDemoNested,
      })),
    { ssr: false },
  ),
  "schema-display-demo-methods": dynamic(
    () =>
      import("./demos/ui-custom/schema-display-demo").then((mod) => ({
        default: mod.SchemaDisplayDemoMethods,
      })),
    { ssr: false },
  ),
  "schema-display-demo-custom-composition": dynamic(
    () =>
      import("./demos/ui-custom/schema-display-demo").then((mod) => ({
        default: mod.SchemaDisplayDemoCustomComposition,
      })),
    { ssr: false },
  ),
  "shimmer-demo-custom-duration": dynamic(
    () =>
      import("./demos/ui-custom/shimmer-demo").then((mod) => ({
        default: mod.ShimmerDemoCustomDuration,
      })),
    { ssr: false },
  ),
  "shimmer-demo-custom-spread": dynamic(
    () =>
      import("./demos/ui-custom/shimmer-demo").then((mod) => ({
        default: mod.ShimmerDemoCustomSpread,
      })),
    { ssr: false },
  ),
  "shimmer-demo-wave": dynamic(
    () =>
      import("./demos/ui-custom/shimmer-demo").then((mod) => ({
        default: mod.ShimmerDemoWave,
      })),
    { ssr: false },
  ),
  "shimmer-demo-wave-colors": dynamic(
    () =>
      import("./demos/ui-custom/shimmer-demo").then((mod) => ({
        default: mod.ShimmerDemoWaveColors,
      })),
    { ssr: false },
  ),
  "shimmer-demo-wave-geometry": dynamic(
    () =>
      import("./demos/ui-custom/shimmer-demo").then((mod) => ({
        default: mod.ShimmerDemoWaveGeometry,
      })),
    { ssr: false },
  ),
  "shimmer-demo-wave-depth": dynamic(
    () =>
      import("./demos/ui-custom/shimmer-demo").then((mod) => ({
        default: mod.ShimmerDemoWaveDepth,
      })),
    { ssr: false },
  ),
  "shimmer-demo-wave-timing-spread": dynamic(
    () =>
      import("./demos/ui-custom/shimmer-demo").then((mod) => ({
        default: mod.ShimmerDemoWaveTimingSpread,
      })),
    { ssr: false },
  ),
  "shimmer-demo-wave-full-config": dynamic(
    () =>
      import("./demos/ui-custom/shimmer-demo").then((mod) => ({
        default: mod.ShimmerDemoWaveFullConfig,
      })),
    { ssr: false },
  ),
  "shimmer-demo-heading": dynamic(
    () =>
      import("./demos/ui-custom/shimmer-demo").then((mod) => ({
        default: mod.ShimmerDemoHeading,
      })),
    { ssr: false },
  ),
  "snippet-demo-plain": dynamic(
    () =>
      import("./demos/ui-custom/snippet-demo").then((mod) => ({
        default: mod.SnippetDemoPlain,
      })),
    { ssr: false },
  ),
  "snippet-demo-multiple": dynamic(
    () =>
      import("./demos/ui-custom/snippet-demo").then((mod) => ({
        default: mod.SnippetDemoMultiple,
      })),
    { ssr: false },
  ),
  "snippet-demo-callbacks": dynamic(
    () =>
      import("./demos/ui-custom/snippet-demo").then((mod) => ({
        default: mod.SnippetDemoCallbacks,
      })),
    { ssr: false },
  ),
  "sources-demo-custom-rendering": dynamic(
    () =>
      import("./demos/ui-custom/sources-demo").then((mod) => ({
        default: mod.SourcesDemoCustomRendering,
      })),
    { ssr: false },
  ),
  "speech-input-demo-with-transcript": dynamic(
    () =>
      import("./demos/ui-custom/speech-input-demo").then((mod) => ({
        default: mod.SpeechInputDemoWithTranscript,
      })),
    { ssr: false },
  ),
  "speech-input-demo-sizes": dynamic(
    () =>
      import("./demos/ui-custom/speech-input-demo").then((mod) => ({
        default: mod.SpeechInputDemoSizes,
      })),
    { ssr: false },
  ),
  "speech-input-demo-disabled": dynamic(
    () =>
      import("./demos/ui-custom/speech-input-demo").then((mod) => ({
        default: mod.SpeechInputDemoDisabled,
      })),
    { ssr: false },
  ),
  "terminal-demo-streaming": dynamic(
    () =>
      import("./demos/ui-custom/terminal-demo").then((mod) => ({
        default: mod.TerminalDemoStreaming,
      })),
    { ssr: false },
  ),
  "terminal-demo-clearable": dynamic(
    () =>
      import("./demos/ui-custom/terminal-demo").then((mod) => ({
        default: mod.TerminalDemoClearable,
      })),
    { ssr: false },
  ),
  "terminal-demo-composed": dynamic(
    () =>
      import("./demos/ui-custom/terminal-demo").then((mod) => ({
        default: mod.TerminalDemoComposed,
      })),
    { ssr: false },
  ),
  "terminal-demo-ansi": dynamic(
    () =>
      import("./demos/ui-custom/terminal-demo").then((mod) => ({
        default: mod.TerminalDemoAnsi,
      })),
    { ssr: false },
  ),
  "test-results-demo-with-progress": dynamic(
    () =>
      import("./demos/ui-custom/test-results-demo").then((mod) => ({
        default: mod.TestResultsDemoWithProgress,
      })),
    { ssr: false },
  ),
  "test-results-demo-with-errors": dynamic(
    () =>
      import("./demos/ui-custom/test-results-demo").then((mod) => ({
        default: mod.TestResultsDemoWithErrors,
      })),
    { ssr: false },
  ),
  "test-results-demo-running": dynamic(
    () =>
      import("./demos/ui-custom/test-results-demo").then((mod) => ({
        default: mod.TestResultsDemoRunning,
      })),
    { ssr: false },
  ),
  "stack-trace-demo-open": dynamic(
    () =>
      import("./demos/ui-custom/stack-trace-demo").then((mod) => ({
        default: mod.StackTraceDemoOpen,
      })),
    { ssr: false },
  ),
  "stack-trace-demo-filter-internals": dynamic(
    () =>
      import("./demos/ui-custom/stack-trace-demo").then((mod) => ({
        default: mod.StackTraceDemoFilterInternals,
      })),
    { ssr: false },
  ),
  "stack-trace-demo-clickable": dynamic(
    () =>
      import("./demos/ui-custom/stack-trace-demo").then((mod) => ({
        default: mod.StackTraceDemoClickable,
      })),
    { ssr: false },
  ),
  "suggestion-demo-vertical": dynamic(
    () =>
      import("./demos/ui-custom/suggestion-demo").then((mod) => ({
        default: mod.SuggestionDemoVertical,
      })),
    { ssr: false },
  ),
  "suggestion-demo-with-icons": dynamic(
    () =>
      import("./demos/ui-custom/suggestion-demo").then((mod) => ({
        default: mod.SuggestionDemoWithIcons,
      })),
    { ssr: false },
  ),
  "tool-demo-running": dynamic(
    () =>
      import("./demos/ui-custom/tool-demo").then((mod) => ({
        default: mod.ToolDemoRunning,
      })),
    { ssr: false },
  ),
  "tool-demo-error": dynamic(
    () =>
      import("./demos/ui-custom/tool-demo").then((mod) => ({
        default: mod.ToolDemoError,
      })),
    { ssr: false },
  ),
  "tool-demo-collapsed": dynamic(
    () =>
      import("./demos/ui-custom/tool-demo").then((mod) => ({
        default: mod.ToolDemoCollapsed,
      })),
    { ssr: false },
  ),
  "tool-demo-pending": dynamic(
    () =>
      import("./demos/ui-custom/tool-demo").then((mod) => ({
        default: mod.ToolDemoPending,
      })),
    { ssr: false },
  ),
  "tool-demo-approval": dynamic(
    () =>
      import("./demos/ui-custom/tool-demo").then((mod) => ({
        default: mod.ToolDemoApproval,
      })),
    { ssr: false },
  ),
  "twg-tool-demo-single-source": dynamic(
    () =>
      import("./demos/ui-custom/twg-tool-demo").then((mod) => ({
        default: mod.TwgToolDemoSingleSource,
      })),
    { ssr: false },
  ),
  "twg-tool-demo-multiple-sources": dynamic(
    () =>
      import("./demos/ui-custom/twg-tool-demo").then((mod) => ({
        default: mod.TwgToolDemoMultipleSources,
      })),
    { ssr: false },
  ),
  "twg-tool-demo-completed": dynamic(
    () =>
      import("./demos/ui-custom/twg-tool-demo").then((mod) => ({
        default: mod.TwgToolDemoCompleted,
      })),
    { ssr: false },
  ),
  "transcription-demo-static": dynamic(
    () =>
      import("./demos/ui-custom/transcription-demo").then((mod) => ({
        default: mod.TranscriptionDemoStatic,
      })),
    { ssr: false },
  ),
  "transcription-demo-with-seek": dynamic(
    () =>
      import("./demos/ui-custom/transcription-demo").then((mod) => ({
        default: mod.TranscriptionDemoWithSeek,
      })),
    { ssr: false },
  ),
  "voice-selector-demo-with-attributes": dynamic(
    () =>
      import("./demos/ui-custom/voice-selector-demo").then((mod) => ({
        default: mod.VoiceSelectorDemoWithAttributes,
      })),
    { ssr: false },
  ),
  "voice-selector-demo-multi-provider": dynamic(
    () =>
      import("./demos/ui-custom/voice-selector-demo").then((mod) => ({
        default: mod.VoiceSelectorDemoMultiProvider,
      })),
    { ssr: false },
  ),
  "voice-selector-demo-with-preview": dynamic(
    () =>
      import("./demos/ui-custom/voice-selector-demo").then((mod) => ({
        default: mod.VoiceSelectorDemoWithPreview,
      })),
    { ssr: false },
  ),
  "web-preview-demo-basic": dynamic(
    () =>
      import("./demos/ui-custom/web-preview-demo").then((mod) => ({
        default: mod.WebPreviewDemoBasic,
      })),
    { ssr: false },
  ),
  "web-preview-demo-with-console": dynamic(
    () =>
      import("./demos/ui-custom/web-preview-demo").then((mod) => ({
        default: mod.WebPreviewDemoWithConsole,
      })),
    { ssr: false },
  ),
  "web-preview-demo-fullscreen": dynamic(
    () =>
      import("./demos/ui-custom/web-preview-demo").then((mod) => ({
        default: mod.WebPreviewDemoFullscreen,
      })),
    { ssr: false },
  ),
  "web-preview-demo-url-change": dynamic(
    () =>
      import("./demos/ui-custom/web-preview-demo").then((mod) => ({
        default: mod.WebPreviewDemoUrlChange,
      })),
    { ssr: false },
  ),
  "web-preview-demo-proxy": dynamic(
    () =>
      import("./demos/ui-custom/web-preview-demo").then((mod) => ({
        default: mod.WebPreviewDemoProxy,
      })),
    { ssr: false },
  ),
};

const BLOCK_DEMOS: Record<string, ComponentType> = {
  "agent-progress": dynamic(
    () => import("./demos/blocks/agent-progress-demo"),
    { ssr: false },
  ),
  "agent-selector": dynamic(
    () => import("./demos/blocks/agent-selector-demo"),
    { ssr: false },
  ),
  "task-progress": dynamic(
    () => import("./demos/blocks/task-progress-demo"),
    { ssr: false },
  ),
  "answer-card": dynamic(() => import("./demos/blocks/answer-card-demo"), {
    ssr: false,
  }),
  "chat-timeline": dynamic(() => import("./demos/blocks/chat-timeline-demo"), {
    ssr: false,
  }),
  "app-sidebar": dynamic(() => import("./demos/blocks/app-sidebar-demo"), {
    ssr: false,
  }),
  "mermaid-diagram": dynamic(() => import("./demos/blocks/mermaid-diagram-demo"), {
    ssr: false,
  }),
  dashboard: dynamic(() => import("./demos/blocks/dashboard-demo"), {
    ssr: false,
  }),
  "sidebar-01": dynamic(() => import("./demos/blocks/sidebar-01-demo"), {
    ssr: false,
  }),
  "sidebar-02": dynamic(() => import("./demos/blocks/sidebar-02-demo"), {
    ssr: false,
  }),
  "sidebar-03": dynamic(() => import("./demos/blocks/sidebar-03-demo"), {
    ssr: false,
  }),
  "sidebar-04": dynamic(() => import("./demos/blocks/sidebar-04-demo"), {
    ssr: false,
  }),
  "sidebar-05": dynamic(() => import("./demos/blocks/sidebar-05-demo"), {
    ssr: false,
  }),
  "sidebar-06": dynamic(() => import("./demos/blocks/sidebar-06-demo"), {
    ssr: false,
  }),
  "sidebar-07": dynamic(() => import("./demos/blocks/sidebar-07-demo"), {
    ssr: false,
  }),
  "sidebar-08": dynamic(() => import("./demos/blocks/sidebar-08-demo"), {
    ssr: false,
  }),
  "sidebar-09": dynamic(() => import("./demos/blocks/sidebar-09-demo"), {
    ssr: false,
  }),
  "sidebar-10": dynamic(() => import("./demos/blocks/sidebar-10-demo"), {
    ssr: false,
  }),
  "sidebar-11": dynamic(() => import("./demos/blocks/sidebar-11-demo"), {
    ssr: false,
  }),
  "sidebar-12": dynamic(() => import("./demos/blocks/sidebar-12-demo"), {
    ssr: false,
  }),
  "sidebar-13": dynamic(() => import("./demos/blocks/sidebar-13-demo"), {
    ssr: false,
  }),
  "sidebar-14": dynamic(() => import("./demos/blocks/sidebar-14-demo"), {
    ssr: false,
  }),
  "sidebar-15": dynamic(() => import("./demos/blocks/sidebar-15-demo"), {
    ssr: false,
  }),
  "sidebar-16": dynamic(() => import("./demos/blocks/sidebar-16-demo"), {
    ssr: false,
  }),
  "login-01": dynamic(() => import("./demos/blocks/login-01-demo"), {
    ssr: false,
  }),
  "login-02": dynamic(() => import("./demos/blocks/login-02-demo"), {
    ssr: false,
  }),
  "login-03": dynamic(() => import("./demos/blocks/login-03-demo"), {
    ssr: false,
  }),
  "login-04": dynamic(() => import("./demos/blocks/login-04-demo"), {
    ssr: false,
  }),
  "login-05": dynamic(() => import("./demos/blocks/login-05-demo"), {
    ssr: false,
  }),
  chatgpt: dynamic(() => import("./demos/blocks/chatgpt-demo"), { ssr: false }),
  "chat-gallery": dynamic(
    () => import("./demos/blocks/chat-gallery-demo"),
    { ssr: false },
  ),
  "data-table": dynamic(() => import("./demos/blocks/data-table-demo"), {
    ssr: false,
  }),
  "top-navigation": dynamic(
    () => import("./demos/blocks/top-navigation-demo"),
    { ssr: false },
  ),
  "prompt-gallery": dynamic(
    () => import("./demos/blocks/prompt-gallery-demo"),
    { ssr: false },
  ),
  "rovo-canvas": dynamic(
    () => import("./demos/blocks/rovo-canvas-direct-demo"),
    { ssr: false },
  ),
  "chat-configuration": dynamic(() => import("./demos/blocks/shared-ui-demo"), {
    ssr: false,
  }),
  "settings-dialog": dynamic(
    () => import("./demos/blocks/settings-dialog-demo"),
    { ssr: false },
  ),
  "product-sidebar": dynamic(
    () => import("./demos/blocks/product-sidebar-demo"),
    { ssr: false },
  ),
  "sidebar-rail": dynamic(() => import("./demos/blocks/sidebar-rail-demo"), {
    ssr: false,
  }),
  "signup-01": dynamic(() => import("./demos/blocks/signup-01-demo"), {
    ssr: false,
  }),
  "signup-02": dynamic(() => import("./demos/blocks/signup-02-demo"), {
    ssr: false,
  }),
  "signup-03": dynamic(() => import("./demos/blocks/signup-03-demo"), {
    ssr: false,
  }),
  "signup-04": dynamic(() => import("./demos/blocks/signup-04-demo"), {
    ssr: false,
  }),
  "signup-05": dynamic(() => import("./demos/blocks/signup-05-demo"), {
    ssr: false,
  }),
  "work-item-widget": dynamic(
    () => import("./demos/blocks/work-item-widget-demo"),
    { ssr: false },
  ),
  "question-card": dynamic(() => import("./demos/blocks/question-card-demo"), {
    ssr: false,
  }),
  "approval-card": dynamic(() => import("./demos/blocks/approval-card-demo"), {
    ssr: false,
  }),
  "tool-approval": dynamic(() => import("./demos/blocks/tool-approval-demo"), {
    ssr: false,
  }),
  "terminal-switch": dynamic(
    () => import("./demos/blocks/terminal-switch-demo"),
    { ssr: false },
  ),
  chatbot: dynamic(() => import("./demos/blocks/chatbot-demo"), { ssr: false }),
  cursor: dynamic(() => import("./demos/blocks/cursor-demo"), { ssr: false }),
  "generative-card": dynamic(
    () => import("./demos/blocks/generative-card-demo"),
    { ssr: false },
  ),
  generative: dynamic(() => import("./demos/blocks/generative-demo"), {
    ssr: false,
  }),
  "kanban-board": dynamic(() => import("./demos/blocks/kanban-board-demo"), {
    ssr: false,
  }),
  "visual-waveform": dynamic(
    () => import("./demos/blocks/visual-waveform-demo"),
    { ssr: false },
  ),
  workflow: dynamic(() => import("./demos/blocks/workflow-demo"), {
    ssr: false,
  }),
  "frame-demo": dynamic(() => import("./demos/blocks/frame-demo"), {
    ssr: false,
  }),
};

const BLOCK_VARIANT_DEMOS: Record<string, ComponentType> = {
  // Agent Selector
  "agent-selector-demo-selected-agent-actions": dynamic(
    () =>
      import("./demos/blocks/agent-selector-demo").then((mod) => ({
        default: mod.AgentSelectorDemoSelectedAgentActions,
      })),
    { ssr: false },
  ),

  // Agent Progress
  "agent-progress-demo-running": dynamic(
    () =>
      import("./demos/blocks/agent-progress-demo").then((mod) => ({
        default: mod.AgentProgressDemoRunning,
      })),
    { ssr: false },
  ),
  "agent-progress-demo-completed": dynamic(
    () =>
      import("./demos/blocks/agent-progress-demo").then((mod) => ({
        default: mod.AgentProgressDemoCompleted,
      })),
    { ssr: false },
  ),
  "agent-progress-demo-failed": dynamic(
    () =>
      import("./demos/blocks/agent-progress-demo").then((mod) => ({
        default: mod.AgentProgressDemoFailed,
      })),
    { ssr: false },
  ),
  "agent-progress-demo-collapsed": dynamic(
    () =>
      import("./demos/blocks/agent-progress-demo").then((mod) => ({
        default: mod.AgentProgressDemoCollapsed,
      })),
    { ssr: false },
  ),
  "agent-progress-demo-collapsed-running": dynamic(
    () =>
      import("./demos/blocks/agent-progress-demo").then((mod) => ({
        default: mod.AgentProgressDemoCollapsedRunning,
      })),
    { ssr: false },
  ),
  "agent-progress-demo-with-agents": dynamic(
    () =>
      import("./demos/blocks/agent-progress-demo").then((mod) => ({
        default: mod.AgentProgressDemoWithAgents,
      })),
    { ssr: false },
  ),
  "agent-progress-demo-early-progress": dynamic(
    () =>
      import("./demos/blocks/agent-progress-demo").then((mod) => ({
        default: mod.AgentProgressDemoEarlyProgress,
      })),
    { ssr: false },
  ),
  "agent-progress-demo-multiple-runs": dynamic(
    () =>
      import("./demos/blocks/agent-progress-demo").then((mod) => ({
        default: mod.AgentProgressDemoMultipleRuns,
      })),
    { ssr: false },
  ),
  "agent-progress-demo-all-states": dynamic(
    () =>
      import("./demos/blocks/agent-progress-demo").then((mod) => ({
        default: mod.AgentProgressDemoAllStates,
      })),
    { ssr: false },
  ),

  // Task Progress
  "task-progress-demo-running": dynamic(
    () =>
      import("./demos/blocks/task-progress-demo").then((mod) => ({
        default: mod.TaskProgressDemoRunning,
      })),
    { ssr: false },
  ),
  "task-progress-demo-completed": dynamic(
    () =>
      import("./demos/blocks/task-progress-demo").then((mod) => ({
        default: mod.TaskProgressDemoCompleted,
      })),
    { ssr: false },
  ),
  "task-progress-demo-failed": dynamic(
    () =>
      import("./demos/blocks/task-progress-demo").then((mod) => ({
        default: mod.TaskProgressDemoFailed,
      })),
    { ssr: false },
  ),
  "task-progress-demo-collapsed": dynamic(
    () =>
      import("./demos/blocks/task-progress-demo").then((mod) => ({
        default: mod.TaskProgressDemoCollapsed,
      })),
    { ssr: false },
  ),
  "task-progress-demo-collapsed-running": dynamic(
    () =>
      import("./demos/blocks/task-progress-demo").then((mod) => ({
        default: mod.TaskProgressDemoCollapsedRunning,
      })),
    { ssr: false },
  ),
  "task-progress-demo-with-agents": dynamic(
    () =>
      import("./demos/blocks/task-progress-demo").then((mod) => ({
        default: mod.TaskProgressDemoWithAgents,
      })),
    { ssr: false },
  ),
  "task-progress-demo-early-progress": dynamic(
    () =>
      import("./demos/blocks/task-progress-demo").then((mod) => ({
        default: mod.TaskProgressDemoEarlyProgress,
      })),
    { ssr: false },
  ),
  "task-progress-demo-multiple-runs": dynamic(
    () =>
      import("./demos/blocks/task-progress-demo").then((mod) => ({
        default: mod.TaskProgressDemoMultipleRuns,
      })),
    { ssr: false },
  ),
  "task-progress-demo-all-states": dynamic(
    () =>
      import("./demos/blocks/task-progress-demo").then((mod) => ({
        default: mod.TaskProgressDemoAllStates,
      })),
    { ssr: false },
  ),

  // Question Card
  "question-card-demo-single-select": dynamic(
    () =>
      import("./demos/blocks/question-card-demo").then((mod) => ({
        default: mod.QuestionCardDemoSingleSelect,
      })),
    { ssr: false },
  ),
  "question-card-demo-multi-select": dynamic(
    () =>
      import("./demos/blocks/question-card-demo").then((mod) => ({
        default: mod.QuestionCardDemoMultiSelect,
      })),
    { ssr: false },
  ),
  "question-card-demo-text-only": dynamic(
    () =>
      import("./demos/blocks/question-card-demo").then((mod) => ({
        default: mod.QuestionCardDemoTextOnly,
      })),
    { ssr: false },
  ),
  "question-card-demo-mixed": dynamic(
    () =>
      import("./demos/blocks/question-card-demo").then((mod) => ({
        default: mod.QuestionCardDemoMixed,
      })),
    { ssr: false },
  ),
  "question-card-demo-no-custom-input": dynamic(
    () =>
      import("./demos/blocks/question-card-demo").then((mod) => ({
        default: mod.QuestionCardDemoNoCustomInput,
      })),
    { ssr: false },
  ),
  "question-card-demo-custom-placeholder": dynamic(
    () =>
      import("./demos/blocks/question-card-demo").then((mod) => ({
        default: mod.QuestionCardDemoCustomPlaceholder,
      })),
    { ssr: false },
  ),
  "question-card-demo-pre-populated": dynamic(
    () =>
      import("./demos/blocks/question-card-demo").then((mod) => ({
        default: mod.QuestionCardDemoPrePopulated,
      })),
    { ssr: false },
  ),
  "tool-approval-demo-batch": dynamic(
    () =>
      import("./demos/blocks/tool-approval-demo").then((mod) => ({
        default: mod.ToolApprovalDemoBatch,
      })),
    { ssr: false },
  ),
  "tool-approval-demo-submitting": dynamic(
    () =>
      import("./demos/blocks/tool-approval-demo").then((mod) => ({
        default: mod.ToolApprovalDemoSubmitting,
      })),
    { ssr: false },
  ),
  "generative-card-demo-3p": dynamic(
    () =>
      import("./demos/blocks/generative-card-demo").then((mod) => ({
        default: mod.GenerativeCardDemo3p,
      })),
    { ssr: false },
  ),
  "generative-card-demo-1p": dynamic(
    () =>
      import("./demos/blocks/generative-card-demo").then((mod) => ({
        default: mod.GenerativeCardDemo1p,
      })),
    { ssr: false },
  ),
  "generative-card-demo-icon": dynamic(
    () =>
      import("./demos/blocks/generative-card-demo").then((mod) => ({
        default: mod.GenerativeCardDemoIcon,
      })),
    { ssr: false },
  ),
  "generative-card-demo-artifact": dynamic(
    () =>
      import("./demos/blocks/generative-card-demo").then((mod) => ({
        default: mod.GenerativeCardDemoArtifact,
      })),
    { ssr: false },
  ),
  "generative-card-demo-artifact-collapsed": dynamic(
    () =>
      import("./demos/blocks/generative-card-demo").then((mod) => ({
        default: mod.GenerativeCardDemoArtifactCollapsed,
      })),
    { ssr: false },
  ),
  "generative-card-demo-animated": dynamic(
    () =>
      import("./demos/blocks/generative-card-demo").then((mod) => ({
        default: mod.GenerativeCardDemoAnimatedExample,
      })),
    { ssr: false },
  ),
  "generative-card-demo-action": dynamic(
    () =>
      import("./demos/blocks/generative-card-demo").then((mod) => ({
        default: mod.GenerativeCardDemoAction,
      })),
    { ssr: false },
  ),
  "generative-card-demo-trace": dynamic(
    () =>
      import("./demos/blocks/generative-card-demo").then((mod) => ({
        default: mod.GenerativeCardDemoTrace,
      })),
    { ssr: false },
  ),
  "generative-card-demo-inner-glow": dynamic(
    () =>
      import("./demos/blocks/generative-card-demo").then((mod) => ({
        default: mod.GenerativeCardDemoInnerGlow,
      })),
    { ssr: false },
  ),
};

const PROJECT_DEMOS: Record<string, ComponentType> = {
  agents: dynamic(() => import("./demos/projects/agents-demo"), { ssr: false }),
  admin: dynamic(() => import("./demos/projects/admin-demo"), { ssr: false }),
  confluence: dynamic(() => import("./demos/projects/confluence-demo"), {
    ssr: false,
  }),
  jira: dynamic(() => import("./demos/projects/jira-demo"), { ssr: false }),
  rovo: dynamic(() => import("./demos/projects/rovo-demo"), {
    ssr: false,
  }),
  "rovo-button": dynamic(() => import("./demos/projects/rovo-button-demo"), {
    ssr: false,
  }),
  search: dynamic(() => import("./demos/projects/search-demo"), { ssr: false }),
  "sidebar-chat": dynamic(() => import("./demos/projects/sidebar-chat-demo"), {
    ssr: false,
  }),
};

const ARTS_DEMOS: Record<string, ComponentType> = {
  awake: dynamic(
    () => import("./demos/arts/awake-demo"),
    { ssr: false },
  ),
  "personal-graph": dynamic(
    () => import("./demos/arts/personal-graph-demo"),
    { ssr: false },
  ),
};

const CHART_DEMOS: Record<string, ComponentType> = {
  // Area
  "chart-area": dynamic(
    () =>
      import("@/components/charts/area/chart-area").then((mod) => ({
        default: mod.ChartAreaDefault,
      })),
    { ssr: false },
  ),
  "chart-area-interactive": dynamic(
    () =>
      import("@/components/charts/area/chart-area-interactive").then((mod) => ({
        default: mod.ChartAreaInteractive,
      })),
    { ssr: false },
  ),
  "chart-area-axes": dynamic(
    () =>
      import("@/components/charts/area/chart-area-axes").then((mod) => ({
        default: mod.ChartAreaAxes,
      })),
    { ssr: false },
  ),
  "chart-area-gradient": dynamic(
    () =>
      import("@/components/charts/area/chart-area-gradient").then((mod) => ({
        default: mod.ChartAreaGradient,
      })),
    { ssr: false },
  ),
  "chart-area-icons": dynamic(
    () =>
      import("@/components/charts/area/chart-area-icons").then((mod) => ({
        default: mod.ChartAreaIcons,
      })),
    { ssr: false },
  ),
  "chart-area-legend": dynamic(
    () =>
      import("@/components/charts/area/chart-area-legend").then((mod) => ({
        default: mod.ChartAreaLegend,
      })),
    { ssr: false },
  ),
  "chart-area-linear": dynamic(
    () =>
      import("@/components/charts/area/chart-area-linear").then((mod) => ({
        default: mod.ChartAreaLinear,
      })),
    { ssr: false },
  ),
  "chart-area-stacked": dynamic(
    () =>
      import("@/components/charts/area/chart-area-stacked").then((mod) => ({
        default: mod.ChartAreaStacked,
      })),
    { ssr: false },
  ),
  "chart-area-stacked-expanded": dynamic(
    () =>
      import("@/components/charts/area/chart-area-stacked-expanded").then(
        (mod) => ({ default: mod.ChartAreaStackedExpand }),
      ),
    { ssr: false },
  ),
  "chart-area-step": dynamic(
    () =>
      import("@/components/charts/area/chart-area-step").then((mod) => ({
        default: mod.ChartAreaStep,
      })),
    { ssr: false },
  ),
  // Bar
  "chart-bar": dynamic(
    () =>
      import("@/components/charts/bar/chart-bar").then((mod) => ({
        default: mod.ChartBarDefault,
      })),
    { ssr: false },
  ),
  "chart-bar-interactive": dynamic(
    () =>
      import("@/components/charts/bar/chart-bar-interactive").then((mod) => ({
        default: mod.ChartBarInteractive,
      })),
    { ssr: false },
  ),
  "chart-bar-active": dynamic(
    () =>
      import("@/components/charts/bar/chart-bar-active").then((mod) => ({
        default: mod.ChartBarActive,
      })),
    { ssr: false },
  ),
  "chart-bar-chart-stacked-legend": dynamic(
    () =>
      import("@/components/charts/bar/chart-bar-chart-stacked-legend").then(
        (mod) => ({ default: mod.ChartBarStacked }),
      ),
    { ssr: false },
  ),
  "chart-bar-custom-label": dynamic(
    () =>
      import("@/components/charts/bar/chart-bar-custom-label").then((mod) => ({
        default: mod.ChartBarLabelCustom,
      })),
    { ssr: false },
  ),
  "chart-bar-horizontal": dynamic(
    () =>
      import("@/components/charts/bar/chart-bar-horizontal").then((mod) => ({
        default: mod.ChartBarHorizontal,
      })),
    { ssr: false },
  ),
  "chart-bar-label": dynamic(
    () =>
      import("@/components/charts/bar/chart-bar-label").then((mod) => ({
        default: mod.ChartBarLabel,
      })),
    { ssr: false },
  ),
  "chart-bar-mixed": dynamic(
    () =>
      import("@/components/charts/bar/chart-bar-mixed").then((mod) => ({
        default: mod.ChartBarMixed,
      })),
    { ssr: false },
  ),
  "chart-bar-multiple": dynamic(
    () =>
      import("@/components/charts/bar/chart-bar-multiple").then((mod) => ({
        default: mod.ChartBarMultiple,
      })),
    { ssr: false },
  ),
  "chart-bar-negative": dynamic(
    () =>
      import("@/components/charts/bar/chart-bar-negative").then((mod) => ({
        default: mod.ChartBarNegative,
      })),
    { ssr: false },
  ),
  // Line
  "chart-line": dynamic(
    () =>
      import("@/components/charts/line/chart-line").then((mod) => ({
        default: mod.ChartLineDefault,
      })),
    { ssr: false },
  ),
  "chart-line-interactive": dynamic(
    () =>
      import("@/components/charts/line/chart-line-interactive").then((mod) => ({
        default: mod.ChartLineInteractive,
      })),
    { ssr: false },
  ),
  "chart-line-custom-dots": dynamic(
    () =>
      import("@/components/charts/line/chart-line-custom-dots").then((mod) => ({
        default: mod.ChartLineDotsCustom,
      })),
    { ssr: false },
  ),
  "chart-line-custom-label": dynamic(
    () =>
      import("@/components/charts/line/chart-line-custom-label").then(
        (mod) => ({ default: mod.ChartLineLabelCustom }),
      ),
    { ssr: false },
  ),
  "chart-line-dots": dynamic(
    () =>
      import("@/components/charts/line/chart-line-dots").then((mod) => ({
        default: mod.ChartLineDots,
      })),
    { ssr: false },
  ),
  "chart-line-dots-colors": dynamic(
    () =>
      import("@/components/charts/line/chart-line-dots-colors").then((mod) => ({
        default: mod.ChartLineDotsColors,
      })),
    { ssr: false },
  ),
  "chart-line-label": dynamic(
    () =>
      import("@/components/charts/line/chart-line-label").then((mod) => ({
        default: mod.ChartLineLabel,
      })),
    { ssr: false },
  ),
  "chart-line-linear": dynamic(
    () =>
      import("@/components/charts/line/chart-line.linear").then((mod) => ({
        default: mod.ChartLineLinear,
      })),
    { ssr: false },
  ),
  "chart-line-multiple": dynamic(
    () =>
      import("@/components/charts/line/chart-line-multiple").then((mod) => ({
        default: mod.ChartLineMultiple,
      })),
    { ssr: false },
  ),
  "chart-line-step": dynamic(
    () =>
      import("@/components/charts/line/chart-line-step").then((mod) => ({
        default: mod.ChartLineStep,
      })),
    { ssr: false },
  ),
  // Pie
  "chart-pie": dynamic(
    () =>
      import("@/components/charts/pie/chart-pie").then((mod) => ({
        default: mod.ChartPieSimple,
      })),
    { ssr: false },
  ),
  "chart-pie-custom-label": dynamic(
    () =>
      import("@/components/charts/pie/chart-pie-custom-label").then((mod) => ({
        default: mod.ChartPieLabelCustom,
      })),
    { ssr: false },
  ),
  "chart-pie-donut": dynamic(
    () =>
      import("@/components/charts/pie/chart-pie-donut").then((mod) => ({
        default: mod.ChartPieDonut,
      })),
    { ssr: false },
  ),
  "chart-pie-donut-active": dynamic(
    () =>
      import("@/components/charts/pie/chart-pie-donut-active").then((mod) => ({
        default: mod.ChartPieDonutActive,
      })),
    { ssr: false },
  ),
  "chart-pie-donut-with-text": dynamic(
    () =>
      import("@/components/charts/pie/chart-pie-donut-with-text").then(
        (mod) => ({ default: mod.ChartPieDonutText }),
      ),
    { ssr: false },
  ),
  "chart-pie-interactive": dynamic(
    () =>
      import("@/components/charts/pie/chart-pie-interactive").then((mod) => ({
        default: mod.ChartPieInteractive,
      })),
    { ssr: false },
  ),
  "chart-pie-label": dynamic(
    () =>
      import("@/components/charts/pie/chart-pie-label").then((mod) => ({
        default: mod.ChartPieLabel,
      })),
    { ssr: false },
  ),
  "chart-pie-label-list": dynamic(
    () =>
      import("@/components/charts/pie/chart-pie-label-list").then((mod) => ({
        default: mod.ChartPieLabelList,
      })),
    { ssr: false },
  ),
  "chart-pie-legend": dynamic(
    () =>
      import("@/components/charts/pie/chart-pie-legend").then((mod) => ({
        default: mod.ChartPieLegend,
      })),
    { ssr: false },
  ),
  "chart-pie-separator-none": dynamic(
    () =>
      import("@/components/charts/pie/chart-pie-separator-none").then(
        (mod) => ({ default: mod.ChartPieSeparatorNone }),
      ),
    { ssr: false },
  ),
  "chart-pie-stacked": dynamic(
    () =>
      import("@/components/charts/pie/chart-pie-stacked").then((mod) => ({
        default: mod.ChartPieStacked,
      })),
    { ssr: false },
  ),
  // Radar
  "chart-radar": dynamic(
    () =>
      import("@/components/charts/radar/chart-radar").then((mod) => ({
        default: mod.ChartRadarDefault,
      })),
    { ssr: false },
  ),
  "chart-radar-custom-label": dynamic(
    () =>
      import("@/components/charts/radar/chart-radar-custom-label").then(
        (mod) => ({ default: mod.ChartRadarLabelCustom }),
      ),
    { ssr: false },
  ),
  "chart-radar-dots": dynamic(
    () =>
      import("@/components/charts/radar/chart-radar-dots").then((mod) => ({
        default: mod.ChartRadarDots,
      })),
    { ssr: false },
  ),
  "chart-radar-grid-circle": dynamic(
    () =>
      import("@/components/charts/radar/chart-radar-grid-circle").then(
        (mod) => ({ default: mod.ChartRadarGridCircle }),
      ),
    { ssr: false },
  ),
  "chart-radar-grid-circle-filled": dynamic(
    () =>
      import("@/components/charts/radar/chart-radar-grid-circle-filled").then(
        (mod) => ({ default: mod.ChartRadarGridCircleFill }),
      ),
    { ssr: false },
  ),
  "chart-radar-grid-circle-no-lines": dynamic(
    () =>
      import("@/components/charts/radar/chart-radar-grid-circle-no-lines").then(
        (mod) => ({ default: mod.ChartRadarGridCircleNoLines }),
      ),
    { ssr: false },
  ),
  "chart-radar-grid-custom": dynamic(
    () =>
      import("@/components/charts/radar/chart-radar-grid-custom").then(
        (mod) => ({ default: mod.ChartRadarGridCustom }),
      ),
    { ssr: false },
  ),
  "chart-radar-grid-filled": dynamic(
    () =>
      import("@/components/charts/radar/chart-radar-grid-filled").then(
        (mod) => ({ default: mod.ChartRadarGridFill }),
      ),
    { ssr: false },
  ),
  "chart-radar-grid-none": dynamic(
    () =>
      import("@/components/charts/radar/chart-radar-grid-none").then((mod) => ({
        default: mod.ChartRadarGridNone,
      })),
    { ssr: false },
  ),
  "chart-radar-legend": dynamic(
    () =>
      import("@/components/charts/radar/chart-radar-legend").then((mod) => ({
        default: mod.ChartRadarLegend,
      })),
    { ssr: false },
  ),
  "chart-radar-lines-only": dynamic(
    () =>
      import("@/components/charts/radar/chart-radar-lines-only").then(
        (mod) => ({ default: mod.ChartRadarLinesOnly }),
      ),
    { ssr: false },
  ),
  "chart-radar-multiple": dynamic(
    () =>
      import("@/components/charts/radar/chart-radar-multiple").then((mod) => ({
        default: mod.ChartRadarMultiple,
      })),
    { ssr: false },
  ),
  // Radial
  "chart-radial": dynamic(
    () =>
      import("@/components/charts/radial/chart-radial").then((mod) => ({
        default: mod.ChartRadialSimple,
      })),
    { ssr: false },
  ),
  "chart-radial-grid": dynamic(
    () =>
      import("@/components/charts/radial/chart-radial-grid").then((mod) => ({
        default: mod.ChartRadialGrid,
      })),
    { ssr: false },
  ),
  "chart-radial-label": dynamic(
    () =>
      import("@/components/charts/radial/chart-radial-label").then((mod) => ({
        default: mod.ChartRadialLabel,
      })),
    { ssr: false },
  ),
  "chart-radial-shape": dynamic(
    () =>
      import("@/components/charts/radial/chart-radial-shape").then((mod) => ({
        default: mod.ChartRadialShape,
      })),
    { ssr: false },
  ),
  "chart-radial-stacked": dynamic(
    () =>
      import("@/components/charts/radial/chart-radial-stacked").then((mod) => ({
        default: mod.ChartRadialStacked,
      })),
    { ssr: false },
  ),
  "chart-radial-text": dynamic(
    () =>
      import("@/components/charts/radial/chart-radial-text").then((mod) => ({
        default: mod.ChartRadialText,
      })),
    { ssr: false },
  ),
  // Tooltip
  "chart-tooltip": dynamic(
    () =>
      import("@/components/charts/tooltip/chart-tooltip").then((mod) => ({
        default: mod.ChartTooltipDefault,
      })),
    { ssr: false },
  ),
  "chart-tooltip-advanced": dynamic(
    () =>
      import("@/components/charts/tooltip/chart-tooltip-advanced").then(
        (mod) => ({ default: mod.ChartTooltipAdvanced }),
      ),
    { ssr: false },
  ),
  "chart-tooltip-custom-label": dynamic(
    () =>
      import("@/components/charts/tooltip/chart-tooltip-custom-label").then(
        (mod) => ({ default: mod.ChartTooltipLabelCustom }),
      ),
    { ssr: false },
  ),
  "chart-tooltip-formatter": dynamic(
    () =>
      import("@/components/charts/tooltip/chart-tooltip-formatter").then(
        (mod) => ({ default: mod.ChartTooltipFormatter }),
      ),
    { ssr: false },
  ),
  "chart-tooltip-icons": dynamic(
    () =>
      import("@/components/charts/tooltip/chart-tooltip-icons").then((mod) => ({
        default: mod.ChartTooltipIcons,
      })),
    { ssr: false },
  ),
  "chart-tooltip-label-formatter": dynamic(
    () =>
      import("@/components/charts/tooltip/chart-tooltip-label-formatter").then(
        (mod) => ({ default: mod.ChartTooltipLabelFormatter }),
      ),
    { ssr: false },
  ),
  "chart-tooltip-line-indicator": dynamic(
    () =>
      import("@/components/charts/tooltip/chart-tooltip-line-indicator").then(
        (mod) => ({ default: mod.ChartTooltipIndicatorLine }),
      ),
    { ssr: false },
  ),
  "chart-tooltip-no-indicator": dynamic(
    () =>
      import("@/components/charts/tooltip/chart-tooltip-no-indicator").then(
        (mod) => ({ default: mod.ChartTooltipIndicatorNone }),
      ),
    { ssr: false },
  ),
  "chart-tooltip-no-label": dynamic(
    () =>
      import("@/components/charts/tooltip/chart-tooltip-no-label").then(
        (mod) => ({ default: mod.ChartTooltipLabelNone }),
      ),
    { ssr: false },
  ),
};

export function getChartDemoComponent(slug: string): ComponentType | null {
  return CHART_DEMOS[slug] ?? null;
}

const UTILITY_DEMOS: Record<string, ComponentType> = {
  "agent-browser": dynamic(() => import("./demos/utils/agent-browser"), {
    ssr: false,
  }),
  gui: dynamic(() => import("./demos/utils/gui-demo"), { ssr: false }),
  "image-generation": dynamic(
    () => import("./demos/utils/image-generation-demo"),
    { ssr: false },
  ),
  multiports: dynamic(() => import("./demos/utils/multiports-demo"), {
    ssr: false,
  }),
  "sound-generation": dynamic(
    () => import("./demos/utils/sound-generation-demo"),
    { ssr: false },
  ),
  streamdown: dynamic(() => import("./demos/utils/streamdown-demo"), {
    ssr: false,
  }),
  "tools-invocation": dynamic(
    () => import("./demos/utils/tools-invocation-demo"),
    { ssr: false },
  ),
  "ui-generation": dynamic(() => import("./demos/utils/ui-generation-demo"), {
    ssr: false,
  }),
  "visual-json": dynamic(() => import("./demos/utils/visual-json-demo"), {
    ssr: false,
  }),
};

const VISUAL_DEMOS: Record<string, ComponentType> = {
  typography: dynamic(() => import("./demos/visual/typography-demo"), {
    ssr: false,
  }),
  color: dynamic(() => import("./demos/visual/color-demo"), { ssr: false }),
  shadow: dynamic(() => import("./demos/visual/shadow-demo"), { ssr: false }),
  "shadow-overlay": dynamic(() => import("./demos/visual/shadow-overlay-demo"), {
    ssr: false,
  }),
  squircle: dynamic(() => import("./demos/visual/squircle-demo"), {
    ssr: false,
  }),
  ascii: dynamic(() => import("./demos/visual/ascii-demo"), {
    ssr: false,
  }),
  bloom: dynamic(() => import("./demos/visual/bloom-demo"), {
    ssr: false,
  }),
  "circuit-bent": dynamic(() => import("./demos/visual/circuit-bent-demo"), {
    ssr: false,
  }),
  "custom-shader": dynamic(() => import("./demos/visual/custom-shader-demo"), {
    ssr: false,
  }),
  "directional-blur": dynamic(
    () => import("./demos/visual/directional-blur-demo"),
    { ssr: false },
  ),
  "chromatic-aberration": dynamic(
    () => import("./demos/visual/chromatic-aberration-demo"),
    { ssr: false },
  ),
  "chromatic-aberration-v2": dynamic(
    () => import("./demos/visual/chromatic-aberration-v2-demo"),
    { ssr: false },
  ),
  crt: dynamic(() => import("./demos/visual/crt-demo"), {
    ssr: false,
  }),
  "displacement-map": dynamic(
    () => import("./demos/visual/displacement-map-demo"),
    { ssr: false },
  ),
  dithering: dynamic(() => import("./demos/visual/dithering-demo"), {
    ssr: false,
  }),
  "edge-detect": dynamic(() => import("./demos/visual/edge-detect-demo"), {
    ssr: false,
  }),
  "fluted-glass": dynamic(
    () => import("./demos/visual/fluted-glass-demo"),
    { ssr: false },
  ),
  "fluted-glass-v2": dynamic(
    () => import("./demos/visual/fluted-glass-v2-demo"),
    { ssr: false },
  ),
  fluid: dynamic(() => import("./demos/visual/fluid-demo"), {
    ssr: false,
  }),
  halftone: dynamic(() => import("./demos/visual/halftone-demo"), {
    ssr: false,
  }),
  ink: dynamic(() => import("./demos/visual/ink-demo"), {
    ssr: false,
  }),
  "magnify-lens": dynamic(() => import("./demos/visual/magnify-lens-demo"), {
    ssr: false,
  }),
  melt: dynamic(() => import("./demos/visual/melt-demo"), {
    ssr: false,
  }),
	"scribbles": dynamic(() => import("./demos/visual/scribbles-demo"), {
		ssr: false,
	}),
  "mesh-gradient": dynamic(() => import("./demos/visual/mesh-gradient-demo"), {
    ssr: false,
  }),
  "particle-grid": dynamic(
    () => import("./demos/visual/particle-grid-demo"),
    { ssr: false },
  ),
  "pattern-tile": dynamic(() => import("./demos/visual/pattern-tile-demo"), {
    ssr: false,
  }),
  pattern: dynamic(() => import("./demos/visual/pattern-demo"), {
    ssr: false,
  }),
  pixelation: dynamic(() => import("./demos/visual/pixelation-demo"), {
    ssr: false,
  }),
  "pixel-sorting": dynamic(
    () => import("./demos/visual/pixel-sorting-demo"),
    { ssr: false },
  ),
  "pixel-trail": dynamic(() => import("./demos/visual/pixel-trail-demo"), {
    ssr: false,
  }),
  plotter: dynamic(() => import("./demos/visual/plotter-demo"), {
    ssr: false,
  }),
  posterize: dynamic(() => import("./demos/visual/posterize-demo"), {
    ssr: false,
  }),
  "scramble-text": dynamic(() => import("./demos/visual/scramble-text-demo"), {
    ssr: false,
  }),
  slice: dynamic(() => import("./demos/visual/slice-demo"), {
    ssr: false,
  }),
  smear: dynamic(() => import("./demos/visual/smear-demo"), {
    ssr: false,
  }),
  threshold: dynamic(() => import("./demos/visual/threshold-demo"), {
    ssr: false,
  }),
  particles: dynamic(() => import("./demos/visual/particles-demo"), {
    ssr: false,
  }),
  noise: dynamic(() => import("./demos/visual/noise-demo"), {
    ssr: false,
  }),
  "wave-gradient": dynamic(() => import("./demos/visual/wave-gradient-demo"), {
    ssr: false,
  }),
  "liquid-gradient": dynamic(
    () => import("./demos/visual/liquid-gradient-demo"),
    { ssr: false },
  ),
  "logo-gradient": dynamic(() => import("./demos/visual/logo-gradient-demo"), {
    ssr: false,
  }),
  bands: dynamic(() => import("./demos/visual/bands-demo"), { ssr: false }),
  rings: dynamic(() => import("./demos/visual/rings-demo"), { ssr: false }),
  blockify: dynamic(() => import("./demos/visual/blockify-demo"), {
    ssr: false,
  }),
  pixels: dynamic(() => import("./demos/visual/pixels-demo"), { ssr: false }),
  truchet: dynamic(() => import("./demos/visual/truchet-demo"), { ssr: false }),
  "glass-tabs": dynamic(() => import("./demos/visual/glass-tabs-demo"), {
    ssr: false,
  }),
  "glass-slider": dynamic(
    () => import("./demos/visual/glass-slider-demo"),
    { ssr: false },
  ),
  graph: dynamic(() => import("./demos/visual/graph-demo"), {
    ssr: false,
  }),
  "liquid-glass": dynamic(() => import("./demos/visual/liquid-glass-demo"), {
    ssr: false,
  }),
  "logo-glass": dynamic(() => import("./demos/visual/logo-glass-demo"), {
    ssr: false,
  }),
  holo: dynamic(() => import("./demos/visual/holo-demo"), { ssr: false }),
  mesh: dynamic(() => import("./demos/visual/mesh-demo"), { ssr: false }),
  "mesh-02": dynamic(() => import("./demos/visual/mesh-02-demo"), {
    ssr: false,
  }),
};

const CATEGORY_REGISTRIES: Record<string, Record<string, ComponentType>> = {
  visual: VISUAL_DEMOS,
  utility: UTILITY_DEMOS,
  projects: PROJECT_DEMOS,
  arts: ARTS_DEMOS,
  blocks: BLOCK_DEMOS,
  "ui-audio": UI_AUDIO_DEMO,
  "ui-custom": UI_CUSTOM_DEMO,
  ui: UI_DEMO,
};

export function getDemoComponent(
  slug: string,
  category:
    | "ui-audio"
    | "ui-custom"
    | "ui"
    | "blocks"
    | "projects"
    | "arts"
    | "utility"
    | "visual",
): ComponentType | null {
  const registry = CATEGORY_REGISTRIES[category];
  return registry?.[slug] ?? null;
}

const VARIANT_REGISTRIES: Record<string, Record<string, ComponentType>> = {
  "ui-audio": {
    "audio-player-demo-default": dynamic(
      () =>
        import("./demos/ui-audio/audio-player-demo").then((mod) => ({
          default: mod.AudioPlayerDemoDefault,
        })),
      { ssr: false },
    ),
    "audio-player-demo-compact": dynamic(
      () =>
        import("./demos/ui-audio/audio-player-demo").then((mod) => ({
          default: mod.AudioPlayerDemoCompact,
        })),
      { ssr: false },
    ),
    "bar-visualizer-demo-speaking": dynamic(
      () =>
        import("./demos/ui-audio/bar-visualizer-demo").then((mod) => ({
          default: mod.BarVisualizerDemoSpeaking,
        })),
      { ssr: false },
    ),
    "conversation-demo-transcript": dynamic(
      () =>
        import("./demos/ui-audio/conversation-demo").then((mod) => ({
          default: mod.ConversationDemoTranscript,
        })),
      { ssr: false },
    ),
    "conversation-demo-empty": dynamic(
      () =>
        import("./demos/ui-audio/conversation-demo").then((mod) => ({
          default: mod.ConversationDemoEmpty,
        })),
      { ssr: false },
    ),
    "conversation-bar-demo-default": dynamic(
      () =>
        import("./demos/ui-audio/conversation-bar-demo").then((mod) => ({
          default: mod.ConversationBarDemoDefault,
        })),
      { ssr: false },
    ),
    "live-waveform-demo-scrolling": dynamic(
      () =>
        import("./demos/ui-audio/live-waveform-demo").then((mod) => ({
          default: mod.LiveWaveformDemoScrolling,
        })),
      { ssr: false },
    ),
    "matrix-demo-digits": dynamic(
      () =>
        import("./demos/ui-audio/matrix-demo").then((mod) => ({
          default: mod.MatrixDemoDigits,
        })),
      { ssr: false },
    ),
    "message-demo-flat": dynamic(
      () =>
        import("./demos/ui-audio/message-demo").then((mod) => ({
          default: mod.MessageDemoFlat,
        })),
      { ssr: false },
    ),
    "mic-selector-demo-muted": dynamic(
      () =>
        import("./demos/ui-audio/mic-selector-demo").then((mod) => ({
          default: mod.MicSelectorDemoMuted,
        })),
      { ssr: false },
    ),
    "orb-demo-states": dynamic(
      () =>
        import("./demos/ui-audio/orb-demo").then((mod) => ({
          default: mod.OrbDemoStates,
        })),
      { ssr: false },
    ),
    "response-demo-checklist": dynamic(
      () =>
        import("./demos/ui-audio/response-demo").then((mod) => ({
          default: mod.ResponseDemoChecklist,
        })),
      { ssr: false },
    ),
    "scrub-bar-demo-default": dynamic(
      () =>
        import("./demos/ui-audio/scrub-bar-demo").then((mod) => ({
          default: mod.ScrubBarDemoDefault,
        })),
      { ssr: false },
    ),
    "shimmering-text-demo-accent": dynamic(
      () =>
        import("./demos/ui-audio/shimmering-text-demo").then((mod) => ({
          default: mod.ShimmeringTextDemoAccent,
        })),
      { ssr: false },
    ),
    "speech-input-demo-compact": dynamic(
      () =>
        import("./demos/ui-audio/speech-input-demo").then((mod) => ({
          default: mod.SpeechInputDemoCompact,
        })),
      { ssr: false },
    ),
    "transcript-viewer-demo-default": dynamic(
      () =>
        import("./demos/ui-audio/transcript-viewer-demo").then((mod) => ({
          default: mod.TranscriptViewerDemoDefault,
        })),
      { ssr: false },
    ),
    "voice-button-demo-recording": dynamic(
      () =>
        import("./demos/ui-audio/voice-button-demo").then((mod) => ({
          default: mod.VoiceButtonDemoRecording,
        })),
      { ssr: false },
    ),
    "voice-picker-demo-default": dynamic(
      () =>
        import("./demos/ui-audio/voice-picker-demo").then((mod) => ({
          default: mod.VoicePickerDemoDefault,
        })),
      { ssr: false },
    ),
    "waveform-demo-scrolling": dynamic(
      () =>
        import("./demos/ui-audio/waveform-demo").then((mod) => ({
          default: mod.WaveformDemoScrolling,
        })),
      { ssr: false },
    ),
    "waveform-demo-scrubber": dynamic(
      () =>
        import("./demos/ui-audio/waveform-demo").then((mod) => ({
          default: mod.WaveformDemoScrubber,
        })),
      { ssr: false },
    ),
  },
  "ui-custom": UI_CUSTOM_VARIANT_DEMOS,
  blocks: BLOCK_VARIANT_DEMOS,
  ui: UI_VARIANT_DEMOS,
};

export function getVariantDemoComponent(
  slug: string,
  category:
    | "ui-audio"
    | "ui-custom"
    | "ui"
    | "blocks"
    | "projects"
    | "arts"
    | "utility"
    | "visual",
): ComponentType | null {
  const registry = VARIANT_REGISTRIES[category];
  return registry?.[slug] ?? null;
}
