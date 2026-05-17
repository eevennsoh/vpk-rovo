import { Task, TaskTrigger, TaskContent, TaskItem } from "@/components/ui-custom/task";

export default function TaskDemo() {
	return (
		<Task defaultOpen>
			<TaskTrigger title="Search results" />
			<TaskContent>
				<TaskItem>Found 3 matching files</TaskItem>
				<TaskItem>Analyzed dependencies</TaskItem>
			</TaskContent>
		</Task>
	);
}
