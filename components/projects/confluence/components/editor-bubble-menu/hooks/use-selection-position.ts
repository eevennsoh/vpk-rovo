"use client";

import { useState, useEffect } from "react";
import { Editor } from "@tiptap/react";

interface SelectionPosition {
	top: number;
	left: number;
}

interface UseSelectionPositionResult {
	show: boolean;
	position: SelectionPosition;
}

export function useSelectionPosition(editor: Editor): UseSelectionPositionResult {
	const [show, setShow] = useState(false);
	const [position, setPosition] = useState<SelectionPosition>({ top: 0, left: 0 });

	useEffect(() => {
		function updateMenu(): void {
			const { from, to } = editor.state.selection;
			const hasSelection = from !== to;

			if (!hasSelection) {
				setShow(false);
				return;
			}

			const { view } = editor;
			const start = view.coordsAtPos(from);
			const end = view.coordsAtPos(to);

			const left = (start.left + end.left) / 2;
			const top = start.top - 10;

			setPosition({ top, left });
			setShow(true);
		}

		editor.on("selectionUpdate", updateMenu);
		editor.on("transaction", updateMenu);

		return () => {
			editor.off("selectionUpdate", updateMenu);
			editor.off("transaction", updateMenu);
		};
	}, [editor]);

	return { show, position };
}
