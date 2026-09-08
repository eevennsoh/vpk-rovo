import type { JiraKanbanCreatedCardArrival } from "../hooks/use-created-card-arrival";

/**
 * How one card should play a live arrival.
 *
 * Every arriving card runs the same jira-create entrance. A create-well drop
 * and a mid-column gap drop mint the same work item, so they must land the same
 * way — the seam a gap drop opens is exactly the `height: 0 -> auto` slot the
 * create entrance already animates.
 *
 * `appended` therefore no longer picks an entrance. It stays a scroll concern
 * (a gap drop lands under the pointer and must not yank the column) and it
 * still decides which arrival earns the accent backdrop hold, because a card
 * inserted mid-column is the one that needs help being found.
 */
export interface BoardCardArrival {
	/** Live arrival id, published for the column's bottom-reveal observer. */
	readonly arrivalId: number | undefined;
	/** Play the jira-create entrance for this card. */
	readonly entering: boolean;
	/** This card closes the arrival and owns the completion callback. */
	readonly final: boolean;
	/** Mid-column drop: hold the accent backdrop so the new card is findable. */
	readonly highlighted: boolean;
}

const CARD_AT_REST: BoardCardArrival = {
	arrivalId: undefined,
	entering: false,
	final: false,
	highlighted: false,
};

export function resolveBoardCardArrival(
	arrival: JiraKanbanCreatedCardArrival | undefined,
	cardCode: string,
): BoardCardArrival {
	if (arrival === undefined || !arrival.cardCodes.includes(cardCode)) {
		return CARD_AT_REST;
	}

	return {
		arrivalId: arrival.id,
		entering: true,
		final: arrival.cardCodes.at(-1) === cardCode,
		highlighted: !arrival.appended,
	};
}
