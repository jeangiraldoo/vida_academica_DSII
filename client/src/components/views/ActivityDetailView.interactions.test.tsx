import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Activity, Subtask } from "@/api/dashboard";

const navigateMock = vi.hoisted(() => vi.fn());
const paramsMock = vi.hoisted(() => ({ current: { id: "1" } as { id?: string } }));
const fetchSubtasksMock = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", () => ({
	useNavigate: () => navigateMock,
	useParams: () => paramsMock.current,
}));

vi.mock("@/api/dashboard", () => ({
	fetchSubtasks: fetchSubtasksMock,
}));

import ActivityDetailView from "./ActivityDetailView";
import ThemeProvider from "@/context/ThemeProvider";

function makeActivity(overrides: Partial<Activity> = {}): Activity {
	return {
		id: 1,
		user: 1,
		title: "Mi Tarea",
		course_name: "Matemáticas",
		description: "Una descripción",
		due_date: "2026-06-30",
		status: "completed",
		subtask_count: 0,
		total_estimated_hours: 5,
		...overrides,
	};
}

function makeSubtask(overrides: Partial<Subtask> = {}): Subtask {
	return {
		id: 1,
		name: "Subtarea",
		estimated_hours: 2,
		target_date: "2026-06-20",
		status: "completed",
		ordering: 0,
		created_at: "",
		updated_at: "",
		...overrides,
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	paramsMock.current = { id: "1" };
	fetchSubtasksMock.mockResolvedValue([makeSubtask()]);
	localStorage.clear();
});

afterEach(() => {
	cleanup();
});

describe("ActivityDetailView — modo claro", () => {
	it("renderiza la actividad y subtareas en modo claro", async () => {
		localStorage.setItem("luma_theme", "light");
		render(
			<ThemeProvider>
				<ActivityDetailView activities={[makeActivity()]} />
			</ThemeProvider>,
		);
		expect(screen.getByText("Mi Tarea")).toBeInTheDocument();
		expect(await screen.findByText("Subtarea")).toBeInTheDocument();
	});

	it("renderiza el estado de no encontrada en modo claro", () => {
		localStorage.setItem("luma_theme", "light");
		paramsMock.current = { id: "999" };
		render(
			<ThemeProvider>
				<ActivityDetailView activities={[]} />
			</ThemeProvider>,
		);
		expect(screen.getByText("Actividad no encontrada")).toBeInTheDocument();
	});
});
