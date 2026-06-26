import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Subtask } from "@/api/dashboard";
import type { KanbanState } from "@/pages/Dashboard/utils/dashboardUtils";

// ── Mocks ─────────────────────────────────────────────────────────────────
vi.mock("@/api/dashboard", () => ({
	fetchTodayView: vi.fn().mockResolvedValue({
		overdue: [],
		today: [],
		upcoming: [],
		postponed: [],
	}),
	updateSubtask: vi.fn().mockResolvedValue({}),
	deleteSubtask: vi.fn().mockResolvedValue(undefined),
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
	return {
		overdue: [],
		today: [makeSubtask()],
		upcoming: [],
		postponed: [],
		...overrides,
	};
}

function renderView(initialData: KanbanState | null = makeKanban()) {
	return render(
		<ThemeProvider>
			<TodayKanban
				initialData={initialData}
				onDataRefresh={vi.fn()}
				activities={[]}
				hasMore={false}
				loadingMore={false}
				onLoadMore={vi.fn().mockResolvedValue(undefined)}
			/>
		</ThemeProvider>,
	);
}

beforeEach(() => {
	vi.clearAllMocks();
});

afterEach(() => {
	cleanup();
});

describe("TodayKanban", () => {
	it("renderiza la barra de herramientas y las pestañas", () => {
		renderView();
		expect(screen.getByTestId("today-toolbar")).toBeInTheDocument();
		expect(screen.getByTestId("today-tabs")).toBeInTheDocument();
	});

	it("muestra las subtareas provistas en initialData", () => {
		renderView();
		expect(screen.getByTestId("today-subtask-card-10")).toBeInTheDocument();
		expect(screen.getByTestId("today-subtask-title-10")).toHaveTextContent("Repasar álgebra");
	});

	it("muestra el estado vacío al cambiar a una pestaña sin tareas", () => {
		renderView();
		fireEvent.click(screen.getByTestId("today-tab-upcoming"));
		expect(screen.getByTestId("today-empty-state-upcoming")).toBeInTheDocument();
	});

	it("abre el modal de nueva subtarea", () => {
		renderView();
		fireEvent.click(screen.getByTestId("today-new-subtask-btn"));
		expect(screen.getByTestId("create-subtask-modal")).toBeInTheDocument();
	});
});
