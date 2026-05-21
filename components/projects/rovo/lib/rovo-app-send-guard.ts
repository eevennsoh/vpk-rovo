import type { ChatStatus } from "ai";
import type React from "react";

const SEND_SETTLE_TIMEOUT_MS = 3_000;
const USE_CHAT_IDLE_GRACE_MS = 75;
const SEND_SETTLE_TIMEOUT_MESSAGE =
	"Timed out waiting for previous turn to settle before sending.";

export class RovoAppSendSettledTimeoutError extends Error {
	constructor() {
		super(SEND_SETTLE_TIMEOUT_MESSAGE);
		this.name = "RovoAppSendSettledTimeoutError";
	}
}

export function isRovoAppSendSettledTimeoutError(error: unknown): boolean {
	return (
		error instanceof RovoAppSendSettledTimeoutError
		|| (
			error instanceof Error
			&& error.name === "RovoAppSendSettledTimeoutError"
			&& error.message === SEND_SETTLE_TIMEOUT_MESSAGE
		)
	);
}

function defaultSleep(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

type WaitForChatSendSettledOptions = {
	lastBusyAtRef?: React.RefObject<number>;
	now?: () => number;
	sleep?: (ms: number) => Promise<void>;
	statusRef: React.RefObject<ChatStatus>;
};

export async function waitForChatSendSettled({
	lastBusyAtRef,
	now = Date.now,
	sleep,
	statusRef,
}: WaitForChatSendSettledOptions): Promise<void> {
	const wait = sleep ?? defaultSleep;
	const settleStart = now();
	while (
		statusRef.current === "submitted"
		|| statusRef.current === "streaming"
	) {
		if (now() - settleStart > SEND_SETTLE_TIMEOUT_MS) {
			throw new RovoAppSendSettledTimeoutError();
		}
		await wait(10);
	}

	if (!lastBusyAtRef?.current) {
		return;
	}

	const idleForMs = now() - lastBusyAtRef.current;
	if (idleForMs < USE_CHAT_IDLE_GRACE_MS) {
		await wait(USE_CHAT_IDLE_GRACE_MS - idleForMs);
	}
}

export const rovoAppSendGuardConstants = {
	SEND_SETTLE_TIMEOUT_MS,
	USE_CHAT_IDLE_GRACE_MS,
};
