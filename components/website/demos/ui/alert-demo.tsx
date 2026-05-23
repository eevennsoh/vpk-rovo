import MegaphoneIcon from "@atlaskit/icon/core/megaphone"
import QuestionCircleIcon from "@atlaskit/icon/core/question-circle"
import StatusErrorIcon from "@atlaskit/icon/core/status-error"
import StatusInformationIcon from "@atlaskit/icon/core/status-information"
import StatusSuccessIcon from "@atlaskit/icon/core/status-success"
import StatusWarningIcon from "@atlaskit/icon/core/status-warning"
import {
	Alert,
	AlertAction,
	AlertDescription,
	AlertTitle,
} from "@/components/ui/alert"
import { Icon } from "@/components/ui/icon"

export default function AlertDemo() {
	return (
		<Alert className="w-56">
			<Icon render={<StatusInformationIcon label="" />} label="Information" />
			<AlertTitle>Heads up!</AlertTitle>
			<AlertDescription>This is an alert component.</AlertDescription>
		</Alert>
	)
}

export function AlertDemoBasic() {
	return (
		<div className="mx-auto flex w-full max-w-lg flex-col gap-4">
			<Alert>
				<AlertTitle>Success! Your changes have been saved.</AlertTitle>
			</Alert>
			<Alert>
				<AlertTitle>Success! Your changes have been saved.</AlertTitle>
				<AlertDescription>
					This is an alert with title and description.
				</AlertDescription>
			</Alert>
			<Alert>
				<AlertDescription>
					This one has a description only. No title. No icon.
				</AlertDescription>
			</Alert>
		</div>
	)
}

export function AlertDemoDefault() {
	return (
		<Alert>
			<Icon render={<StatusInformationIcon label="" />} label="Information" />
			<AlertTitle>Information</AlertTitle>
			<AlertDescription>This is an informational alert message.</AlertDescription>
		</Alert>
	)
}

export function AlertDemoInfo() {
	return (
		<Alert variant="info">
			<Icon render={<StatusInformationIcon label="" />} label="Information" />
			<AlertTitle>This site is under maintenance</AlertTitle>
		</Alert>
	)
}

export function AlertDemoWarning() {
	return (
		<Alert variant="warning">
			<Icon render={<StatusWarningIcon label="" />} label="Warning" />
			<AlertTitle>Your license is about to expire</AlertTitle>
		</Alert>
	)
}

export function AlertDemoDanger() {
	return (
		<Alert variant="danger">
			<Icon render={<StatusErrorIcon label="" />} label="Danger" />
			<AlertTitle>Your account has been compromised</AlertTitle>
		</Alert>
	)
}

export function AlertDemoDiscovery() {
	return (
		<Alert variant="discovery">
			<Icon render={<QuestionCircleIcon label="" />} label="Discovery" />
			<AlertTitle>Did you know?</AlertTitle>
			<AlertDescription>You can customize your workspace settings in the preferences panel.</AlertDescription>
		</Alert>
	)
}

export function AlertDemoSuccess() {
	return (
		<Alert variant="success">
			<Icon render={<StatusSuccessIcon label="" />} label="Success" />
			<AlertTitle>Your changes have been saved</AlertTitle>
		</Alert>
	)
}

export function AlertDemoError() {
	return (
		<Alert variant="error">
			<Icon render={<StatusErrorIcon label="" />} label="Error" />
			<AlertTitle>Payment processing failed</AlertTitle>
		</Alert>
	)
}

export function AlertDemoAnnouncement() {
	return (
		<Alert variant="announcement">
			<Icon render={<MegaphoneIcon label="" />} label="Announcement" />
			<AlertTitle>New feature available</AlertTitle>
			<AlertDescription>
				Check out the latest updates to your workspace.
			</AlertDescription>
		</Alert>
	)
}

export function AlertDemoCompound() {
	return (
		<Alert variant="warning">
			<Icon render={<StatusWarningIcon label="" />} label="Warning" />
			<AlertTitle>Payment method expiring</AlertTitle>
			<AlertDescription>
				Your credit card ending in 4242 expires next month.
			</AlertDescription>
			<AlertAction>
				<a href="#">Update</a>
			</AlertAction>
		</Alert>
	)
}

export function AlertDemoAppearances() {
	return (
		<div className="flex w-full flex-col gap-2">
			<Alert variant="default">Default alert</Alert>
			<Alert variant="info">Info alert</Alert>
			<Alert variant="warning">Warning alert</Alert>
			<Alert variant="success">Success alert</Alert>
			<Alert variant="danger">Danger alert</Alert>
			<Alert variant="discovery">Discovery alert</Alert>
			<Alert variant="error">Error alert</Alert>
			<Alert variant="announcement">Announcement alert</Alert>
		</div>
	)
}

