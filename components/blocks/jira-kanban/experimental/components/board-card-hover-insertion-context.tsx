"use client";

import { createContext } from "react";

import type { BoardCardInsertion } from "../lib/board-agent-session-drag";

/**
 * Hover-armed insertion for one column's card list. Drag insertions stay on
 * the `cardInsertion` prop so a session drop never fights a pointer hover.
 */
export const BoardCardHoverInsertionContext = createContext<BoardCardInsertion | null>(null);
