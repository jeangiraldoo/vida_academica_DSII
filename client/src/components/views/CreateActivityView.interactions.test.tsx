import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", () => ({
	useNavigate: () => navigateMock,
	useSearchParams: () => [new URLSearchParams("")],
}));

import CreateActivityView from "./CreateActivityView";

function fillStep1(subject: string, title: string, dueDate: string) {
	fireEvent.change(screen.getByTestId("create-activity-subject-input"), {
		target: { value: subject },
	});
	fireEvent.change(screen.getByTestId("create-activity-title-input"), { target: { value: title } });
	fireEvent.change(screen.getByTestId("create-activity-due-date-input"), {
		target: { value: dueDate },
	});
}

beforeEach(() => {
	vi.clearAllMocks();
	localStorage.clear();
});

afterEach(() => {
	cleanup();
});

describe("CreateActivityView — capacidad y modo claro", () => {
	it("muestra el indicador de capacidad/conflicto al elegir una fecha cargada", () => {
		render(
			<CreateActivityView
				onCreate={vi.fn().mockResolvedValue(undefined)}
				knownSubjects={["Mate"]}
				maxDailyHours={4}
				dateLoadMap={{ "2026-12-31": 6 }}
				conflictDates={["2026-12-31"]}
			/>,
		);
		fillStep1("Mate", "Tarea", "2026-12-31");
		// Capacity strip for the chosen date should be visible.
		expect(screen.getByText(/Capacidad para/i)).toBeInTheDocument();
	});

	it("renderiza en modo claro", () => {
		localStorage.setItem("luma_theme", "light");
		render(
			<CreateActivityView onCreate={vi.fn().mockResolvedValue(undefined)} knownSubjects={[]} />,
		);
		expect(screen.getByTestId("create-activity-view")).toBeInTheDocument();
	});

	it("añade una materia nueva desde la opción del combobox", () => {
		render(
			<CreateActivityView
				onCreate={vi.fn().mockResolvedValue(undefined)}
				knownSubjects={["Mate"]}
			/>,
		);
		fireEvent.change(screen.getByTestId("create-activity-subject-input"), {
			target: { value: "Historia" },
		});
		fireEvent.mouseDown(screen.getByTestId("create-activity-subject-add-option"));
		expect(screen.getByTestId("create-activity-subject-input")).toHaveValue("Historia");
	});
});
