import React from "react";
import { token } from "@/lib/tokens";

/**
 * Highlights matching search terms in text by wrapping them in bold elements.
 */
export function highlightSearchTerms(
	text: string,
	searchTerms: string[] = []
): React.ReactNode {
	if (searchTerms.length === 0) return text;

	const pattern = new RegExp(`(${searchTerms.join("|")})`, "gi");
	const parts = text.split(pattern);

	return (
		<>
			{parts.map((part, index) => {
				const isMatch = searchTerms.some(
					(term) => part.toLowerCase() === term.toLowerCase()
				);
				return isMatch ? (
					<strong key={index} style={{ fontWeight: token("font.weight.bold") }}>
						{part}
					</strong>
				) : (
					<React.Fragment key={index}>{part}</React.Fragment>
				);
			})}
		</>
	);
}
