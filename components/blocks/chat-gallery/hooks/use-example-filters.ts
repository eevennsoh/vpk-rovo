"use client";

import { useMemo, useState } from "react";
import type { ChatGalleryExample } from "../data/examples";
import { DEFAULT_CHAT_GALLERY_EXAMPLES } from "../data/examples";

export function useExampleFilters(examples: readonly ChatGalleryExample[] = DEFAULT_CHAT_GALLERY_EXAMPLES) {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);
	const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

	const filteredExamples = useMemo(
		() => examples.filter((example) => {
			const matchesSearch =
				searchTerm.length === 0 ||
				example.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
				example.description.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesUseCase = selectedUseCases.length === 0 || selectedUseCases.includes(example.useCase);
			const matchesRole = selectedRoles.length === 0 || selectedRoles.includes(example.role);

			return matchesSearch && matchesUseCase && matchesRole;
		}),
		[examples, searchTerm, selectedUseCases, selectedRoles],
	);

	function toggleUseCase(useCase: string) {
		setSelectedUseCases((prev) =>
			prev.includes(useCase)
				? prev.filter((existing) => existing !== useCase)
				: [...prev, useCase]
		);
	}

	function toggleRole(role: string) {
		setSelectedRoles((prev) =>
			prev.includes(role)
				? prev.filter((existing) => existing !== role)
				: [...prev, role]
		);
	}

	return {
		searchTerm,
		setSearchTerm,
		selectedUseCases,
		selectedRoles,
		filteredExamples,
		toggleUseCase,
		toggleRole,
	};
}
