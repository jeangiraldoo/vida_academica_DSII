import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Activity } from "@/api/dashboard";

// ── Mocks ─────────────────────────────────────────────────────────────────
const navigateMock = vi.hoisted(() => vi.fn());
const paramsMock = vi.hoisted(() => ({ current: { id: "1" } as { id?: string } }));

vi.mock("react-router-dom", () => ({
	useNavigate: () => navigateMock,
	useParams: () => paramsMock.current,
}));

import EditActivityView from "./EditActivityView";
import ThemeProvider from "@/context/ThemeProvider";

function makeActivity(overrides: Partial<Activity> = {}): Activity {
	return {
		id: 1,
		user: 1,
		title: "Original",
		course_name: "Matemáticas",
		description: "Descripción original",
		due_date: "2026-06-30",
		status: "pending",
		subtask_count: 0,
		total_estimated_hours: 4,
		...overrides,
	};
}

function renderView(activities: Activity[], onSave = vi.fn().mockResolvedValue(undefined)) {
	return {
		onSave,
		...render(
			<ThemeProvider>
				<EditActivityView activities={activities} subjects={["Matemáticas"]} onSave={onSave} />
			</ThemeProvider>,
		),
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	paramsMock.current = { id: "1" };
});

afterEach(() => {
	cleanup();
});

describe("EditActivityView — no encontrada", () => {
	it("muestra el estado de no encontrada y permite volver", () => {
		paramsMock.current = { id: "999" };
		renderView([]);
		expect(screen.getByTestId("edit-activity-not-found")).toBeInTheDocument();
		fireEvent.click(screen.getByTestId("edit-activity-back-not-found-btn"));
		expect(navigateMock).toHaveBeenCalledWith("/organizacion");
	});
});

describe("EditActivityView — formulario", () => {
	it("pre-llena el formulario con los datos de la actividad", () => {
		renderView([makeActivity()]);
		expect(screen.getByTestId("edit-activity-title-input")).toHaveValue("Original");
		expect(screen.getByTestId("edit-activity-description-input")).toHaveValue(
			"Descripción original",
		);
		expect(screen.getByTestId("edit-activity-course-input")).toHaveValue("Matemáticas");
	});

	it("valida que el título sea obligatorio", () => {
		const { onSave } = renderView([makeActivity()]);
		fireEvent.change(screen.getByTestId("edit-activity-title-input"), {
			target: { value: "   " },
		});
		fireEvent.click(screen.getByTestId("edit-activity-save-btn"));
		expect(screen.getByText("El título es obligatorio")).toBeInTheDocument();
		expect(onSave).not.toHaveBeenCalled();
	});

	it("guarda los cambios y navega al detalle", async () => {
		const { onSave } = renderView([makeActivity()]);
		fireEvent.change(screen.getByTestId("edit-activity-title-input"), {
			target: { value: "Actualizado" },
		});
		fireEvent.click(screen.getByTestId("edit-activity-save-btn"));

		await waitFor(() => {
			expect(onSave).toHaveBeenCalledWith(1, {
				title: "Actualizado",
				description: "Descripción original",
				due_date: "2026-06-30",
				status: "pending",
				course_name: "Matemáticas",
			});
		});
		expect(navigateMock).toHaveBeenCalledWith("/actividad/1");
	});

	it("muestra un error si el guardado falla", async () => {
		const onSave = vi.fn().mockRejectedValue(new Error("fail"));
		renderView([makeActivity()], onSave);
		fireEvent.click(screen.getByTestId("edit-activity-save-btn"));

		await waitFor(() => {
			expect(screen.getByTestId("edit-activity-error")).toBeInTheDocument();
		});
	});

	it("actualiza el estado desde el select", () => {
		renderView([makeActivity()]);
		const select = screen.getByTestId("edit-activity-status-select");
		fireEvent.change(select, { target: { value: "completed" } });
		expect(select).toHaveValue("completed");
	});

	it("navega hacia atrás con el botón superior", () => {
		renderView([makeActivity()]);
		fireEvent.click(screen.getByTestId("edit-activity-back-nav-btn"));
		expect(navigateMock).toHaveBeenCalledWith(-1);
	});
});
