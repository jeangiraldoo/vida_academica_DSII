import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Subtask } from "@/api/dashboard";

// ── Mocks ─────────────────────────────────────────────────────────────────
const fetchSubtasksMock = vi.hoisted(() => vi.fn());
const createSubtaskMock = vi.hoisted(() => vi.fn());
const deleteSubtaskMock = vi.hoisted(() => vi.fn());
const toastErrorMock = vi.hoisted(() => vi.fn());
const toastSuccessMock = vi.hoisted(() => vi.fn());

vi.mock("@/api/dashboard", () => ({
	fetchSubtasks: fetchSubtasksMock,
	createSubtask: createSubtaskMock,
	deleteSubtask: deleteSubtaskMock,
}));

vi.mock("sonner", () => ({
	toast: { error: toastErrorMock, success: toastSuccessMock },
}));

import SubtaskManagerModal from "./SubtaskManagerModal";

function makeSubtask(overrides: Partial<Subtask> = {}): Subtask {
	return {
		id: 5,
		name: "Existente",
		estimated_hours: 2,
		target_date: "2026-06-25",
		status: "pending",
		ordering: 1,
		created_at: "",
		updated_at: "",
		...overrides,
	};
}

function renderModal(props: Partial<React.ComponentProps<typeof SubtaskManagerModal>> = {}) {
	const onClose = props.onClose ?? vi.fn();
	return {
		onClose,
		...render(
			<SubtaskManagerModal
				activityId={props.activityId ?? 1}
				activityTitle={props.activityTitle ?? "Mi actividad"}
				open={props.open ?? true}
				onClose={onClose}
			/>,
		),
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	fetchSubtasksMock.mockResolvedValue([]);
});

afterEach(() => {
	cleanup();
});

describe("SubtaskManagerModal", () => {
	it("no renderiza nada cuando open es false", () => {
		renderModal({ open: false });
		expect(screen.queryByTestId("subtask-manager-modal")).not.toBeInTheDocument();
		expect(fetchSubtasksMock).not.toHaveBeenCalled();
	});

	it("carga y muestra las subtareas existentes al abrir", async () => {
		fetchSubtasksMock.mockResolvedValue([makeSubtask({ id: 5, name: "Existente" })]);
		renderModal();
		expect(await screen.findByText("Existente")).toBeInTheDocument();
		expect(fetchSubtasksMock).toHaveBeenCalledWith(1);
	});

	it("cierra con el botón de cerrar", () => {
		const { onClose } = renderModal();
		fireEvent.click(screen.getByTestId("subtask-manager-modal--close-btn"));
		expect(onClose).toHaveBeenCalled();
	});

	it("valida los campos antes de crear", async () => {
		renderModal();
		fireEvent.submit(screen.getByTestId("subtask-manager-modal--form"));
		await waitFor(() => {
			expect(toastErrorMock).toHaveBeenCalledWith("Por favor, completa los campos correctamente.");
		});
		expect(createSubtaskMock).not.toHaveBeenCalled();
	});

	it("crea una subtarea con datos válidos", async () => {
		createSubtaskMock.mockResolvedValue(makeSubtask({ id: 9, name: "Leer capítulo" }));
		renderModal();

		fireEvent.change(screen.getByTestId("subtask-manager-modal--name-input"), {
			target: { value: "Leer capítulo" },
		});
		fireEvent.change(screen.getByTestId("subtask-manager-modal--date-input"), {
			target: { value: "2026-06-25" },
		});
		fireEvent.change(screen.getByTestId("subtask-manager-modal--hours-input"), {
			target: { value: "2" },
		});
		fireEvent.submit(screen.getByTestId("subtask-manager-modal--form"));

		await waitFor(() => {
			expect(createSubtaskMock).toHaveBeenCalledWith(1, {
				name: "Leer capítulo",
				estimated_hours: 2,
				target_date: "2026-06-25",
				status: "pending",
				ordering: 1,
			});
		});
		expect(toastSuccessMock).toHaveBeenCalledWith("Tarea añadida al plan.");
	});

	it("elimina una subtarea existente", async () => {
		deleteSubtaskMock.mockResolvedValue(undefined);
		fetchSubtasksMock.mockResolvedValue([makeSubtask({ id: 5 })]);
		renderModal();

		await screen.findByText("Existente");
		fireEvent.click(screen.getByTestId("subtask-manager-modal--delete-btn-5"));

		await waitFor(() => {
			expect(deleteSubtaskMock).toHaveBeenCalledWith(1, 5);
		});
		expect(toastSuccessMock).toHaveBeenCalledWith("Tarea eliminada.");
	});
});
