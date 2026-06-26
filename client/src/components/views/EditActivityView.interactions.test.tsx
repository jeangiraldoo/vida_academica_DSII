import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Activity } from "@/api/dashboard";

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
		description: "Desc",
		due_date: "2026-12-31",
		status: "pending",
		subtask_count: 0,
		total_estimated_hours: 4,
		...overrides,
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	paramsMock.current = { id: "1" };
	localStorage.clear();
});

afterEach(() => {
	cleanup();
});

describe("EditActivityView — modo claro y conflicto", () => {
	it("renderiza en modo claro con indicador de capacidad", () => {
		localStorage.setItem("luma_theme", "light");
		render(
			<ThemeProvider>
				<EditActivityView
					activities={[makeActivity()]}
					subjects={["Matemáticas"]}
					maxDailyHours={4}
					dateLoadMap={{ "2026-12-31": 6 }}
					conflictDates={["2026-12-31"]}
					onSave={vi.fn().mockResolvedValue(undefined)}
				/>
			</ThemeProvider>,
		);
		expect(screen.getByTestId("edit-activity-view")).toBeInTheDocument();
	});

	it("renderiza el estado de no encontrada en modo claro", () => {
		localStorage.setItem("luma_theme", "light");
		paramsMock.current = { id: "999" };
		render(
			<ThemeProvider>
				<EditActivityView
					activities={[]}
					subjects={[]}
					onSave={vi.fn().mockResolvedValue(undefined)}
				/>
			</ThemeProvider>,
		);
		expect(screen.getByTestId("edit-activity-not-found")).toBeInTheDocument();
	});
});
