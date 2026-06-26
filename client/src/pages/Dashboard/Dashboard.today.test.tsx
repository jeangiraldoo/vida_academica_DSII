import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigateMock = vi.hoisted(() => vi.fn());
const updateSubtaskMock = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", () => ({
	useNavigate: () => navigateMock,
	useLocation: () => ({ pathname: "/hoy" }),
	useParams: () => ({}),
	useSearchParams: () => [new URLSearchParams("")],
}));

vi.mock("@/api/auth", () => ({ getAccessToken: () => "token" }));

const fixtures = vi.hoisted(() => ({
	user: {
		id: 1,
		username: "santi",
		email: "s@x.com",
		name: "Santi",
		max_daily_hours: 8,
		date_joined: "2026-01-01",
		onboarding: {
			has_seen_tour: true,
			has_seen_org_tour: true,
			has_seen_progress_tour: true,
			has_seen_conflict_tour: true,
		},
	},
	subtask: {
		id: 50,
		name: "Estudiar capítulo 4",
		estimated_hours: 2,
		target_date: "2026-06-25",
		status: "pending",
		ordering: 1,
		created_at: "2026-06-20T00:00:00Z",
		updated_at: "2026-06-20T00:00:00Z",
		activity: { id: 1, title: "Tarea 1" },
		course_name: "Mate",
	},
}));

vi.mock("@/api/dashboard", () => ({
	fetchMe: vi.fn().mockResolvedValue(fixtures.user),
	updateMe: vi.fn().mockResolvedValue(fixtures.user),
	fetchActivities: vi.fn().mockResolvedValue([]),
	fetchTodayView: vi.fn().mockResolvedValue({
		overdue: [],
		today: [fixtures.subtask],
		upcoming: [],
		postponed: [],
		meta: { n_days: 0, filters: { courseId: null, status: null } },
	}),
	fetchConflicts: vi.fn().mockResolvedValue([]),
	fetchSubjects: vi.fn().mockResolvedValue(["Mate"]),
	fetchSubtasks: vi.fn().mockResolvedValue([]),
	createActivity: vi.fn().mockResolvedValue({}),
	deleteActivity: vi.fn().mockResolvedValue(undefined),
	updateActivity: vi.fn().mockResolvedValue({}),
	updateSubtask: updateSubtaskMock,
	deleteSubtask: vi.fn().mockResolvedValue(undefined),
	createSubject: vi.fn().mockResolvedValue({}),
	updateSubject: vi.fn().mockResolvedValue({}),
	deleteSubject: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("react-joyride", () => ({
	Joyride: () => null,
	STATUS: { FINISHED: "finished", SKIPPED: "skipped" },
}));

import Dashboard from "./Dashboard";
import ThemeProvider from "@/context/ThemeProvider";

async function renderLoaded() {
	render(
		<ThemeProvider>
			<Dashboard onLogout={vi.fn()} />
		</ThemeProvider>,
	);
	await waitFor(() => expect(screen.getByTestId("today-toolbar")).toBeInTheDocument());
}

beforeEach(() => {
	vi.clearAllMocks();
	updateSubtaskMock.mockResolvedValue({});
	localStorage.clear();
});

afterEach(() => {
	cleanup();
});

describe("Dashboard — vista de hoy con datos", () => {
	it("renderiza las subtareas del día", async () => {
		await renderLoaded();
		expect(screen.getByTestId("today-subtask-card-50")).toBeInTheDocument();
	});

	it("cambia el estado de una subtarea desde la vista de hoy", async () => {
		await renderLoaded();
		fireEvent.click(screen.getByTestId("today-subtask-status-btn-50"));
		fireEvent.click(screen.getByTestId("today-subtask-status-option-50-completed"));
		await waitFor(() =>
			expect(updateSubtaskMock).toHaveBeenCalledWith(
				1,
				50,
				expect.objectContaining({ status: "completed" }),
			),
		);
	});

	it("abre el panel de detalle de una subtarea", async () => {
		await renderLoaded();
		fireEvent.click(screen.getByTestId("today-subtask-card-50"));
		expect(screen.getByTestId("subtask-detail-panel")).toBeInTheDocument();
	});

	it("abre el modal de nueva subtarea desde la vista de hoy", async () => {
		await renderLoaded();
		fireEvent.click(screen.getByTestId("today-new-subtask-btn"));
		expect(screen.getByTestId("create-subtask-modal")).toBeInTheDocument();
	});
});
