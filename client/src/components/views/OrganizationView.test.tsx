import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Activity } from "@/api/dashboard";

// ── Mocks ─────────────────────────────────────────────────────────────────
const navigateMock = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", () => ({
	useNavigate: () => navigateMock,
}));

vi.mock("@/api/dashboard", () => ({
	fetchSubtasks: vi.fn().mockResolvedValue([]),
	updateSubtask: vi.fn().mockResolvedValue({}),
}));

vi.mock("sonner", () => ({
	toast: { error: vi.fn(), success: vi.fn() },
}));

import OrganizationView from "./OrganizationView";
import ThemeProvider from "@/context/ThemeProvider";

function makeActivity(overrides: Partial<Activity> = {}): Activity {
	return {
		id: 1,
		user: 1,
		title: "Tarea 1",
		course_name: "Matemáticas",
		description: "",
		due_date: "2026-06-30",
		status: "pending",
		subtask_count: 0,
		total_estimated_hours: 4,
		...overrides,
	};
}

function renderView(props: Partial<React.ComponentProps<typeof OrganizationView>> = {}) {
	const handlers = {
		onDelete: vi.fn(),
		onAddSubject: vi.fn(),
		onRemoveSubject: vi.fn().mockResolvedValue(undefined),
		onRenameSubject: vi.fn().mockResolvedValue(undefined),
		onActivityUpdate: vi.fn(),
		onOpenCreate: vi.fn(),
		onLoadMore: vi.fn().mockResolvedValue(undefined),
	};
	const utils = render(
		<ThemeProvider>
			<OrganizationView
				activities={props.activities ?? [makeActivity()]}
				subjects={props.subjects ?? ["Matemáticas"]}
				onDelete={handlers.onDelete}
				onAddSubject={handlers.onAddSubject}
				onRemoveSubject={handlers.onRemoveSubject}
				onRenameSubject={handlers.onRenameSubject}
				onActivityUpdate={handlers.onActivityUpdate}
				onOpenCreate={handlers.onOpenCreate}
				activeFilters={props.activeFilters ?? []}
				searchQuery={props.searchQuery ?? ""}
				hasMore={props.hasMore ?? false}
				loadingMore={props.loadingMore ?? false}
				onLoadMore={handlers.onLoadMore}
			/>
		</ThemeProvider>,
	);
	return { ...handlers, ...utils };
}

beforeEach(() => {
	vi.clearAllMocks();
});

afterEach(() => {
	cleanup();
});

describe("OrganizationView — estado vacío", () => {
	it("muestra el estado vacío sin materias", () => {
		renderView({ subjects: [], activities: [] });
		expect(screen.getByTestId("org-empty-state")).toBeInTheDocument();
	});

	it("agrega una materia desde el estado vacío vía prompt", () => {
		const promptSpy = vi.spyOn(window, "prompt").mockReturnValue("Historia");
		const { onAddSubject } = renderView({ subjects: [], activities: [] });
		fireEvent.click(screen.getByTestId("org-empty-add-subject-btn"));
		expect(onAddSubject).toHaveBeenCalledWith("Historia");
		promptSpy.mockRestore();
	});
});

describe("OrganizationView — materias y actividades", () => {
	it("renderiza una tarjeta por materia", () => {
		renderView();
		expect(screen.getByTestId("org-view")).toBeInTheDocument();
		expect(screen.getByTestId("org-subject-card-matematicas")).toBeInTheDocument();
	});

	it("expande la materia y muestra sus actividades", () => {
		renderView({ activities: [makeActivity({ id: 5, title: "Ensayo" })] });
		fireEvent.click(screen.getByTestId("org-subject-header-matematicas"));
		expect(screen.getByTestId("org-subject-body-matematicas")).toBeInTheDocument();
		expect(screen.getByTestId("org-activity-card-5")).toBeInTheDocument();
	});

	it("navega a editar una actividad", () => {
		renderView({ activities: [makeActivity({ id: 5 })] });
		fireEvent.click(screen.getByTestId("org-subject-header-matematicas"));
		fireEvent.click(screen.getByTestId("org-activity-edit-btn-5"));
		expect(navigateMock).toHaveBeenCalledWith("/actividad/5/edit");
	});

	it("elimina una actividad", () => {
		const { onDelete } = renderView({ activities: [makeActivity({ id: 5, title: "Ensayo" })] });
		fireEvent.click(screen.getByTestId("org-subject-header-matematicas"));
		fireEvent.click(screen.getByTestId("org-activity-delete-btn-5"));
		expect(onDelete).toHaveBeenCalledWith(5, "Ensayo");
	});
});

describe("OrganizationView — modales de materia", () => {
	it("abre el modal de renombrar materia", () => {
		renderView();
		fireEvent.click(screen.getByTestId("org-subject-header-matematicas"));
		fireEvent.click(screen.getByTestId("org-subject-rename-btn-matematicas"));
		expect(screen.getByTestId("org-subject-form-layer")).toBeInTheDocument();
	});

	it("abre el modal de eliminar materia y confirma", () => {
		const { onRemoveSubject } = renderView();
		fireEvent.click(screen.getByTestId("org-subject-header-matematicas"));
		fireEvent.click(screen.getByTestId("org-subject-delete-btn-matematicas"));
		expect(screen.getByTestId("org-subject-delete-modal")).toBeInTheDocument();
		fireEvent.click(screen.getByTestId("org-subject-delete-confirm-btn"));
		expect(onRemoveSubject).toHaveBeenCalledWith("Matemáticas");
	});
});
