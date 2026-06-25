import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CreateActivityModal from "./CreateActivityModal";

function renderModal(props: Partial<React.ComponentProps<typeof CreateActivityModal>> = {}) {
	const onClose = props.onClose ?? vi.fn();
	const onCreate = props.onCreate ?? vi.fn().mockResolvedValue(undefined);
	return {
		onClose,
		onCreate,
		...render(
			<CreateActivityModal
				open={props.open ?? true}
				onClose={onClose}
				onCreate={onCreate}
				knownSubjects={props.knownSubjects ?? []}
			/>,
		),
	};
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
});

afterEach(() => {
	cleanup();
});

describe("CreateActivityModal — visibilidad", () => {
	it("no renderiza nada cuando open es false", () => {
		renderModal({ open: false });
		expect(screen.queryByTestId("create-activity-modal")).not.toBeInTheDocument();
	});

	it("renderiza el modal cuando open es true", () => {
		renderModal({ open: true });
		expect(screen.getByTestId("create-activity-modal")).toBeInTheDocument();
	});

	it("cierra con el botón de cerrar", () => {
		const { onClose } = renderModal();
		fireEvent.click(screen.getByTestId("create-activity-close-btn"));
		expect(onClose).toHaveBeenCalled();
	});
});

describe("CreateActivityModal — validación y combobox", () => {
	it("muestra errores al avanzar sin datos", () => {
		renderModal();
		fireEvent.click(screen.getByTestId("create-activity-next-btn"));
		expect(screen.getByText("La materia es obligatoria")).toBeInTheDocument();
		expect(screen.getByText("El título es obligatorio")).toBeInTheDocument();
	});

	it("selecciona una materia conocida desde el dropdown", () => {
		renderModal({ knownSubjects: ["Matemáticas", "Redes"] });
		fireEvent.change(screen.getByTestId("create-activity-subject-input"), {
			target: { value: "Mat" },
		});
		fireEvent.mouseDown(screen.getByTestId("create-activity-subject-option-0"));
		expect(screen.getByTestId("create-activity-subject-input")).toHaveValue("Matemáticas");
	});
});

describe("CreateActivityModal — subtareas y envío", () => {
	function goToStep2() {
		fillStep1("Matemáticas", "Tarea final", "2026-12-31");
		fireEvent.click(screen.getByTestId("create-activity-next-btn"));
	}

	it("agrega y elimina una subtarea en el paso 2", () => {
		renderModal();
		goToStep2();
		fireEvent.change(screen.getByTestId("create-activity-subtask-title-input"), {
			target: { value: "Leer capítulo" },
		});
		fireEvent.click(screen.getByTestId("create-activity-add-subtask-btn"));
		expect(screen.getByText("Leer capítulo")).toBeInTheDocument();

		fireEvent.click(screen.getByLabelText("Eliminar subtarea"));
		expect(screen.queryByText("Leer capítulo")).not.toBeInTheDocument();
	});

	it("envía la actividad y cierra el modal", async () => {
		const { onCreate, onClose } = renderModal();
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
		await waitFor(() => expect(onClose).toHaveBeenCalled());
	});
});
