import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Activity, Subtask } from "@/api/dashboard";

// ── Mocks ─────────────────────────────────────────────────────────────────
const navigateMock = vi.hoisted(() => vi.fn());
const fetchSubtasksMock = vi.hoisted(() => vi.fn());
const updateSubtaskMock = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", () => ({
	useNavigate: () => navigateMock,
}));

vi.mock("@/api/dashboard", () => ({
	fetchSubtasks: fetchSubtasksMock,
	updateSubtask: updateSubtaskMock,
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
		subtask_count: 1,
		total_estimated_hours: 4,
		...overrides,
	};
}

function makeSubtask(overrides: Partial<Subtask> = {}): Subtask {
	return {
		id: 100,
		name: "Subtarea A",
		estimated_hours: 2,
		target_date: "2026-06-25",
		status: "pending",
		ordering: 1,
		created_at: "",
		updated_at: "",
		...overrides,
	};
}

const handlers = () => ({
	onDelete: vi.fn(),
	onAddSubject: vi.fn(),
	onRemoveSubject: vi.fn().mockResolvedValue(undefined),
	onRenameSubject: vi.fn().mockResolvedValue(undefined),
	onActivityUpdate: vi.fn(),
	onOpenCreate: vi.fn(),
	onLoadMore: vi.fn().mockResolvedValue(undefined),
});

function renderView(
	opts: { light?: boolean; props?: Partial<React.ComponentProps<typeof OrganizationView>> } = {},
) {
	if (opts.light) localStorage.setItem("luma_theme", "light");
	const h = handlers();
	render(
		<ThemeProvider>
			<OrganizationView
				activities={opts.props?.activities ?? [makeActivity()]}
				subjects={["Matemáticas"]}
				onDelete={h.onDelete}
				onAddSubject={h.onAddSubject}
				onRemoveSubject={h.onRemoveSubject}
				onRenameSubject={h.onRenameSubject}
				onActivityUpdate={h.onActivityUpdate}
				onOpenCreate={h.onOpenCreate}
				activeFilters={[]}
				searchQuery=""
				hasMore={opts.props?.hasMore ?? false}
				loadingMore={false}
				onLoadMore={h.onLoadMore}
			/>
		</ThemeProvider>,
	);
	return h;
}

async function expandActivity() {
	fireEvent.click(screen.getByTestId("org-subject-header-matematicas"));
	fireEvent.click(screen.getByTestId("org-activity-subtasks-toggle-1"));
	await screen.findByTestId("org-subtask-row-100");
}

beforeEach(() => {
	vi.clearAllMocks();
	fetchSubtasksMock.mockResolvedValue([makeSubtask()]);
	updateSubtaskMock.mockResolvedValue({});
});

afterEach(() => {
	cleanup();
});

describe("OrganizationView — subtareas de una actividad", () => {
	it("carga las subtareas al expandir la actividad", async () => {
		renderView();
		await expandActivity();
		expect(screen.getByTestId("org-subtask-row-100")).toBeInTheDocument();
		expect(fetchSubtasksMock).toHaveBeenCalledWith(1);
	});

	it("alterna el estado de una subtarea", async () => {
		renderView();
		await expandActivity();
		fireEvent.click(screen.getByTestId("org-subtask-toggle-100"));
		expect(updateSubtaskMock).toHaveBeenCalled();
	});

	it("abre el dropdown de estado de subtarea y elige un valor", async () => {
		renderView();
		await expandActivity();
		fireEvent.click(screen.getByTestId("org-subtask-status-btn-100"));
		fireEvent.click(screen.getByTestId("org-subtask-status-option-100-completed"));
		expect(updateSubtaskMock).toHaveBeenCalled();
	});

	it("muestra el botón para agregar subtareas en la actividad expandida", async () => {
		renderView();
		await expandActivity();
		expect(screen.getByTestId("org-activity-add-subtask-btn-1")).toBeInTheDocument();
	});
});

describe("OrganizationView — crear actividad y modo claro", () => {
	it("invoca onOpenCreate desde el botón de agregar actividad", () => {
		const h = renderView();
		fireEvent.click(screen.getByTestId("org-subject-header-matematicas"));
		fireEvent.click(screen.getByTestId("org-subject-add-activity-btn-matematicas"));
		expect(h.onOpenCreate).toHaveBeenCalled();
	});

	it("renderiza en modo claro", () => {
		renderView({ light: true });
		expect(screen.getByTestId("org-view")).toBeInTheDocument();
	});
});
