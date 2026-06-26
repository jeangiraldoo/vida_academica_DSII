import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Subtask } from "@/api/dashboard";
import type { KanbanState } from "@/pages/Dashboard/utils/dashboardUtils";

// ── Mocks ─────────────────────────────────────────────────────────────────
const updateSubtaskMock = vi.hoisted(() => vi.fn());
const deleteSubtaskMock = vi.hoisted(() => vi.fn());

vi.mock("@/api/dashboard", () => ({
	fetchTodayView: vi
		.fn()
		.mockResolvedValue({ overdue: [], today: [], upcoming: [], postponed: [] }),
	updateSubtask: updateSubtaskMock,
	deleteSubtask: deleteSubtaskMock,
	createSubtask: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/api/auth", () => ({
	getAccessToken: () => "token",
}));

vi.mock("sonner", () => ({
	toast: { error: vi.fn(), success: vi.fn() },
}));

import TodayKanban from "./TodayView";
import ThemeProvider from "@/context/ThemeProvider";

function makeSubtask(overrides: Partial<Subtask> = {}): Subtask {
	return {
		id: 10,
		name: "Repasar álgebra",
		estimated_hours: 2,
		target_date: "2026-06-25",
		status: "pending",
		ordering: 1,
		created_at: "2026-06-20T00:00:00Z",
		updated_at: "2026-06-20T00:00:00Z",
		activity: { id: 1, title: "Tarea de cálculo" },
		course_name: "Cálculo",
		...overrides,
	};
}

function makeKanban(overrides: Partial<KanbanState> = {}): KanbanState {
	return { overdue: [], today: [makeSubtask()], upcoming: [], postponed: [], ...overrides };
}

function renderView(initialData: KanbanState | null = makeKanban()) {
	return render(
		<ThemeProvider>
			<TodayKanban
				initialData={initialData}
				onDataRefresh={vi.fn()}
				activities={[]}
				maxDailyHours={0}
				hasMore={false}
				loadingMore={false}
				onLoadMore={vi.fn().mockResolvedValue(undefined)}
			/>
		</ThemeProvider>,
	);
}

function renderViewLight(initialData: KanbanState | null = makeKanban()) {
	localStorage.setItem("luma_theme", "light");
	return renderView(initialData);
}

beforeEach(() => {
	vi.clearAllMocks();
	updateSubtaskMock.mockResolvedValue({});
	deleteSubtaskMock.mockResolvedValue(undefined);
});

afterEach(() => {
	cleanup();
});

describe("TodayKanban — múltiples grupos", () => {
	it("renderiza tareas en varios grupos y cambia de pestaña", () => {
		renderView(
			makeKanban({
				overdue: [makeSubtask({ id: 1, name: "Vencida" })],
				today: [makeSubtask({ id: 2, name: "De hoy" })],
				upcoming: [makeSubtask({ id: 3, name: "Próxima" })],
				postponed: [makeSubtask({ id: 4, name: "Pospuesta", status: "postponed" })],
			}),
		);
		expect(screen.getByTestId("today-subtask-card-1")).toBeInTheDocument();
		fireEvent.click(screen.getByTestId("today-tab-postponed"));
		expect(screen.getByTestId("today-subtask-card-4")).toBeInTheDocument();
	});
});

describe("TodayKanban — cambio de estado", () => {
	it("marca una subtarea como completada", () => {
		renderView();
		fireEvent.click(screen.getByTestId("today-subtask-status-btn-10"));
		fireEvent.click(screen.getByTestId("today-subtask-status-option-10-completed"));
		expect(updateSubtaskMock).toHaveBeenCalledWith(
			1,
			10,
			expect.objectContaining({ status: "completed" }),
		);
	});

	it("cambia el estado a en progreso", () => {
		renderView();
		fireEvent.click(screen.getByTestId("today-subtask-status-btn-10"));
		fireEvent.click(screen.getByTestId("today-subtask-status-option-10-in_progress"));
		expect(updateSubtaskMock).toHaveBeenCalledWith(
			1,
			10,
			expect.objectContaining({ status: "in_progress" }),
		);
	});

	it("entra en modo posponer sin actualizar todavía", () => {
		renderView();
		fireEvent.click(screen.getByTestId("today-subtask-status-btn-10"));
		fireEvent.click(screen.getByTestId("today-subtask-status-option-10-postponed"));
		expect(updateSubtaskMock).not.toHaveBeenCalled();
	});
});

