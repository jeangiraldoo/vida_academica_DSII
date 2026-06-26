import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CreateActivityModal from "./CreateActivityModal";

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

describe("CreateActivityModal — capacidad y combobox", () => {
	it("muestra el indicador de capacidad al elegir una fecha cargada", () => {
		render(
			<CreateActivityModal
				open
				onClose={vi.fn()}
				onCreate={vi.fn().mockResolvedValue(undefined)}
				knownSubjects={["Mate"]}
				maxDailyHours={4}
				dateLoadMap={{ "2026-12-31": 6 }}
				conflictDates={["2026-12-31"]}
			/>,
		);
		fillStep1("Mate", "Tarea", "2026-12-31");
		expect(screen.getByText(/Capacidad para/i)).toBeInTheDocument();
	});

	it("añade una materia nueva desde la opción del combobox", () => {
		render(
			<CreateActivityModal
				open
				onClose={vi.fn()}
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

	it("usa la materia inicial provista", () => {
		render(
			<CreateActivityModal
				open
				initialSubject="Biología"
				onClose={vi.fn()}
				onCreate={vi.fn().mockResolvedValue(undefined)}
			/>,
		);
		expect(screen.getByTestId("create-activity-subject-input")).toHaveValue("Biología");
	});
});
