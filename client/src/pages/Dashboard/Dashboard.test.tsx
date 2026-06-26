import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────
const navigateMock = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", () => ({
	useNavigate: () => navigateMock,
	useLocation: () => ({ pathname: "/hoy" }),
	useParams: () => ({}),
}));

vi.mock("@/api/auth", () => ({
	getAccessToken: () => null,
}));

vi.mock("@/api/dashboard", () => ({
	fetchMe: vi.fn().mockResolvedValue({ id: 1, username: "u", max_daily_hours: 0 }),
	updateMe: vi.fn().mockResolvedValue({}),
	fetchActivities: vi.fn().mockResolvedValue([]),
	fetchTodayView: vi
		.fn()
		.mockResolvedValue({ overdue: [], today: [], upcoming: [], postponed: [] }),
	fetchConflicts: vi.fn().mockResolvedValue([]),
	createActivity: vi.fn().mockResolvedValue({}),
	deleteActivity: vi.fn().mockResolvedValue(undefined),
	updateActivity: vi.fn().mockResolvedValue({}),
	updateSubtask: vi.fn().mockResolvedValue({}),
	fetchSubjects: vi.fn().mockResolvedValue([]),
	createSubject: vi.fn().mockResolvedValue({}),
	updateSubject: vi.fn().mockResolvedValue({}),
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

beforeEach(() => {
	vi.clearAllMocks();
});

afterEach(() => {
	cleanup();
});

describe("Dashboard", () => {
	it("renderiza el contenedor, la barra lateral y la navegación", () => {
		renderDashboard();
		expect(screen.getByTestId("dashboard-container")).toBeInTheDocument();
		expect(screen.getByTestId("dashboard-sidebar")).toBeInTheDocument();
		expect(screen.getByTestId("dashboard-nav")).toBeInTheDocument();
	});

	it("navega entre secciones desde la barra lateral", () => {
		renderDashboard();
		fireEvent.click(screen.getByTestId("dashboard-nav-org"));
		expect(navigateMock).toHaveBeenCalledWith("/organizacion");
		fireEvent.click(screen.getByTestId("dashboard-nav-progress"));
		expect(navigateMock).toHaveBeenCalledWith("/progreso");
	});

	it("llama a onLogout al cerrar sesión", () => {
		const { onLogout } = renderDashboard();
		fireEvent.click(screen.getByTestId("dashboard-logout-btn"));
		expect(onLogout).toHaveBeenCalled();
	});

	it("muestra el contenido principal", () => {
		renderDashboard();
		expect(screen.getByTestId("dashboard-main-content")).toBeInTheDocument();
	});
});
