import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Activity } from "@/api/dashboard";
import { SubjectFormModal, EditActivityForm } from "./OrgModals";
import ThemeProvider from "@/context/ThemeProvider";

function makeActivity(overrides: Partial<Activity> = {}): Activity {
	return {
		id: 7,
		user: 1,
		title: "Proyecto",
		course_name: "Redes",
		description: "Detalle",
		due_date: "2026-12-31",
		status: "pending",
		subtask_count: 0,
		total_estimated_hours: 3,
		...overrides,
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	localStorage.clear();
});

afterEach(() => {
	cleanup();
});

describe("OrgModals — modo claro y EditActivityForm", () => {
	it("renderiza SubjectFormModal en modo claro", () => {
		localStorage.setItem("luma_theme", "light");
		render(
			<ThemeProvider>
				<SubjectFormModal mode="add" onClose={vi.fn()} onConfirm={vi.fn()} />
			</ThemeProvider>,
		);
		expect(screen.getByTestId("subject-form-modal-add")).toBeInTheDocument();
	});

	it("confirma con Enter en SubjectFormModal", () => {
		const onConfirm = vi.fn();
		render(
			<ThemeProvider>
				<SubjectFormModal mode="add" onClose={vi.fn()} onConfirm={onConfirm} />
			</ThemeProvider>,
		);
		const input = screen.getByTestId("subject-form-input");
		fireEvent.change(input, { target: { value: "Química" } });
		fireEvent.keyDown(input, { key: "Enter" });
		expect(onConfirm).toHaveBeenCalledWith("Química");
	});

	it("renderiza EditActivityForm en modo claro y cambia estado/fecha", () => {
		localStorage.setItem("luma_theme", "light");
		const onSave = vi.fn().mockResolvedValue(undefined);
		render(
			<ThemeProvider>
				<EditActivityForm
					activity={makeActivity()}
					subjects={["Redes"]}
					maxDailyHours={4}
					dateLoadMap={{ "2026-12-31": 6 }}
					conflictDates={["2026-12-31"]}
					onClose={vi.fn()}
					onSave={onSave}
				/>
			</ThemeProvider>,
		);
		expect(screen.getByTestId("edit-activity-modal")).toBeInTheDocument();

		fireEvent.change(screen.getByTestId("edit-activity-status-select"), {
			target: { value: "completed" },
		});
		expect(screen.getByTestId("edit-activity-status-select")).toHaveValue("completed");

		fireEvent.change(screen.getByTestId("edit-activity-due-date-input"), {
			target: { value: "2026-12-31" },
		});
	});
});
