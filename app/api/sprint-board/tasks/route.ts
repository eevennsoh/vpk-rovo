import { type NextRequest, NextResponse } from "next/server";
import type { Task, ColumnId } from "@/lib/sprint-board-types";

interface MoveTaskRequest {
	taskId: string;
	sourceColumnId: ColumnId;
	destinationColumnId: ColumnId;
	newPosition?: number;
}

interface UpdateTaskRequest {
	taskId: string;
	updates: Partial<Task>;
}

/**
 * POST /api/sprint-board/tasks
 * Handle task operations: move, update, create
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { action } = body;

		switch (action) {
			case "move":
				return handleMoveTask(body as MoveTaskRequest);
			case "update":
				return handleUpdateTask(body as UpdateTaskRequest);
			default:
				return NextResponse.json(
					{
						success: false,
						error: "Invalid action",
						details: `Action must be one of: move, update`,
					},
					{ status: 400 }
				);
		}
	} catch (error) {
		console.error("Error in sprint board tasks API:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to process task operation",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}

/**
 * Handle moving a task between columns
 */
async function handleMoveTask(request: MoveTaskRequest) {
	const { taskId, sourceColumnId, destinationColumnId, newPosition } = request;

	// Validate required fields
	if (!taskId || !sourceColumnId || !destinationColumnId) {
		return NextResponse.json(
			{
				success: false,
				error: "Invalid move task request",
				details: "Missing required fields: taskId, sourceColumnId, destinationColumnId",
			},
			{ status: 400 }
		);
	}

	// Validate column IDs
	const validColumns: ColumnId[] = ["todo", "in-progress", "done"];
	if (!validColumns.includes(sourceColumnId) || !validColumns.includes(destinationColumnId)) {
		return NextResponse.json(
			{
				success: false,
				error: "Invalid column ID",
				details: `Column ID must be one of: ${validColumns.join(", ")}`,
			},
			{ status: 400 }
		);
	}

	// In production, this would update the database
	// For now, we return a success response with the operation details
	return NextResponse.json({
		success: true,
		message: "Task moved successfully",
		data: {
			taskId,
			from: sourceColumnId,
			to: destinationColumnId,
			position: newPosition ?? 0,
		},
		timestamp: new Date().toISOString(),
	});
}

/**
 * Handle updating task properties
 */
async function handleUpdateTask(request: UpdateTaskRequest) {
	const { taskId, updates } = request;

	// Validate required fields
	if (!taskId || !updates) {
		return NextResponse.json(
			{
				success: false,
				error: "Invalid update task request",
				details: "Missing required fields: taskId, updates",
			},
			{ status: 400 }
		);
	}

	// Validate that updates object is not empty
	if (Object.keys(updates).length === 0) {
		return NextResponse.json(
			{
				success: false,
				error: "Invalid update task request",
				details: "Updates object cannot be empty",
			},
			{ status: 400 }
		);
	}

	// In production, this would update the database
	// For now, we return a success response with the operation details
	return NextResponse.json({
		success: true,
		message: "Task updated successfully",
		data: {
			taskId,
			updates,
		},
		timestamp: new Date().toISOString(),
	});
}
