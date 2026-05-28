"use client";

import {
	CreateInput,
	CreateInputBody,
	CreateInputFooter,
	CreateInputSendControls,
	CreateInputTextarea,
	CreateInputTools,
} from "@/components/ui-custom/create-input";

export default function CreateInputDemo() {
	return (
		<CreateInput
			onSubmit={({ text }) => {
				console.log("submit", text);
			}}
		>
			<CreateInputBody>
				<CreateInputTextarea placeholder="Describe what to create..." rows={1} />
			</CreateInputBody>
			<CreateInputFooter className="justify-between px-1">
				<CreateInputTools />
				<CreateInputSendControls />
			</CreateInputFooter>
		</CreateInput>
	);
}
