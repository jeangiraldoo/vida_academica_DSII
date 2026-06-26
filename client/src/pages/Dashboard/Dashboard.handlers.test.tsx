import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigateMock = vi.hoisted(() => vi.fn());
const deleteActivityMock = vi.hoisted(() => vi.fn());
const createSubjectMock = vi.hoisted(() => vi.fn());
const fetchConflictsMock = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", () => ({
	useNavigate: () => navigateMock,
	useLocation: () => ({ pathname: "/organizacion" }),
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
	activity: {
		id: 1,
		user: 1,
		title: "Tarea 1",
		course_name: "Mate",
		description: "",
		due_date: "2026-12-31",
		status: "pending",
		subtask_count: 0,
		total_estimated_hours: 2,
	},
}));

vi.mock("@/api/dashboard", () => ({
	fetchMe: vi.fn().mockResolvedValue(fixtures.user),
	updateMe: vi.fn().mockResolvedValue(fixtures.user),
	fetchActivities: vi.fn().mockResolvedValue([fixtures.activity]),
	fetchTodayView: vi.fn().mockResolvedValue({
		overdue: [],
		today: [],
		upcoming: [],
		postponed: [],
		meta: { n_days: 0, filters: { courseId: null, status: null } },
	}),
	fetchConflicts: fetchConflictsMock,
	fetchSubjects: vi.fn().mockResolvedValue(["Mate"]),
	fetchSubtasks: vi.fn().mockResolvedValue([]),
	createActivity: vi.fn().mockResolvedValue(fixtures.activity),
	deleteActivity: deleteActivityMock,
	updateActivity: vi.fn().mockResolvedValue(fixtures.activity),
	updateSubtask: vi.fn().mockResolvedValue({}),
	createSubject: createSubjectMock,
	updateSubject: vi.fn().mockResolvedValue({ id: 1, name: "Mate", creation_date: "" }),
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
	await waitFor(() => expect(screen.getByTestId("org-view")).toBeInTheDocument());
}

beforeEach(() => {
	vi.clearAllMocks();
	deleteActivityMock.mockResolvedValue(undefined);
	createSubjectMock.mockResolvedValue({ id: 2, name: "Historia", creation_date: "" });
	fetchConflictsMock.mockResolvedValue([]);
	localStorage.clear();
});

afterEach(() => {
	cleanup();
});

describe("Dashboard — handlers de organización", () => {
	it("elimina una actividad mediante el modal de confirmación", async () => {
		await renderLoaded();
		fireEvent.click(screen.getByTestId("org-subject-header-mate"));
		fireEvent.click(screen.getByTestId("org-activity-delete-btn-1"));
		expect(screen.getByTestId("dashboard-confirm-delete-modal")).toBeInTheDocument();
		fireEvent.click(screen.getByTestId("dashboard-confirm-delete-accept-btn"));
		await waitFor(() => expect(deleteActivityMock).toHaveBeenCalledWith(1));
	});

	it("cancela la eliminación de una actividad", async () => {
		await renderLoaded();
		fireEvent.click(screen.getByTestId("org-subject-header-mate"));
		fireEvent.click(screen.getByTestId("org-activity-delete-btn-1"));
		fireEvent.click(screen.getByTestId("dashboard-confirm-delete-cancel-btn"));
		expect(screen.queryByTestId("dashboard-confirm-delete-modal")).not.toBeInTheDocument();
	});

	it("agrega una materia desde el dashboard", async () => {
		await renderLoaded();
		fireEvent.click(screen.getByTestId("dashboard-add-subject-btn"));
		fireEvent.change(screen.getByTestId("subject-form-input"), {
			target: { value: "Historia" },
		});
		fireEvent.click(screen.getByTestId("subject-form-save-btn"));
		await waitFor(() => expect(createSubjectMock).toHaveBeenCalledWith("Historia"));
	});
});
