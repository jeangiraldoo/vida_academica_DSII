import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────
const navigateMock = vi.hoisted(() => vi.fn());
const updateMeMock = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", () => ({
	useNavigate: () => navigateMock,
	useLocation: () => ({ pathname: "/hoy" }),
	useParams: () => ({}),
}));

vi.mock("@/api/auth", () => ({
	getAccessToken: () => "token",
}));

const fixtures = vi.hoisted(() => {
	const user = {
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
	};
	const activity = {
		id: 1,
		user: 1,
		title: "Tarea 1",
		course_name: "Mate",
		description: "",
		due_date: "2026-12-31",
		status: "pending",
		subtask_count: 0,
		total_estimated_hours: 2,
	};
	return { user, activity };
});

vi.mock("@/api/dashboard", () => ({
	fetchMe: vi.fn().mockResolvedValue(fixtures.user),
	updateMe: updateMeMock.mockResolvedValue(fixtures.user),
	fetchActivities: vi.fn().mockResolvedValue([fixtures.activity]),
	fetchTodayView: vi.fn().mockResolvedValue({
		overdue: [],
		today: [],
		upcoming: [],
		postponed: [],
		meta: { n_days: 0, filters: { courseId: null, status: null } },
	}),
	fetchConflicts: vi.fn().mockResolvedValue([]),
	fetchSubjects: vi.fn().mockResolvedValue(["Mate"]),
	createActivity: vi.fn().mockResolvedValue(fixtures.activity),
	deleteActivity: vi.fn().mockResolvedValue(undefined),
	updateActivity: vi.fn().mockResolvedValue(fixtures.activity),
	updateSubtask: vi.fn().mockResolvedValue({}),
	createSubject: vi.fn().mockResolvedValue({ id: 1, name: "Mate", creation_date: "" }),
	updateSubject: vi.fn().mockResolvedValue({ id: 1, name: "Mate", creation_date: "" }),
	deleteSubject: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("sonner", () => ({
	toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("react-joyride", () => ({
	Joyride: () => null,
	STATUS: { FINISHED: "finished", SKIPPED: "skipped" },
}));

import Dashboard from "./Dashboard";
import ThemeProvider from "@/context/ThemeProvider";

function renderDashboard(onLogout = vi.fn()) {
	return {
		onLogout,
		...render(
			<ThemeProvider>
				<Dashboard onLogout={onLogout} />
			</ThemeProvider>,
		),
	};
}

async function renderLoaded(onLogout = vi.fn()) {
	const utils = renderDashboard(onLogout);
	await waitFor(() => expect(screen.getByTestId("dashboard-profile-menu-btn")).toBeInTheDocument());
	return utils;
}

beforeEach(() => {
	vi.clearAllMocks();
	updateMeMock.mockResolvedValue(fixtures.user);
	localStorage.clear();
});

afterEach(() => {
	cleanup();
});

describe("Dashboard — estado cargado", () => {
	it("carga los datos y muestra el perfil del usuario", async () => {
		await renderLoaded();
		expect(screen.getByTestId("dashboard-user-profile")).toBeInTheDocument();
	});

	it("abre el popover de capacidad y guarda", async () => {
		await renderLoaded();
		fireEvent.click(screen.getByTestId("dashboard-capacity-edit-btn"));
		expect(screen.getByTestId("dashboard-capacity-popover")).toBeInTheDocument();
		fireEvent.change(screen.getByTestId("dashboard-capacity-input"), { target: { value: "6" } });
		fireEvent.submit(screen.getByTestId("dashboard-capacity-form"));
		await waitFor(() => expect(updateMeMock).toHaveBeenCalled());
	});

	it("abre y cierra el panel de filtros", async () => {
		await renderLoaded();
		fireEvent.click(screen.getByTestId("dashboard-filters-btn"));
		expect(screen.getByTestId("dashboard-filters-panel")).toBeInTheDocument();
		fireEvent.click(screen.getByTestId("dashboard-filter-chip-urgency"));
		fireEvent.click(screen.getByTestId("dashboard-filters-close-btn"));
	});

	it("abre el buscador y escribe una consulta", async () => {
		await renderLoaded();
		fireEvent.click(screen.getByTestId("dashboard-search-btn"));
		fireEvent.change(screen.getByTestId("dashboard-search-input"), { target: { value: "tarea" } });
		expect(screen.getByTestId("dashboard-search-input")).toHaveValue("tarea");
	});

	it("abre el menú de perfil", async () => {
		await renderLoaded();
		fireEvent.click(screen.getByTestId("dashboard-profile-menu-btn"));
	});
});

describe("Dashboard — modo claro", () => {
	it("renderiza el dashboard en modo claro", async () => {
		localStorage.setItem("luma_theme", "light");
		await renderLoaded();
		expect(screen.getByTestId("dashboard-container")).toBeInTheDocument();
	});
});
