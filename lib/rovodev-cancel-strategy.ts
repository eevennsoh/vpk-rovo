export function shouldSendExplicitRovoDevCancel(input: {
	hasUseChatTurn: boolean;
	stopSettledInTime: boolean;
}): boolean {
	if (!input.hasUseChatTurn) {
		return true;
	}

	return input.stopSettledInTime !== true;
}