export function AlertDemoDestructive() {
	return (
		<div className="mx-auto flex w-full max-w-lg flex-col gap-4">
			<Alert variant="destructive">
				<Icon render={<StatusErrorIcon label="" />} label="Destructive" />
				<AlertTitle>Something went wrong!</AlertTitle>
				<AlertDescription>
					Your session has expired. Please log in again.
				</AlertDescription>
			</Alert>
			<Alert variant="destructive">
				<Icon render={<StatusErrorIcon label="" />} label="Destructive" />
				<AlertTitle>Unable to process your payment.</AlertTitle>
				<AlertDescription>
					<p>
						Please verify your <a href="#">billing information</a> and try
						again.
					</p>
					<ul className="list-inside list-disc">
						<li>Check your card details</li>
						<li>Ensure sufficient funds</li>
						<li>Verify billing address</li>
					</ul>
				</AlertDescription>
			</Alert>
		</div>
	)
}

export function AlertDemoWithAction() {
	return (
		<Alert>
			<Icon render={<StatusWarningIcon label="" />} label="Warning" />
			<AlertTitle>Warning</AlertTitle>
			<AlertDescription>Your session will expire soon.</AlertDescription>
			<AlertAction>
				<a href="#">Extend</a>
			</AlertAction>
		</Alert>
	)
}

export function AlertDemoWithActions() {
	return (
		<div className="mx-auto flex w-full max-w-lg flex-col gap-4">
			<Alert>
				<Icon render={<StatusInformationIcon label="" />} label="Information" />
				<AlertTitle>The selected emails have been marked as spam.</AlertTitle>
				<AlertAction>
					<a href="#">Undo</a>
				</AlertAction>
			</Alert>
			<Alert>
				<Icon render={<StatusInformationIcon label="" />} label="Information" />
				<AlertTitle>The selected emails have been marked as spam.</AlertTitle>
				<AlertDescription>
					This is a very long alert title that demonstrates how the component
					handles extended text content.
				</AlertDescription>
				<AlertAction>
					<a href="#">Undo</a>
					<span aria-hidden="true">&middot;</span>
					<a href="#">View details</a>
				</AlertAction>
			</Alert>
		</div>
	)
}

export function AlertDemoWithIcons() {
	return (
		<div className="mx-auto flex w-full max-w-lg flex-col gap-4">
			<Alert>
				<Icon render={<StatusInformationIcon label="" />} label="Information" />
				<AlertTitle>
					Let&apos;s try one with icon, title and an <a href="#">alert details link</a>.
				</AlertTitle>
			</Alert>
			<Alert>
				<Icon render={<StatusInformationIcon label="" />} label="Information" />
				<AlertDescription>
					This one has an icon and a description only. No title.{" "}
					<a href="#">But it has a link</a> and a <a href="#">second link</a>.
				</AlertDescription>
			</Alert>

			<Alert>
				<Icon render={<StatusInformationIcon label="" />} label="Information" />
				<AlertTitle>Success! Your changes have been saved</AlertTitle>
				<AlertDescription>
					This is an alert with icon, title and description.
				</AlertDescription>
			</Alert>
			<Alert>
				<Icon render={<StatusInformationIcon label="" />} label="Information" />
				<AlertTitle>
					This is a very long alert title that demonstrates how the component
					handles extended text content and potentially wraps across multiple
					lines
				</AlertTitle>
			</Alert>
			<Alert>
				<Icon render={<StatusInformationIcon label="" />} label="Information" />
				<AlertDescription>
					This is a very long alert description that demonstrates how the
					component handles extended text content and potentially wraps across
					multiple lines
				</AlertDescription>
			</Alert>
			<Alert>
				<Icon render={<StatusInformationIcon label="" />} label="Information" />
				<AlertTitle>
					This is an extremely long alert title that spans multiple lines to
					demonstrate how the component handles very lengthy headings while
					maintaining readability and proper text wrapping behavior
				</AlertTitle>
				<AlertDescription>
					This is an equally long description that contains detailed
					information about the alert. It shows how the component can
					accommodate extensive content while preserving proper spacing,
					alignment, and readability across different screen sizes and
					viewport widths. This helps ensure the user experience remains
					consistent regardless of the content length.
				</AlertDescription>
			</Alert>
		</div>
	)
}
