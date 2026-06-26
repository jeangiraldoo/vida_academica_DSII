import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Subtask } from "@/api/dashboard";

vi.mock("@/api/dashboard", () => ({
	createSubtask: vi.fn().mockResolvedValue({}),
	fetchTodayView: vi
		.fn()
		.mockResolvedValue({ overdue: [], today: [], upcoming: [], postponed: [] }),
}));

vi.mock("sonner", () => ({
	toast: { error: vi.fn(), success: vi.fn() },
}));

import { SubtaskDetailPanel } from "./SubtaskDetailPanel";
import ThemeProvider from "@/context/ThemeProvider";

function makeSubtask(overrides: Partial<Subtask> = {}): Subtask {
	return {
		id: 10,
		name: "Repasar álgebra",
		estimated_hours: 2,
		target_date: "2026-06-25",
		status: "completed",
		ordering: 1,
		created_at: "2026-06-20T00:00:00Z",
		updated_at: "2026-06-21T00:00:00Z",
		activity: { id: 1, title: "Tarea de cálculo" },
		course_name: "Cálculo",
		...overrides,
	};
}

function renderPanel(overrides: Partial<React.ComponentProps<typeof SubtaskDetailPanel>> = {}) {
	const props = {
		subtask: makeSubtask(),
		group: "today" as const,
		onClose: vi.fn(),
		onToggle: vi.fn(),
		toggling: false,
		onEdit: vi.fn().mockResolvedValue(undefined),
		onDelete: vi.fn().mockResolvedValue(undefined),
		...overrides,
	};
	render(
		<ThemeProvider>
			<SubtaskDetailPanel {...props} />
		</ThemeProvider>,
	);
	return props;
}

beforeEach(() => {
	vi.clearAllMocks();
	localStorage.clear();
});

afterEach(() => {
	cleanup();
});

describe("SubtaskDetailPanel — interacciones", () => {
	it("renderiza el detalle en modo claro", () => {
		localStorage.setItem("luma_theme", "light");
		renderPanel();
		expect(screen.getByTestId("subtask-detail-panel")).toBeInTheDocument();
		expect(screen.getByTestId("subtask-detail-title")).toHaveTextContent("Repasar álgebra");
	});

	it("muestra la nota cuando la subtarea está pospuesta", () => {
		renderPanel({
			subtask: makeSubtask({ status: "postponed", postponement_note: "Sin tiempo" }),
		});
		expect(screen.getByText("Sin tiempo")).toBeInTheDocument();
	});

	it("alterna el estado", () => {
		const props = renderPanel();
		fireEvent.click(screen.getByTestId("subtask-detail-toggle-status-btn"));
		expect(props.onToggle).toHaveBeenCalled();
	});

	it("cierra desde el backdrop", () => {
		const props = renderPanel();
		fireEvent.click(screen.getByTestId("subtask-detail-backdrop"));
		expect(props.onClose).toHaveBeenCalled();
	});

	it("abre el modal de edición y guarda", async () => {
		const props = renderPanel();
		fireEvent.click(screen.getByTestId("subtask-detail-edit-btn"));
		expect(screen.getByTestId("edit-subtask-modal")).toBeInTheDocument();
		fireEvent.click(screen.getByTestId("edit-subtask-save-btn"));
		await waitFor(() => expect(props.onEdit).toHaveBeenCalled());
	});

	it("abre el modal de borrado y confirma", async () => {
		const props = renderPanel();
		fireEvent.click(screen.getByTestId("subtask-detail-delete-btn"));
		expect(screen.getByTestId("delete-subtask-modal")).toBeInTheDocument();
		fireEvent.click(screen.getByTestId("delete-subtask-confirm-btn"));
		await waitFor(() => expect(props.onDelete).toHaveBeenCalled());
	});
});
