import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import type { Subtask } from "@/api/dashboard";
import { SubtaskDetailPanel } from "./SubtaskDetailPanel";

const sampleSubtask = {
	id: 42,
	name: "Repasar álgebra",
	status: "pending",
	estimated_hours: 3,
	target_date: "2026-06-25T10:00:00.000Z",
	activity: { id: 7, title: "Tarea semana 5" },
	course_name: "Cálculo I",
	ordering: 1,
	postponement_note: "",
	created_at: "2026-06-20T08:00:00.000Z",
	updated_at: "2026-06-21T09:00:00.000Z",
} as Subtask;

describe("SubtaskDetailPanel", () => {
	test("renders details and calls onClose when close button clicked", () => {
		const onClose = vi.fn();
		const onToggle = vi.fn();
		const onEdit = vi.fn(() => Promise.resolve());
		const onDelete = vi.fn(() => Promise.resolve());

		render(
			<SubtaskDetailPanel
				subtask={sampleSubtask}
				group={"today"}
				onClose={onClose}
				onToggle={onToggle}
				toggling={false}
				onEdit={onEdit}
				onDelete={onDelete}
			/>,
		);

		expect(screen.getByTestId("subtask-detail-title")).toHaveTextContent(sampleSubtask.name);
		expect(screen.getByTestId("subtask-detail-course")).toHaveTextContent(
			sampleSubtask.course_name,
		);
		expect(screen.getByTestId("subtask-detail-activity")).toHaveTextContent(
			sampleSubtask.activity.title,
		);
		expect(screen.getByTestId("subtask-detail-hours")).toHaveTextContent("3h");

		fireEvent.click(screen.getByTestId("subtask-detail-close-btn"));
		expect(onClose).toHaveBeenCalled();
	});

	test("toggle button calls onToggle with completed for pending subtask", () => {
		const onClose = vi.fn();
		const onToggle = vi.fn();
		const onEdit = vi.fn(() => Promise.resolve());
		const onDelete = vi.fn(() => Promise.resolve());

		render(
			<SubtaskDetailPanel
				subtask={sampleSubtask}
				group={"today"}
				onClose={onClose}
				onToggle={onToggle}
				toggling={false}
				onEdit={onEdit}
				onDelete={onDelete}
			/>,
		);

		const toggleBtn = screen.getByTestId("subtask-detail-toggle-status-btn");
		fireEvent.click(toggleBtn);
		expect(onToggle).toHaveBeenCalledWith("completed");
	});
});
