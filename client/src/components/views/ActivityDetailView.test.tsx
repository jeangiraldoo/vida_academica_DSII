import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Activity, Subtask } from "@/api/dashboard";

// ── Mocks ─────────────────────────────────────────────────────────────────
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
		status: "pending",
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
		status: "pending",
		ordering: 0,
		created_at: "",
		updated_at: "",
		...overrides,
	};
}

function renderView(activities: Activity[]) {
	return render(
		<ThemeProvider>
			<ActivityDetailView activities={activities} />
		</ThemeProvider>,
	);
}

beforeEach(() => {
	vi.clearAllMocks();
	paramsMock.current = { id: "1" };
	fetchSubtasksMock.mockResolvedValue([]);
});

afterEach(() => {
	cleanup();
});

describe("ActivityDetailView — actividad no encontrada", () => {
	it("muestra el estado de no encontrada y permite volver", async () => {
		paramsMock.current = { id: "999" };
		renderView([]);

		expect(screen.getByText("Actividad no encontrada")).toBeInTheDocument();
		fireEvent.click(screen.getByText("Volver"));
		expect(navigateMock).toHaveBeenCalledWith("/organizacion");
	});
});

describe("ActivityDetailView — actividad encontrada", () => {
	it("muestra los datos principales de la actividad", () => {
		renderView([makeActivity()]);

		expect(screen.getByText("Mi Tarea")).toBeInTheDocument();
		expect(screen.getByText("Matemáticas")).toBeInTheDocument();
		expect(screen.getByText("Pendiente")).toBeInTheDocument();
		expect(screen.getByText("Una descripción")).toBeInTheDocument();
		expect(screen.getByText("30/06/2026")).toBeInTheDocument();
		expect(screen.getByText("5 hrs")).toBeInTheDocument();
	});

	it("usa textos por defecto cuando faltan materia y descripción", () => {
		renderView([makeActivity({ course_name: "", description: "" })]);
		expect(screen.getByText("Sin materia")).toBeInTheDocument();
		expect(
			screen.getByText("Esta actividad no tiene una descripción detallada."),
		).toBeInTheDocument();
	});

	it("muestra el estado completado", () => {
		renderView([makeActivity({ status: "completed" })]);
		expect(screen.getByText("Completado")).toBeInTheDocument();
	});

	it("renderiza las subtareas y el progreso tras cargarlas", async () => {
		fetchSubtasksMock.mockResolvedValue([
			makeSubtask({ id: 1, name: "Investigar", status: "completed", target_date: "2026-06-18" }),
			makeSubtask({ id: 2, name: "Redactar", status: "pending", target_date: "2026-06-22" }),
		]);
		renderView([makeActivity()]);

		expect(await screen.findByText("Investigar")).toBeInTheDocument();
		expect(screen.getByText("Redactar")).toBeInTheDocument();
		expect(screen.getByText("1 de 2 completadas")).toBeInTheDocument();
		expect(fetchSubtasksMock).toHaveBeenCalledWith(1);
	});

	it("muestra el estado vacío cuando no hay subtareas", async () => {
		fetchSubtasksMock.mockResolvedValue([]);
		renderView([makeActivity()]);

		expect(
			await screen.findByText("Esta actividad no tiene subtareas registradas."),
		).toBeInTheDocument();
	});

	it("navega a editar y a volver", () => {
		renderView([makeActivity({ id: 1 })]);

		fireEvent.click(screen.getByText("Editar detalles"));
		expect(navigateMock).toHaveBeenCalledWith("/actividad/1/edit");

		fireEvent.click(screen.getByText("Volver"));
		expect(navigateMock).toHaveBeenCalledWith("/organizacion");
	});
});
