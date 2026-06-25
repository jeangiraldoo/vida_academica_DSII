import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Activity } from "@/api/dashboard";

// ── Mocks ─────────────────────────────────────────────────────────────────
const createSubtaskMock = vi.hoisted(() => vi.fn());
const fetchTodayViewMock = vi.hoisted(() => vi.fn());
const toastErrorMock = vi.hoisted(() => vi.fn());
const toastSuccessMock = vi.hoisted(() => vi.fn());

vi.mock("@/api/dashboard", () => ({
	createSubtask: createSubtaskMock,
	fetchTodayView: fetchTodayViewMock,
}));

vi.mock("sonner", () => ({
	toast: { error: toastErrorMock, success: toastSuccessMock },
}));

import { DeleteConfirmModal, CreateSubtaskModal } from "./SubtaskModals";
import ThemeProvider from "@/context/ThemeProvider";

function makeActivity(overrides: Partial<Activity> = {}): Activity {
	return {
		id: 1,
		user: 1,
		title: "Tarea de cálculo",
		course_name: "Cálculo",
		description: "",
		due_date: "2026-12-31",
		status: "pending",
		subtask_count: 0,
		total_estimated_hours: 0,
		...overrides,
	};
}

beforeEach(() => {
	vi.clearAllMocks();
});

afterEach(() => {
	cleanup();
});

describe("DeleteConfirmModal", () => {
	function renderModal(deleting = false) {
		const onConfirm = vi.fn();
		const onClose = vi.fn();
		render(
			<ThemeProvider>
				<DeleteConfirmModal
					subtaskName="Subtarea X"
					deleting={deleting}
					onConfirm={onConfirm}
					onClose={onClose}
				/>
			</ThemeProvider>,
		);
		return { onConfirm, onClose };
	}

	it("renderiza el modal de confirmación", () => {
		renderModal();
		expect(screen.getByTestId("delete-subtask-modal")).toBeInTheDocument();
	});

	it("confirma la eliminación", () => {
		const { onConfirm } = renderModal();
		fireEvent.click(screen.getByTestId("delete-subtask-confirm-btn"));
		expect(onConfirm).toHaveBeenCalled();
	});

	it("cancela con el botón cancelar", () => {
		const { onClose } = renderModal();
		fireEvent.click(screen.getByTestId("delete-subtask-cancel-btn"));
		expect(onClose).toHaveBeenCalled();
	});

	it("cierra al hacer click en el backdrop", () => {
		const { onClose } = renderModal();
		fireEvent.click(screen.getByTestId("delete-subtask-backdrop"));
		expect(onClose).toHaveBeenCalled();
	});
});

describe("CreateSubtaskModal", () => {
	function renderModal(activities: Activity[] = [makeActivity()]) {
		const onClose = vi.fn();
		const onCreated = vi.fn();
		render(
			<ThemeProvider>
				<CreateSubtaskModal activities={activities} onClose={onClose} onCreated={onCreated} />
			</ThemeProvider>,
		);
		return { onClose, onCreated };
	}

	function selectActivity(id: number) {
		fireEvent.click(screen.getByTestId("create-subtask-activity-btn"));
		fireEvent.click(screen.getByTestId(`create-subtask-activity-option-${id}`));
	}

	it("renderiza el modal", () => {
		renderModal();
		expect(screen.getByTestId("create-subtask-modal")).toBeInTheDocument();
	});

	it("exige seleccionar una actividad", () => {
		renderModal();
		fireEvent.click(screen.getByTestId("create-subtask-submit-btn"));
		expect(toastErrorMock).toHaveBeenCalledWith("Selecciona una actividad.");
		expect(createSubtaskMock).not.toHaveBeenCalled();
	});

	it("exige un nombre tras elegir la actividad", () => {
		renderModal();
		selectActivity(1);
		fireEvent.click(screen.getByTestId("create-subtask-submit-btn"));
		expect(toastErrorMock).toHaveBeenCalledWith("El nombre es obligatorio.");
	});

	it("crea la subtarea con datos válidos", async () => {
		createSubtaskMock.mockResolvedValue({ id: 50 });
		fetchTodayViewMock.mockResolvedValue({
			overdue: [],
			today: [],
			upcoming: [],
			postponed: [],
			meta: { n_days: 0, filters: { courseId: null, status: null } },
		});
		const { onCreated } = renderModal();

		selectActivity(1);
		fireEvent.change(screen.getByTestId("create-subtask-name-input"), {
			target: { value: "Leer apuntes" },
		});
		fireEvent.change(screen.getByTestId("create-subtask-date-input"), {
			target: { value: "2026-12-20" },
		});
		fireEvent.change(screen.getByTestId("create-subtask-hours-input"), {
			target: { value: "3" },
		});
		fireEvent.click(screen.getByTestId("create-subtask-submit-btn"));

		await waitFor(() => {
			expect(createSubtaskMock).toHaveBeenCalledWith(1, {
				name: "Leer apuntes",
				estimated_hours: 3,
				target_date: "2026-12-20",
				status: "pending",
				ordering: 1,
			});
		});
		await waitFor(() => expect(onCreated).toHaveBeenCalled());
	});
});
