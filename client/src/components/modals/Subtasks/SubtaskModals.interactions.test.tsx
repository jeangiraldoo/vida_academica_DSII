import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Subtask } from "@/api/dashboard";

vi.mock("@/api/dashboard", () => ({
	createSubtask: vi.fn().mockResolvedValue({}),
	fetchTodayView: vi
		.fn()
		.mockResolvedValue({ overdue: [], today: [], upcoming: [], postponed: [] }),
}));

vi.mock("sonner", () => ({
	toast: { error: vi.fn(), success: vi.fn() },
}));

import { EditSubtaskModal, StatusPicker } from "./SubtaskModals";
import ThemeProvider from "@/context/ThemeProvider";

function makeSubtask(overrides: Partial<Subtask> = {}): Subtask {
	return {
		id: 100,
		name: "Subtarea A",
		estimated_hours: 2,
		target_date: "2026-06-25",
		status: "pending",
		ordering: 1,
		created_at: "",
		updated_at: "",
		...overrides,
	};
}

function renderEdit(
	overrides: Partial<React.ComponentProps<typeof EditSubtaskModal>> = {},
	light = false,
) {
	if (light) localStorage.setItem("luma_theme", "light");
	const props = {
		subtask: makeSubtask(),
		initialName: "Subtarea A",
		initialHours: "2",
		initialDate: "2026-06-25",
		initialStatus: "pending" as Subtask["status"],
		setName: vi.fn(),
		setHours: vi.fn(),
		setDate: vi.fn(),
		setStatus: vi.fn(),
		setPostponementNote: vi.fn(),
		saving: false,
		onSave: vi.fn(),
		onClose: vi.fn(),
		...overrides,
	};
	render(
		<ThemeProvider>
			<EditSubtaskModal {...props} />
		</ThemeProvider>,
	);
	return props;
}

beforeEach(() => {
	vi.clearAllMocks();
	localStorage.clear();
});

afterEach(() => {
	cleanup();
});

describe("EditSubtaskModal", () => {
	it("renderiza con los valores iniciales", () => {
		renderEdit();
		expect(screen.getByTestId("edit-subtask-modal")).toBeInTheDocument();
		expect(screen.getByTestId("edit-subtask-name-input")).toHaveValue("Subtarea A");
		expect(screen.getByTestId("edit-subtask-hours-input")).toHaveValue(2);
	});

	it("propaga los cambios de nombre, horas y fecha", () => {
		const props = renderEdit();
		fireEvent.change(screen.getByTestId("edit-subtask-name-input"), {
			target: { value: "Nuevo nombre" },
		});
		expect(props.setName).toHaveBeenCalledWith("Nuevo nombre");

		fireEvent.change(screen.getByTestId("edit-subtask-hours-input"), { target: { value: "5" } });
		expect(props.setHours).toHaveBeenCalledWith("5");

		fireEvent.change(screen.getByTestId("edit-subtask-date-input"), {
			target: { value: "2026-07-01" },
		});
		expect(props.setDate).toHaveBeenCalledWith("2026-07-01");
	});

	it("guarda con el botón de guardar", () => {
		const props = renderEdit();
		fireEvent.click(screen.getByTestId("edit-subtask-save-btn"));
		expect(props.onSave).toHaveBeenCalled();
	});

	it("cierra con el botón cancelar", () => {
		const props = renderEdit();
		fireEvent.click(screen.getByTestId("edit-subtask-cancel-btn"));
		expect(props.onClose).toHaveBeenCalled();
	});

	it("cierra con la tecla Escape", () => {
		const props = renderEdit();
		fireEvent.keyDown(window, { key: "Escape" });
		expect(props.onClose).toHaveBeenCalled();
	});

	it("muestra el campo de nota cuando el estado es pospuesto", () => {
		renderEdit({ initialStatus: "postponed" });
		expect(screen.getByTestId("edit-subtask-postponement-note-input")).toBeInTheDocument();
	});

	it("renderiza en modo claro", () => {
		renderEdit({}, true);
		expect(screen.getByTestId("edit-subtask-modal")).toBeInTheDocument();
	});
});

describe("StatusPicker", () => {
	it("selecciona un estado", () => {
		const onChange = vi.fn();
		render(
			<ThemeProvider>
				<StatusPicker value="pending" onChange={onChange} />
			</ThemeProvider>,
		);
		fireEvent.click(screen.getByTestId("status-picker--status-completed"));
		expect(onChange).toHaveBeenCalledWith("completed");
	});

	it("renderiza en modo claro", () => {
		localStorage.setItem("luma_theme", "light");
		render(
			<ThemeProvider>
				<StatusPicker value="in_progress" onChange={vi.fn()} />
			</ThemeProvider>,
		);
		expect(screen.getByTestId("status-picker--status-in_progress")).toBeInTheDocument();
	});
});
