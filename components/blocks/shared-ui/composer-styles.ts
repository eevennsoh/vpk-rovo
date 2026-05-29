import { token } from "@/lib/tokens";

export const composerUpwardShadow =
	"0px -2px 50px 8px rgba(30, 31, 33, 0.08)";

export const composerPromptInputClassName =
	"chat-composer-form w-full [&>[data-slot=input-group]]:h-auto [&>[data-slot=input-group]]:border-0 [&>[data-slot=input-group]]:bg-transparent [&>[data-slot=input-group]]:shadow-none [&>[data-slot=input-group]]:ring-0";

export const composerTextareaClassName =
	"chat-composer-textarea min-h-6 max-h-[120px] px-0 py-0 font-normal leading-6 shadow-none outline-none ring-0";

// Textarea sizing for the floating composer layout: `min-h-8` makes the field as tall as
// the leading/trailing icon buttons so a single line sits vertically centered on the flex
// row, while `flex-1` lets it fill the width between the "+" and the action cluster.
export const floatingComposerTextareaClassName =
	"min-h-8 flex-1 py-1.5 leading-5";

export const textareaCSS = `
	.chat-composer-textarea:placeholder-shown {
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	.chat-composer-textarea::placeholder {
		color: ${token("color.text.subtlest")};
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
`;
