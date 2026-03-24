/**
 * Adapter utilities for the ask_user_questions deferred tool integration.
 *
 * Bridges the gap between the QuestionCard component's ID-keyed answer format
 * and the tool's text-keyed answer contract (dict[str, list[str]]).
 */

/**
 * Adapts clarification answers for the ask_user_questions tool contract.
 *
 * For request-user-input sessions (from ask_user_questions tool):
 *   - Maps question IDs back to question text (labels) as keys
 *   - Normalizes all values to string[] (tool expects list, not single value)
 *
 * For other sessions (planning-gate, smart-clarification):
 *   - Passes through unchanged
 *
 * @param {string} sessionId - The clarification session identifier
 * @param {Record<string, string | string[]>} answers - ID-keyed answers from the frontend
 * @param {Array<{id: string, label: string, options?: Array<{id: string, label: string}>}>|null} questionMeta - Question metadata for ID→label mapping
 * @returns {Record<string, string | string[]> | Record<string, string[]>} Adapted answers
 */
function adaptClarificationAnswers(sessionId, answers, questionMeta) {
	if (!answers || typeof answers !== "object") {
		return {};
	}

	// Only adapt for request-user-input sessions (from ask_user_questions tool)
	if (typeof sessionId !== "string" || !sessionId.startsWith("request-user-input-")) {
		return answers;
	}

	if (!questionMeta || questionMeta.length === 0) {
		// No metadata stored — normalize values to arrays but keep ID keys
		return Object.entries(answers).reduce((acc, [key, value]) => {
			acc[key] = Array.isArray(value) ? value : [value];
			return acc;
		}, {});
	}

	// Build question ID → metadata lookup
	const questionMetaById = new Map(questionMeta.map((q) => [q.id, q]));

	return Object.entries(answers).reduce((acc, [questionId, value]) => {
		const question = questionMetaById.get(questionId) || null;
		const questionText = question?.label || questionId;
		const optionLabelById = new Map(
			Array.isArray(question?.options)
				? question.options
					.filter((option) => option && typeof option.id === "string" && typeof option.label === "string")
					.map((option) => [option.id, option.label])
				: []
		);
		const normalizedValues = (Array.isArray(value) ? value : [value]).map((entry) => {
			return optionLabelById.get(entry) || entry;
		});
		// Always normalize to string[] for tool contract
		acc[questionText] = normalizedValues;
		return acc;
	}, {});
}

/**
 * Converts tool's QuestionsInput format to QuestionCard-compatible format.
 * This handles the Pydantic model structure from ask_user_questions.
 *
 * @param {object} toolInput - The raw tool input (QuestionsInput Pydantic model)
 * @returns {Array<{id: string, label: string, kind: string, options: Array<{id: string, label: string, description?: string}>}>|null}
 */
function convertToolInputToQuestionCardFormat(toolInput) {
	if (!toolInput || typeof toolInput !== "object") {
		return null;
	}

	const questions = Array.isArray(toolInput.questions)
		? toolInput.questions
		: Array.isArray(toolInput)
			? toolInput
			: null;

	if (!questions || questions.length === 0) {
		return null;
	}

	return questions
		.map((q, idx) => {
			if (!q || typeof q !== "object") {
				return null;
			}

			const label =
				typeof q.question === "string" ? q.question.trim() :
				typeof q.label === "string" ? q.label.trim() :
				null;
			if (!label) {
				return null;
			}

			const options = Array.isArray(q.options)
				? q.options
					.map((opt, optIdx) => {
						if (!opt || typeof opt !== "object") {
							return null;
						}

						const optLabel = typeof opt.label === "string" ? opt.label.trim() : null;
						if (!optLabel) {
							return null;
						}

						return {
							id: typeof opt.id === "string" ? opt.id : `opt-${idx}-${optIdx}`,
							label: optLabel,
							description: typeof opt.description === "string" ? opt.description.trim() || undefined : undefined,
						};
					})
					.filter(Boolean)
				: [];

			return {
				id: typeof q.id === "string" ? q.id : `q-${idx + 1}`,
				label,
				kind: "single-select",
				options,
			};
		})
		.filter(Boolean);
}

module.exports = {
	adaptClarificationAnswers,
	convertToolInputToQuestionCardFormat,
};