describe("TodayKanban — panel de detalle", () => {
	it("abre el panel al hacer click en una tarjeta", () => {
		renderView();
		fireEvent.click(screen.getByTestId("today-subtask-card-10"));
		expect(screen.getByTestId("subtask-detail-panel")).toBeInTheDocument();
	});

	it("cierra el panel desde el botón de cerrar", () => {
		renderView();
		fireEvent.click(screen.getByTestId("today-subtask-card-10"));
		fireEvent.click(screen.getByTestId("subtask-detail-close-btn"));
		expect(screen.queryByTestId("subtask-detail-panel")).not.toBeInTheDocument();
	});
});

describe("TodayKanban — filtros", () => {
	it("filtra por estado", () => {
		renderView();
		fireEvent.click(screen.getByTestId("today-status-filter-btn"));
		const dropdown = screen.getByTestId("today-toolbar-select-dropdown");
		fireEvent.click(within(dropdown).getByTestId("today-status-filter-option-completed"));
		expect(screen.getByTestId("today-status-filter-btn")).toHaveTextContent("Completada");
	});

	it("limpia los filtros", () => {
		renderView();
		fireEvent.click(screen.getByTestId("today-status-filter-btn"));
		fireEvent.click(screen.getByTestId("today-status-filter-option-completed"));
		fireEvent.click(screen.getByTestId("today-clear-filters-btn"));
		expect(screen.getByTestId("today-status-filter-btn")).toHaveTextContent("Todos");
	});

	it("abre el filtro de curso y selecciona todos", () => {
		renderView();
		fireEvent.click(screen.getByTestId("today-course-filter-btn"));
		fireEvent.click(screen.getByTestId("today-course-filter-option-all"));
		expect(screen.getByTestId("today-course-filter-btn")).toHaveTextContent("Todos");
	});
});

describe("TodayKanban — posponer y panel", () => {
	it("confirma la posposición con una nota", () => {
		renderView();
		fireEvent.click(screen.getByTestId("today-subtask-status-btn-10"));
		fireEvent.click(screen.getByTestId("today-subtask-status-option-10-postponed"));
		fireEvent.change(screen.getByPlaceholderText("Ej: Falta de material..."), {
			target: { value: "Sin tiempo" },
		});
		fireEvent.click(screen.getByLabelText("Confirmar posposición"));
		expect(updateSubtaskMock).toHaveBeenCalledWith(
			1,
			10,
			expect.objectContaining({ status: "postponed" }),
		);
	});

	it("cambia el estado desde el botón del panel de detalle", () => {
		renderView();
		fireEvent.click(screen.getByTestId("today-subtask-card-10"));
		fireEvent.click(screen.getByTestId("subtask-detail-toggle-status-btn"));
		expect(updateSubtaskMock).toHaveBeenCalledWith(
			1,
			10,
			expect.objectContaining({ status: "completed" }),
		);
	});

	it("abre el paso de confirmación de borrado en el panel", () => {
		renderView();
		fireEvent.click(screen.getByTestId("today-subtask-card-10"));
		fireEvent.click(screen.getByTestId("subtask-detail-delete-btn"));
		expect(screen.getByTestId("subtask-detail-panel")).toBeInTheDocument();
	});
});

describe("TodayKanban — modo claro", () => {
	it("renderiza en modo claro (cubre ramas isDark falsas)", () => {
		renderViewLight(
			makeKanban({
				overdue: [makeSubtask({ id: 1, status: "in_progress" })],
				today: [makeSubtask({ id: 2, status: "completed" })],
			}),
		);
		expect(screen.getByTestId("today-toolbar")).toBeInTheDocument();
		expect(screen.getByTestId("today-subtask-card-1")).toBeInTheDocument();
	});
});
