import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Activity } from "@/api/dashboard";
import { SubjectFormModal, EditActivityForm } from "./OrgModals";
import ThemeProvider from "@/context/ThemeProvider";

function makeActivity(overrides: Partial<Activity> = {}): Activity {
	return {
		id: 7,
		user: 1,
		title: "Proyecto",
		course_name: "Redes",
		description: "Detalle",
		due_date: "2026-06-30",
		status: "pending",
		subtask_count: 0,
		total_estimated_hours: 3,
		...overrides,
	};
}

beforeEach(() => {
	vi.clearAllMocks();
});

afterEach(() => {
	cleanup();
});

describe("SubjectFormModal", () => {
	it("renderiza el modo agregar con input vacío", () => {
		render(
			<ThemeProvider>
				<SubjectFormModal mode="add" onClose={vi.fn()} onConfirm={vi.fn()} />
			</ThemeProvider>,
		);
		expect(screen.getByTestId("subject-form-modal-add")).toBeInTheDocument();
		expect(screen.getByTestId("subject-form-input")).toHaveValue("");
	});

	it("pre-llena el valor actual en modo renombrar", () => {
		render(
			<ThemeProvider>
				<SubjectFormModal mode="rename" current="Cálculo" onClose={vi.fn()} onConfirm={vi.fn()} />
			</ThemeProvider>,
		);
		expect(screen.getByTestId("subject-form-modal-rename")).toBeInTheDocument();
		expect(screen.getByTestId("subject-form-input")).toHaveValue("Cálculo");
	});

	it("confirma con el nombre ingresado", () => {
		const onConfirm = vi.fn();
		render(
			<ThemeProvider>
				<SubjectFormModal mode="add" onClose={vi.fn()} onConfirm={onConfirm} />
			</ThemeProvider>,
		);
		fireEvent.change(screen.getByTestId("subject-form-input"), { target: { value: "Física" } });
		fireEvent.click(screen.getByTestId("subject-form-save-btn"));
		expect(onConfirm).toHaveBeenCalledWith("Física");
	});

	it("no confirma con un nombre vacío", () => {
		const onConfirm = vi.fn();
		render(
			<ThemeProvider>
				<SubjectFormModal mode="add" onClose={vi.fn()} onConfirm={onConfirm} />
			</ThemeProvider>,
		);
		fireEvent.click(screen.getByTestId("subject-form-save-btn"));
		expect(onConfirm).not.toHaveBeenCalled();
	});

	it("cierra con el botón cancelar", () => {
		const onClose = vi.fn();
		render(
			<ThemeProvider>
				<SubjectFormModal mode="add" onClose={onClose} onConfirm={vi.fn()} />
			</ThemeProvider>,
		);
		fireEvent.click(screen.getByTestId("subject-form-cancel-btn"));
		expect(onClose).toHaveBeenCalled();
	});
});

describe("EditActivityForm", () => {
	function renderForm(onSave = vi.fn().mockResolvedValue(undefined), onClose = vi.fn()) {
		return {
			onSave,
			onClose,
			...render(
				<ThemeProvider>
					<EditActivityForm
						activity={makeActivity()}
						subjects={["Redes"]}
						onClose={onClose}
						onSave={onSave}
					/>
				</ThemeProvider>,
			),
		};
	}

	it("pre-llena el formulario con los datos de la actividad", () => {
		renderForm();
		expect(screen.getByTestId("edit-activity-modal")).toBeInTheDocument();
		expect(screen.getByTestId("edit-activity-title-input")).toHaveValue("Proyecto");
		expect(screen.getByTestId("edit-activity-course-input")).toHaveValue("Redes");
	});

	it("valida el título obligatorio", () => {
		const { onSave } = renderForm();
		fireEvent.change(screen.getByTestId("edit-activity-title-input"), {
			target: { value: "  " },
		});
		fireEvent.click(screen.getByTestId("edit-activity-save-btn"));
		expect(screen.getByText("El título es obligatorio.")).toBeInTheDocument();
		expect(onSave).not.toHaveBeenCalled();
	});

	it("guarda los cambios", async () => {
		const { onSave } = renderForm();
		fireEvent.change(screen.getByTestId("edit-activity-title-input"), {
			target: { value: "Proyecto final" },
		});
		fireEvent.click(screen.getByTestId("edit-activity-save-btn"));
		await waitFor(() => {
			expect(onSave).toHaveBeenCalledWith(7, {
				title: "Proyecto final",
				description: "Detalle",
				due_date: "2026-06-30",
				status: "pending",
				course_name: "Redes",
			});
		});
	});

	it("muestra un error cuando el guardado falla", async () => {
		const onSave = vi.fn().mockRejectedValue(new Error("fail"));
		renderForm(onSave);
		fireEvent.click(screen.getByTestId("edit-activity-save-btn"));
		await waitFor(() => {
			expect(screen.getByText("Error al guardar. Intenta de nuevo.")).toBeInTheDocument();
		});
	});

	it("cierra con el botón cancelar", () => {
		const { onClose } = renderForm();
		fireEvent.click(screen.getByTestId("edit-activity-cancel-btn"));
		expect(onClose).toHaveBeenCalled();
	});
});
