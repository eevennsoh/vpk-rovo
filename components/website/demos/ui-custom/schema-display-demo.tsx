import {
	SchemaDisplay,
	SchemaDisplayHeader,
	SchemaDisplayMethod,
	SchemaDisplayPath,
	SchemaDisplayDescription,
	SchemaDisplayContent,
	SchemaDisplayParameters,
	SchemaDisplayRequest,
} from "@/components/ui-custom/schema-display";

export default function SchemaDisplayDemo() {
	return (
		<SchemaDisplay
			method="GET"
			path="/api/users/{id}"
			description="Retrieve a user by their unique identifier."
			parameters={[
				{
					name: "id",
					type: "string",
					required: true,
					description: "The unique user identifier.",
					location: "path",
				},
			]}
			responseBody={[
				{ name: "id", type: "string", required: true, description: "User ID." },
				{ name: "name", type: "string", required: true, description: "Display name." },
				{ name: "email", type: "string", required: true, description: "Email address." },
				{ name: "role", type: "string", description: "User role (admin, member, viewer)." },
			]}
			className="w-full"
		/>
	);
}

export function SchemaDisplayDemoWithParams() {
	return (
		<SchemaDisplay
			method="GET"
			path="/api/projects/{projectId}/issues"
			description="List issues for a project with optional filtering."
			parameters={[
				{
					name: "projectId",
					type: "string",
					required: true,
					description: "The project identifier.",
					location: "path",
				},
				{
					name: "status",
					type: "string",
					description: "Filter by issue status (open, closed, in_progress).",
					location: "query",
				},
				{
					name: "assignee",
					type: "string",
					description: "Filter by assignee user ID.",
					location: "query",
				},
				{
					name: "limit",
					type: "number",
					description: "Maximum number of results to return.",
					location: "query",
				},
				{
					name: "X-Api-Key",
					type: "string",
					required: true,
					description: "API authentication key.",
					location: "header",
				},
			]}
			className="w-full"
		/>
	);
}

export function SchemaDisplayDemoWithBody() {
	return (
		<SchemaDisplay
			method="POST"
			path="/api/users"
			description="Create a new user account."
			requestBody={[
				{ name: "name", type: "string", required: true, description: "The user's full name." },
				{ name: "email", type: "string", required: true, description: "A valid email address." },
				{ name: "password", type: "string", required: true, description: "Minimum 8 characters." },
				{ name: "role", type: "string", description: "User role. Defaults to 'member'." },
			]}
			responseBody={[
				{ name: "id", type: "string", required: true, description: "Generated user ID." },
				{ name: "name", type: "string", required: true },
				{ name: "email", type: "string", required: true },
				{ name: "role", type: "string", required: true },
				{ name: "createdAt", type: "string", required: true, description: "ISO 8601 timestamp." },
			]}
			className="w-full"
		/>
	);
}

export function SchemaDisplayDemoNested() {
	return (
		<SchemaDisplay
			method="POST"
			path="/api/orders"
			description="Create a new order with line items and shipping address."
			requestBody={[
				{
					name: "items",
					type: "array",
					required: true,
					description: "Order line items.",
					items: {
						name: "item",
						type: "object",
						properties: [
							{ name: "productId", type: "string", required: true, description: "Product identifier." },
							{ name: "quantity", type: "number", required: true, description: "Number of units." },
							{ name: "price", type: "number", required: true, description: "Unit price in cents." },
						],
					},
				},
				{
					name: "shipping",
					type: "object",
					required: true,
					description: "Shipping address.",
					properties: [
						{ name: "street", type: "string", required: true },
						{ name: "city", type: "string", required: true },
						{ name: "state", type: "string", required: true },
						{ name: "zip", type: "string", required: true },
						{ name: "country", type: "string", required: true, description: "ISO 3166-1 alpha-2 code." },
					],
				},
				{ name: "notes", type: "string", description: "Optional order notes." },
			]}
			responseBody={[
				{ name: "orderId", type: "string", required: true },
				{ name: "status", type: "string", required: true, description: "Order status (pending, confirmed, shipped)." },
				{ name: "total", type: "number", required: true, description: "Total amount in cents." },
			]}
			className="w-full"
		/>
	);
}

export function SchemaDisplayDemoMethods() {
	return (
		<div className="flex w-full flex-col gap-4">
			<SchemaDisplay
				method="GET"
				path="/api/users"
				description="List all users."
				className="w-full"
			>
				<SchemaDisplayHeader>
					<div className="flex items-center gap-3">
						<SchemaDisplayMethod />
						<SchemaDisplayPath />
					</div>
				</SchemaDisplayHeader>
				<SchemaDisplayDescription />
			</SchemaDisplay>

			<SchemaDisplay
				method="POST"
				path="/api/users"
				description="Create a new user."
				className="w-full"
			>
				<SchemaDisplayHeader>
					<div className="flex items-center gap-3">
						<SchemaDisplayMethod />
						<SchemaDisplayPath />
					</div>
				</SchemaDisplayHeader>
				<SchemaDisplayDescription />
			</SchemaDisplay>

			<SchemaDisplay
				method="PUT"
				path="/api/users/{id}"
				description="Replace a user record."
				className="w-full"
			>
				<SchemaDisplayHeader>
					<div className="flex items-center gap-3">
						<SchemaDisplayMethod />
						<SchemaDisplayPath />
					</div>
				</SchemaDisplayHeader>
				<SchemaDisplayDescription />
			</SchemaDisplay>

			<SchemaDisplay
				method="PATCH"
				path="/api/users/{id}"
				description="Partially update a user."
				className="w-full"
			>
				<SchemaDisplayHeader>
					<div className="flex items-center gap-3">
						<SchemaDisplayMethod />
						<SchemaDisplayPath />
					</div>
				</SchemaDisplayHeader>
				<SchemaDisplayDescription />
			</SchemaDisplay>

			<SchemaDisplay
				method="DELETE"
				path="/api/users/{id}"
				description="Delete a user by ID."
				className="w-full"
			>
				<SchemaDisplayHeader>
					<div className="flex items-center gap-3">
						<SchemaDisplayMethod />
						<SchemaDisplayPath />
					</div>
				</SchemaDisplayHeader>
				<SchemaDisplayDescription />
			</SchemaDisplay>
		</div>
	);
}

export function SchemaDisplayDemoCustomComposition() {
	return (
		<SchemaDisplay
			method="PUT"
			path="/api/settings/{key}"
			description="Update a configuration setting."
			parameters={[
				{
					name: "key",
					type: "string",
					required: true,
					description: "Setting key name.",
					location: "path",
				},
			]}
			requestBody={[
				{ name: "value", type: "any", required: true, description: "The new setting value." },
				{ name: "reason", type: "string", description: "Audit log reason for the change." },
			]}
			className="w-full"
		>
			<SchemaDisplayHeader>
				<div className="flex items-center gap-3">
					<SchemaDisplayMethod />
					<SchemaDisplayPath />
				</div>
			</SchemaDisplayHeader>
			<SchemaDisplayDescription />
			<SchemaDisplayContent>
				<SchemaDisplayParameters />
				<SchemaDisplayRequest />
			</SchemaDisplayContent>
		</SchemaDisplay>
	);
}
