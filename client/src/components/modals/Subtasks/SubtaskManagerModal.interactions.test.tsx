import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchSubtasksMock = vi.hoisted(() => vi.fn());
const createSubtaskMock = vi.hoisted(() => vi.fn());
const deleteSubtaskMock = vi.hoisted(() => vi.fn());
const toastErrorMock = vi.hoisted(() => vi.fn());

vi.mock("@/api/dashboard", () => ({
	fetchSubtasks: fetchSubtasksMock,
	createSubtask: createSubtaskMock,
	deleteSubtask: deleteSubtaskMock,
}));

vi.mock("sonner", () => ({
	toast: { error: toastErrorMock, success: vi.fn() },
}));

import SubtaskManagerModal from "./SubtaskManagerModal";

function renderModal(props: Partial<React.ComponentProps<typeof SubtaskManagerModal>> = {}) {
	const onClose = props.onClose ?? vi.fn();
	render(
		<SubtaskManagerModal
			activityId={1}
			activityTitle="Mi actividad"
			open
			onClose={onClose}
			maxDailyHours={props.maxDailyHours ?? 0}
			dateLoadMap={props.dateLoadMap ?? {}}
			{...props}
		/>,
	);
	return { onClose };
}

beforeEach(() => {
	vi.clearAllMocks();
	fetchSubtasksMock.mockResolvedValue([]);
	createSubtaskMock.mockResolvedValue({ id: 1 });
	deleteSubtaskMock.mockResolvedValue(undefined);
});

afterEach(() => {
	cleanup();
});

describe("SubtaskManagerModal — capacidad y errores", () => {
	it("muestra el indicador de capacidad al elegir fecha y horas", () => {
		renderModal({ maxDailyHours: 4, dateLoadMap: { "2026-06-25": 3 } });
		fireEvent.change(screen.getByTestId("subtask-manager-modal--date-input"), {
			target: { value: "2026-06-25" },
		});
		fireEvent.change(screen.getByTestId("subtask-manager-modal--hours-input"), {
			target: { value: "2" },
		});
		expect(screen.getByTestId("subtask-manager-modal--capacity")).toBeInTheDocument();
	});

	it("muestra un error cuando la creación falla", async () => {
		createSubtaskMock.mockRejectedValue({ response: { status: 500 } });
		renderModal();
		fireEvent.change(screen.getByTestId("subtask-manager-modal--name-input"), {
			target: { value: "Nueva" },
		});
		fireEvent.change(screen.getByTestId("subtask-manager-modal--date-input"), {
			target: { value: "2026-06-25" },
		});
		fireEvent.change(screen.getByTestId("subtask-manager-modal--hours-input"), {
			target: { value: "1" },
		});
		fireEvent.submit(screen.getByTestId("subtask-manager-modal--form"));
		await waitFor(() => expect(toastErrorMock).toHaveBeenCalled());
	});

	it("muestra error de carga cuando fetchSubtasks falla", async () => {
		fetchSubtasksMock.mockRejectedValue(new Error("fail"));
		renderModal();
		await waitFor(() =>
			expect(toastErrorMock).toHaveBeenCalledWith("No se pudieron cargar las tareas."),
		);
	});
});
