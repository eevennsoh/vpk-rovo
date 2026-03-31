export type ChatTimelineRole = "user" | "assistant";

export interface ChatTimelineMessage {
	id: string;
	role: ChatTimelineRole;
	text: string;
	timestamp: string;
}

export const CHAT_TIMELINE_DEMO_MESSAGES: ReadonlyArray<ChatTimelineMessage> = [
	{
		id: "msg-01",
		role: "user",
		timestamp: "9:14 AM",
		text: "This is a brand new iOS app we inherited after being built by a specific developer. Can you explain what I need in order to run it again?",
	},
	{
		id: "msg-02",
		role: "assistant",
		timestamp: "9:15 AM",
		text: "Start with the signing chain. You need the source code, a valid Apple team, the bundle identifier, the provisioning profile that matches that bundle identifier, and a signing certificate that the profile trusts. Without those pieces, Xcode can build but it cannot install a runnable app on a real device.",
	},
	{
		id: "msg-03",
		role: "user",
		timestamp: "9:21 AM",
		text: "Awesome. Can you explain to me why enterprise certificates disable all apps at once when Apple revokes them?",
	},
	{
		id: "msg-04",
		role: "assistant",
		timestamp: "9:22 AM",
		text: "Enterprise signing is anchored to one certificate authority chain. If Apple revokes that enterprise certificate, every app signed with it becomes untrusted because iOS validates the same signer on launch. The device is not reasoning about each app independently; it is trusting or rejecting the certificate that signed the whole set.",
	},
	{
		id: "msg-05",
		role: "user",
		timestamp: "9:34 AM",
		text: "Is there a way I can run the app locally in the simulator without dealing with signing at all?",
	},
	{
		id: "msg-06",
		role: "assistant",
		timestamp: "9:35 AM",
		text: "Yes. The simulator does not need the same code-signing path as a physical device, so it is the fastest way to smoke-test the project. The limitation is that anything tied to device hardware, push, secure enclave, or real provisioning still needs a device pass later.",
	},
	{
		id: "msg-07",
		role: "user",
		timestamp: "9:48 AM",
		text: "Can you explain how signing works for ad hoc, enterprise, TestFlight, and a personal team in one clean comparison?",
	},
	{
		id: "msg-08",
		role: "assistant",
		timestamp: "9:49 AM",
		text: "Ad hoc signing targets a defined device list. Enterprise signing targets internal distribution within one company. TestFlight routes distribution through App Store Connect with Apple-managed review and install flows. A personal team is the lightest option, but apps expire quickly and it is best suited to local experimentation rather than repeatable team distribution.",
	},
	{
		id: "msg-09",
		role: "user",
		timestamp: "10:03 AM",
		text: "If we only want internal QA, which path keeps setup light while still being reliable for weekly builds?",
	},
	{
		id: "msg-10",
		role: "assistant",
		timestamp: "10:05 AM",
		text: "For most teams, TestFlight is the least fragile option. It removes the burden of manually curating device UDIDs, it survives personnel changes better than certificate-sharing habits, and it gives QA a stable install story. Ad hoc can still work if your tester pool is fixed and small.",
	},
	{
		id: "msg-11",
		role: "user",
		timestamp: "10:19 AM",
		text: "Can you give me a checklist for what I should ask the original developer to hand over before we touch the build pipeline?",
	},
	{
		id: "msg-12",
		role: "assistant",
		timestamp: "10:20 AM",
		text: "Ask for the Apple team access level, certificate ownership details, App Store Connect permissions, bundle identifiers, entitlements, push and keychain settings, CI secrets, and any Fastlane or custom build scripts. The goal is not just to compile today, but to remove any single-person dependency from the delivery path.",
	},
	{
		id: "msg-13",
		role: "user",
		timestamp: "10:43 AM",
		text: "Please turn that into a migration plan with stages for source access, certificates, CI secrets, test distribution, and rollback.",
	},
	{
		id: "msg-14",
		role: "assistant",
		timestamp: "10:44 AM",
		text: "I would stage it in five passes: secure repository and Apple access, inventory all signing assets, recreate CI from known-good secrets, validate distribution through a small QA ring, and then document rollback with named owners. Each stage should end with a runnable build and a clearly recorded source of truth.",
	},
];
