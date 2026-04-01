export function shouldSendExplicitRovoDevCancel(input: {
	hasBackgroundCancelableWork: boolean;
	hasUseChatTurn: boolean;
	stopSettledInTime: boolean;
}): boolean {
	if (input.hasBackgroundCancelableWork) {
		return true;
	}

	if (!input.hasUseChatTurn) {
		return true;
	}

	return input.stopSettledInTime !== true;
}
