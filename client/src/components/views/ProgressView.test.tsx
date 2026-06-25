import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import ProgressView from "./ProgressView";
import ThemeProvider from "@/context/ThemeProvider";
import type { Activity } from "@/api/dashboard";

function makeActivity(overrides: Partial<Activity> = {}): Activity {
	return {
		id: 1,
		user: 1,
		title: "Actividad",
		course_name: "Curso",
		description: "",
		due_date: "2026-06-30",
		status: "pending",
		subtask_count: 0,
		total_estimated_hours: 0,
		...overrides,
	};
}

function renderView(activities: Activity[], onOpenCreate?: () => void) {
	return render(
		<ThemeProvider>
			<ProgressView activities={activities} onOpenCreate={onOpenCreate} />
		</ThemeProvider>,
	);
}

describe("ProgressView", () => {
	it("shows the empty state and triggers onOpenCreate", () => {
		const onOpenCreate = vi.fn();
		renderView([], onOpenCreate);

		expect(screen.getByText("Aún no hay actividades")).toBeInTheDocument();
		const createBtn = screen.getByRole("button", { name: /Crear nueva actividad/i });
		// Exercise the hover style handlers.
		fireEvent.mouseEnter(createBtn);
		fireEvent.mouseLeave(createBtn);
		fireEvent.click(createBtn);
		expect(onOpenCreate).toHaveBeenCalledTimes(1);
	});

	it("computes the overall completion stats", () => {
		const activities = [
			makeActivity({ id: 1, total_subtasks_count: 4, completed_subtasks_count: 4 }),
			makeActivity({ id: 2, total_subtasks_count: 6, completed_subtasks_count: 2 }),
		];
		renderView(activities);

		// 6 of 10 subtasks done -> 60% donut
		expect(screen.getByText("60%")).toBeInTheDocument();
		// 1 of 2 activities fully completed
		expect(screen.getByText("1 de 2")).toBeInTheDocument();
		// 6 of 10 subtasks completed
		expect(screen.getByText("6 de 10")).toBeInTheDocument();
	});

	it("counts an explicitly completed activity with no subtasks", () => {
		renderView([makeActivity({ id: 1, status: "completed", total_subtasks_count: 0 })]);
		expect(screen.getByText("1 de 1")).toBeInTheDocument();
	});

	it("renders a row per activity with its title and progress", () => {
		renderView([
			makeActivity({
				id: 1,
				title: "Ensayo de Historia",
				total_subtasks_count: 4,
				completed_subtasks_count: 2,
			}),
		]);

		const row = screen.getByText("Ensayo de Historia").closest("div")!;
		expect(within(row).getByText("2 subtareas de 4")).toBeInTheDocument();
		expect(within(row).getByText("50%")).toBeInTheDocument();
	});

	it("falls back to subtask_count when totals are missing", () => {
		renderView([makeActivity({ id: 1, title: "Tarea X", subtask_count: 5 })]);
		expect(screen.getByText("0 subtareas de 5")).toBeInTheDocument();
	});

	it("paginates when there are more than ten activities", () => {
		const activities = Array.from({ length: 12 }, (_, i) =>
			makeActivity({ id: i + 1, title: `Actividad ${i + 1}` }),
		);
		renderView(activities);

		// Page 1 shows the first ten, not the eleventh.
		expect(screen.getByText("Actividad 1")).toBeInTheDocument();
		expect(screen.queryByText("Actividad 11")).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "2" }));

		// Page 2 now reveals the remaining activities.
		expect(screen.getByText("Actividad 11")).toBeInTheDocument();
	});
});
