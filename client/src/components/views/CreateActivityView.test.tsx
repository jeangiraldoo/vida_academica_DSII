import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────
const navigateMock = vi.hoisted(() => vi.fn());
const searchParamsRef = vi.hoisted(() => ({ current: "" }));

vi.mock("react-router-dom", () => ({
	useNavigate: () => navigateMock,
	useSearchParams: () => [new URLSearchParams(searchParamsRef.current)],
}));

import CreateActivityView from "./CreateActivityView";

function renderView(onCreate = vi.fn().mockResolvedValue(undefined), knownSubjects: string[] = []) {
	return render(<CreateActivityView onCreate={onCreate} knownSubjects={knownSubjects} />);
}

function fillStep1(subject: string, title: string, dueDate: string) {
	fireEvent.change(screen.getByTestId("create-activity-subject-input"), {
		target: { value: subject },
	});
	fireEvent.change(screen.getByTestId("create-activity-title-input"), {
		target: { value: title },
	});
	fireEvent.change(screen.getByTestId("create-activity-due-date-input"), {
		target: { value: dueDate },
	});
}

beforeEach(() => {
	vi.clearAllMocks();
	searchParamsRef.current = "";
});

afterEach(() => {
	cleanup();
});

describe("CreateActivityView — render y navegación", () => {
	it("renderiza la vista y el campo de título", () => {
		renderView();
		expect(screen.getByTestId("create-activity-view")).toBeInTheDocument();
		expect(screen.getByTestId("create-activity-title-input")).toBeInTheDocument();
	});

	it("navega hacia atrás con el botón de la barra superior", () => {
		renderView();
		fireEvent.click(screen.getByTestId("create-activity-back-nav-btn"));
		expect(navigateMock).toHaveBeenCalledWith(-1);
	});

	it("siembra la materia inicial desde la URL", () => {
		searchParamsRef.current = "materia=Física";
		renderView();
		expect(screen.getByTestId("create-activity-subject-input")).toHaveValue("Física");
	});
});

describe("CreateActivityView — validación del paso 1", () => {
	it("muestra los errores al intentar avanzar sin datos", () => {
		renderView();
		fireEvent.click(screen.getByTestId("create-activity-next-btn"));
		expect(screen.getByText("La materia es obligatoria")).toBeInTheDocument();
		expect(screen.getByText("El título es obligatorio")).toBeInTheDocument();
		expect(screen.getByText("La fecha de entrega es obligatoria")).toBeInTheDocument();
	});

	it("rechaza una fecha de entrega en el pasado", () => {
		renderView();
		fillStep1("Mate", "Tarea", "2020-01-01");
		fireEvent.click(screen.getByTestId("create-activity-next-btn"));
		expect(screen.getByText("La fecha no puede ser en el pasado")).toBeInTheDocument();
	});
});

describe("CreateActivityView — combobox de materia", () => {
	it("abre el dropdown y selecciona una materia conocida", () => {
		renderView(vi.fn().mockResolvedValue(undefined), ["Matemáticas", "Redes"]);
		fireEvent.change(screen.getByTestId("create-activity-subject-input"), {
			target: { value: "Mat" },
		});
		fireEvent.mouseDown(screen.getByTestId("create-activity-subject-option-0"));
		expect(screen.getByTestId("create-activity-subject-input")).toHaveValue("Matemáticas");
	});
});

describe("CreateActivityView — subtareas (paso 2)", () => {
	function goToStep2() {
		fillStep1("Matemáticas", "Tarea final", "2026-12-31");
		fireEvent.click(screen.getByTestId("create-activity-next-btn"));
	}

	it("agrega y elimina una subtarea", () => {
		renderView();
		goToStep2();
		fireEvent.change(screen.getByTestId("create-activity-subtask-title-input"), {
			target: { value: "Investigar fuentes" },
		});
		fireEvent.click(screen.getByTestId("create-activity-add-subtask-btn"));
		expect(screen.getByText("Investigar fuentes")).toBeInTheDocument();

		const deleteBtn = screen.getByLabelText("Eliminar subtarea");
		fireEvent.click(deleteBtn);
		expect(screen.queryByText("Investigar fuentes")).not.toBeInTheDocument();
	});

	it("no agrega una subtarea sin nombre", () => {
		renderView();
		goToStep2();
		fireEvent.click(screen.getByTestId("create-activity-add-subtask-btn"));
		expect(screen.getByText("Ingresa un nombre para la subtarea")).toBeInTheDocument();
	});
});

describe("CreateActivityView — envío", () => {
	it("avanza al paso 2 y envía la actividad", async () => {
		const onCreate = vi.fn().mockResolvedValue(undefined);
		renderView(onCreate);

		fillStep1("Matemáticas", "Tarea final", "2026-12-31");
		fireEvent.click(screen.getByTestId("create-activity-next-btn"));

		fireEvent.click(screen.getByTestId("create-activity-submit-btn"));

		await waitFor(() => {
			expect(onCreate).toHaveBeenCalledWith({
				subject: "Matemáticas",
				title: "Tarea final",
				description: "",
				due_date: "2026-12-31",
				subtasks: [],
			});
		});
	});
});
