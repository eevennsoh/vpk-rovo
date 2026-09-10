"use client";

import { useCallback, useMemo, useState } from "react";

import {
	clearBoardFilterField,
	countBoardFilterSelections,
	EMPTY_BOARD_FILTER_DAYS,
	EMPTY_BOARD_FILTER_VALUE_SELECTIONS,
	toggleBoardFilterValue,
	type BoardFilterDaysSelection,
	type BoardFilterFieldId,
	type BoardFilterValueFieldId,
	type BoardFilterValueSelections,
} from "../lib/board-filter";

export interface BoardFilterModel {
	days: BoardFilterDaysSelection;
	open: boolean;
	selectedCount: number;
	selectedFieldId: BoardFilterFieldId;
	selectedValueIdsByField: BoardFilterValueSelections;
}

export interface BoardFilterActions {
	clearAll: () => void;
	clearField: (fieldId: BoardFilterFieldId) => void;
	setAssigneeIds: (assigneeIds: Set<string>) => void;
	setDays: (days: BoardFilterDaysSelection) => void;
	setOpen: (open: boolean) => void;
	setSelectedFieldId: (fieldId: BoardFilterFieldId) => void;
	toggleValue: (fieldId: BoardFilterValueFieldId, valueId: string) => void;
}

export function useBoardFilter({
	onAssigneeChange,
}: Readonly<{
	onAssigneeChange?: () => void;
}> = {}): {
	actions: BoardFilterActions;
	model: BoardFilterModel;
	selectedAssigneeIds: Set<string>;
} {
	const [open, setOpen] = useState(false);
	const [selectedFieldId, setSelectedFieldId] = useState<BoardFilterFieldId>("assignee");
	const [selectedValueIdsByField, setSelectedValueIdsByField] = useState<BoardFilterValueSelections>(
		EMPTY_BOARD_FILTER_VALUE_SELECTIONS,
	);
	const [days, setDays] = useState<BoardFilterDaysSelection>(EMPTY_BOARD_FILTER_DAYS);

	const selectedCount = countBoardFilterSelections(selectedValueIdsByField, days);
	const selectedAssigneeIds = useMemo(
		() => new Set(selectedValueIdsByField.assignee),
		[selectedValueIdsByField.assignee],
	);

	const toggleValue = useCallback((fieldId: BoardFilterValueFieldId, valueId: string) => {
		if (fieldId === "assignee") onAssigneeChange?.();
		setSelectedValueIdsByField((current) => toggleBoardFilterValue(current, fieldId, valueId));
	}, [onAssigneeChange]);

	const setAssigneeIds = useCallback((assigneeIds: Set<string>) => {
		onAssigneeChange?.();
		setSelectedValueIdsByField((current) => ({
			...current,
			assignee: [...assigneeIds],
		}));
	}, [onAssigneeChange]);

	const clearField = useCallback((fieldId: BoardFilterFieldId) => {
		if (fieldId === "days") {
			setDays(EMPTY_BOARD_FILTER_DAYS);
			return;
		}
		if (fieldId === "assignee") onAssigneeChange?.();
		setSelectedValueIdsByField((current) => (
			clearBoardFilterField(current, EMPTY_BOARD_FILTER_DAYS, fieldId).values
		));
	}, [onAssigneeChange]);

	const clearAll = useCallback(() => {
		onAssigneeChange?.();
		setSelectedValueIdsByField(EMPTY_BOARD_FILTER_VALUE_SELECTIONS);
		setDays(EMPTY_BOARD_FILTER_DAYS);
	}, [onAssigneeChange]);

	return {
		actions: {
			clearAll,
			clearField,
			setAssigneeIds,
			setDays,
			setOpen,
			setSelectedFieldId,
			toggleValue,
		},
		model: {
			days,
			open,
			selectedCount,
			selectedFieldId,
			selectedValueIdsByField,
		},
		selectedAssigneeIds,
	};
}
