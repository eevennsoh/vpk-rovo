"use client";

import {
	EnvironmentVariables,
	EnvironmentVariablesHeader,
	EnvironmentVariablesTitle,
	EnvironmentVariablesToggle,
	EnvironmentVariablesContent,
	EnvironmentVariable,
	EnvironmentVariableName,
	EnvironmentVariableValue,
	EnvironmentVariableCopyButton,
	EnvironmentVariableRequired,
	EnvironmentVariableGroup,
} from "@/components/ui-custom/environment-variables";

export default function EnvironmentVariablesDemo() {
	return (
		<EnvironmentVariables className="w-full max-w-lg">
			<EnvironmentVariablesHeader>
				<EnvironmentVariablesTitle />
				<EnvironmentVariablesToggle />
			</EnvironmentVariablesHeader>
			<EnvironmentVariablesContent>
				<EnvironmentVariable name="OPENAI_API_KEY" value="sk-proj-abc123def456">
					<EnvironmentVariableGroup>
						<EnvironmentVariableName />
						<EnvironmentVariableRequired />
					</EnvironmentVariableGroup>
					<EnvironmentVariableGroup>
						<EnvironmentVariableValue />
						<EnvironmentVariableCopyButton />
					</EnvironmentVariableGroup>
				</EnvironmentVariable>
				<EnvironmentVariable name="DATABASE_URL" value="postgresql://user:pass@localhost:5432/db">
					<EnvironmentVariableGroup>
						<EnvironmentVariableName />
						<EnvironmentVariableRequired />
					</EnvironmentVariableGroup>
					<EnvironmentVariableGroup>
						<EnvironmentVariableValue />
						<EnvironmentVariableCopyButton />
					</EnvironmentVariableGroup>
				</EnvironmentVariable>
				<EnvironmentVariable name="NODE_ENV" value="production">
					<EnvironmentVariableGroup>
						<EnvironmentVariableName />
					</EnvironmentVariableGroup>
					<EnvironmentVariableGroup>
						<EnvironmentVariableValue />
						<EnvironmentVariableCopyButton />
					</EnvironmentVariableGroup>
				</EnvironmentVariable>
			</EnvironmentVariablesContent>
		</EnvironmentVariables>
	);
}

export function EnvironmentVariablesDemoWithCopy() {
	return (
		<EnvironmentVariables className="w-full max-w-lg">
			<EnvironmentVariablesHeader>
				<EnvironmentVariablesTitle />
				<EnvironmentVariablesToggle />
			</EnvironmentVariablesHeader>
			<EnvironmentVariablesContent>
				<EnvironmentVariable name="API_KEY" value="sk-123abc">
					<EnvironmentVariableName />
					<EnvironmentVariableGroup>
						<EnvironmentVariableValue />
						<EnvironmentVariableCopyButton copyFormat="value" />
					</EnvironmentVariableGroup>
				</EnvironmentVariable>
				<EnvironmentVariable name="SECRET_TOKEN" value="tok_live_9x8y7z">
					<EnvironmentVariableName />
					<EnvironmentVariableGroup>
						<EnvironmentVariableValue />
						<EnvironmentVariableCopyButton copyFormat="export" />
					</EnvironmentVariableGroup>
				</EnvironmentVariable>
			</EnvironmentVariablesContent>
		</EnvironmentVariables>
	);
}

export function EnvironmentVariablesDemoWithRequired() {
	return (
		<EnvironmentVariables className="w-full max-w-lg">
			<EnvironmentVariablesHeader>
				<EnvironmentVariablesTitle />
				<EnvironmentVariablesToggle />
			</EnvironmentVariablesHeader>
			<EnvironmentVariablesContent>
				<EnvironmentVariable name="OPENAI_API_KEY" value="sk-proj-abc123">
					<EnvironmentVariableGroup>
						<EnvironmentVariableName />
						<EnvironmentVariableRequired />
					</EnvironmentVariableGroup>
					<EnvironmentVariableValue />
				</EnvironmentVariable>
				<EnvironmentVariable name="ANTHROPIC_API_KEY" value="sk-ant-xyz789">
					<EnvironmentVariableGroup>
						<EnvironmentVariableName />
						<EnvironmentVariableRequired />
					</EnvironmentVariableGroup>
					<EnvironmentVariableValue />
				</EnvironmentVariable>
				<EnvironmentVariable name="DEBUG" value="false">
					<EnvironmentVariableName />
					<EnvironmentVariableValue />
				</EnvironmentVariable>
			</EnvironmentVariablesContent>
		</EnvironmentVariables>
	);
}

export function EnvironmentVariablesDemoMinimal() {
	return (
		<EnvironmentVariables className="w-full max-w-lg">
			<EnvironmentVariablesHeader>
				<EnvironmentVariablesTitle />
				<EnvironmentVariablesToggle />
			</EnvironmentVariablesHeader>
			<EnvironmentVariablesContent>
				<EnvironmentVariable name="API_KEY" value="sk-123abc" />
				<EnvironmentVariable name="NODE_ENV" value="production" />
			</EnvironmentVariablesContent>
		</EnvironmentVariables>
	);
}

export function EnvironmentVariablesDemoRevealed() {
	return (
		<EnvironmentVariables className="w-full max-w-lg" defaultShowValues>
			<EnvironmentVariablesHeader>
				<EnvironmentVariablesTitle>API Configuration</EnvironmentVariablesTitle>
				<EnvironmentVariablesToggle />
			</EnvironmentVariablesHeader>
			<EnvironmentVariablesContent>
				<EnvironmentVariable name="BASE_URL" value="https://api.example.com">
					<EnvironmentVariableGroup>
						<EnvironmentVariableName />
					</EnvironmentVariableGroup>
					<EnvironmentVariableGroup>
						<EnvironmentVariableValue />
						<EnvironmentVariableCopyButton />
					</EnvironmentVariableGroup>
				</EnvironmentVariable>
				<EnvironmentVariable name="API_VERSION" value="v2">
					<EnvironmentVariableGroup>
						<EnvironmentVariableName />
					</EnvironmentVariableGroup>
					<EnvironmentVariableGroup>
						<EnvironmentVariableValue />
						<EnvironmentVariableCopyButton />
					</EnvironmentVariableGroup>
				</EnvironmentVariable>
				<EnvironmentVariable name="TIMEOUT_MS" value="5000">
					<EnvironmentVariableGroup>
						<EnvironmentVariableName />
					</EnvironmentVariableGroup>
					<EnvironmentVariableGroup>
						<EnvironmentVariableValue />
						<EnvironmentVariableCopyButton />
					</EnvironmentVariableGroup>
				</EnvironmentVariable>
			</EnvironmentVariablesContent>
		</EnvironmentVariables>
	);
}
