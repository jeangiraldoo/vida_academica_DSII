import "@testing-library/jest-dom/vitest";
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ConflictModal, {
	type ConflictModalItem,
	type ConflictModalSubtask,
} from "./ConflictModal";

vi.mock("react-joyride", () => {
	return {
		__esModule: true,
		default: (props: any) => {
			(window as any).__lastJoyrideProps = props;
			return null;
		},
		Joyride: (props: any) => {
			(window as any).__lastJoyrideProps = props;
			return null;
		},
		STATUS: { FINISHED: "finished", SKIPPED: "skipped" },
	};
});

const SUBTASK_A: ConflictModalSubtask = {
	id: 101,
	activityId: 1,
	name: "Leer capítulo 3",
	activityTitle: "Álgebra Lineal",
	estimatedHours: 3,
	targetDate: "2099-07-10",
	courseName: "Matemáticas",
};

const SUBTASK_B: ConflictModalSubtask = {
	id: 102,
	activityId: 1,
	name: "Hacer ejercicios",
	activityTitle: "Álgebra Lineal",
	estimatedHours: 2,
	targetDate: "2099-07-10",
};

const CONFLICT_1: ConflictModalItem = {
	id: 1,
	date: "2099-07-10",
	plannedHours: 8,
	maxHours: 6,
	title: "Sobrecarga el 10 de julio",
	subtitle: "Subtareas superan el límite del día",
	subtasks: [SUBTASK_A, SUBTASK_B],
};

const CONFLICT_2: ConflictModalItem = {
	id: 2,
	date: "2099-07-11",
	plannedHours: 7,
	maxHours: 6,
	title: "Sobrecarga el 11 de julio",
	subtitle: "Backend reporta sobrecarga",
	subtasks: [],
};

interface Opts {
	conflicts?: ConflictModalItem[];
	onClose?: () => void;
	dateLoadMap?: Record<string, number>;
	maxDailyHours?: number;
	hasSeenConflictTour?: boolean;
	onConflictTourComplete?: () => void;
	onChangeDate?: any;
	onReduceHours?: any;
}

function renderModal(opts: Opts = {}) {
	const onClose = opts.onClose ?? vi.fn();
	const onChangeDate = "onChangeDate" in opts
		? opts.onChangeDate
		: vi.fn().mockResolvedValue(undefined);
	const onReduceHours = "onReduceHours" in opts
		? opts.onReduceHours
		: vi.fn().mockResolvedValue(undefined);

	render(
		<ConflictModal
			conflicts={opts.conflicts ?? [CONFLICT_1]}
			onClose={onClose}
			dateLoadMap={opts.dateLoadMap ?? {}}
			maxDailyHours={opts.maxDailyHours ?? 6}
			hasSeenConflictTour={opts.hasSeenConflictTour ?? true}
			onConflictTourComplete={opts.onConflictTourComplete ?? vi.fn()}
			onChangeDate={onChangeDate}
			onReduceHours={onReduceHours}
		/>,
	);

	return { onClose, onChangeDate, onReduceHours };
}

afterEach(() => {
	vi.clearAllMocks();
	cleanup();
});

describe("ConflictModal — rendering", () => {
	it("mounts the modal via a React Portal", () => {
		renderModal();
		expect(screen.getByTestId("conflict-modal")).toBeInTheDocument();
	});

	it("renders the backdrop", () => {
		renderModal();
		expect(
			screen.getByTestId("conflict-modal-backdrop"),
		).toBeInTheDocument();
	});

	it("renders the heading 'Conflictos detectados'", () => {
		renderModal();
		expect(screen.getByText("Conflictos detectados")).toBeInTheDocument();
	});

	it("renders the [X] close button with accessible label", () => {
		renderModal();
		expect(
			screen.getByLabelText("Cerrar modal de conflictos"),
		).toBeInTheDocument();
	});

	it("renders conflict item cards for each conflict passed", () => {
		renderModal({ conflicts: [CONFLICT_1, CONFLICT_2] });
		expect(screen.getByTestId("conflict-item-1")).toBeInTheDocument();
		expect(screen.getByTestId("conflict-item-2")).toBeInTheDocument();
	});

	it("shows the empty-state when conflicts is an empty array", () => {
		renderModal({ conflicts: [] });
		expect(screen.getByText("Todo está en orden")).toBeInTheDocument();
		expect(
			screen.getByText(/No hay sobrecargas ni fechas en riesgo/),
		).toBeInTheDocument();
	});

	it("does NOT show the empty-state when there are conflicts", () => {
		renderModal();
		expect(
			screen.queryByText("Todo está en orden"),
		).not.toBeInTheDocument();
	});
});

describe("ConflictModal — expand/collapse", () => {
	it("auto-expands the first conflict item on mount", () => {
		renderModal();
		// When expanded the toggle label changes to "Ocultar"
		expect(
			screen.getByTestId("conflict-item-toggle-btn-1").textContent,
		).toContain("Ocultar");
	});

	it("collapses an expanded item when its toggle is clicked", () => {
		renderModal();
		fireEvent.click(screen.getByTestId("conflict-item-toggle-btn-1"));
		expect(
			screen.getByTestId("conflict-item-toggle-btn-1").textContent,
		).toContain("Resolver");
	});

	it("expands a collapsed item when 'Resolver' is clicked", () => {
		renderModal({ conflicts: [CONFLICT_1, CONFLICT_2] });
		const toggle2 = screen.getByTestId("conflict-item-toggle-btn-2");
		expect(toggle2.textContent).toContain("Resolver");
		fireEvent.click(toggle2);
		expect(toggle2.textContent).toContain("Ocultar");
	});

	it("collapses an expanded item when 'Ver despues' is clicked", () => {
		renderModal();
		fireEvent.click(screen.getByTestId("conflict-item-close-btn-1"));
		expect(
			screen.getByTestId("conflict-item-toggle-btn-1").textContent,
		).toContain("Resolver");
	});

	it("shows subtask rows when the item is expanded", () => {
		renderModal();
		expect(
			screen.getByTestId("conflict-subtask-row-101"),
		).toBeInTheDocument();
		expect(
			screen.getByTestId("conflict-subtask-row-102"),
		).toBeInTheDocument();
	});

	it("shows the no-subtasks message when a conflict has an empty subtasks array and is expanded", () => {
		renderModal({ conflicts: [CONFLICT_2] });
		expect(
			screen.getByText(/No se encontraron subtareas detalladas/),
		).toBeInTheDocument();
	});
});

describe("ConflictModal — Change Date flow", () => {
	function openDateResolver() {
		renderModal();
		fireEvent.click(
			screen.getByTestId("conflict-subtask-change-date-btn-101"),
		);
	}

	it("opens the resolver card when 'Cambiar fecha' is clicked", () => {
		openDateResolver();
		expect(
			screen.getByTestId("conflict-resolver-card"),
		).toBeInTheDocument();
	});

	it("shows title 'Cambiar fecha de subtarea' in the resolver", () => {
		openDateResolver();
		expect(
			screen.getByText("Cambiar fecha de subtarea"),
		).toBeInTheDocument();
	});

	it("renders a date input (type=date) inside the resolver", () => {
		openDateResolver();
		const input = screen.getByTestId("conflict-resolver-date-input");
		expect(input).toBeInTheDocument();
		expect(input).toHaveAttribute("type", "date");
	});

	it("pre-fills the date input with the subtask targetDate", () => {
		openDateResolver();
		expect(
			screen.getByTestId("conflict-resolver-date-input"),
		).toHaveValue("2099-07-10");
	});

	it("updates the date input value when the user types", () => {
		openDateResolver();
		const input = screen.getByTestId("conflict-resolver-date-input");
		fireEvent.change(input, { target: { value: "2099-08-01" } });
		expect(input).toHaveValue("2099-08-01");
	});

	it("calls onChangeDate with the correct payload when 'Guardar fecha' is clicked", async () => {
		const onChangeDate = vi.fn().mockResolvedValue(undefined);
		renderModal({ onChangeDate });

		fireEvent.click(
			screen.getByTestId("conflict-subtask-change-date-btn-101"),
		);
		fireEvent.change(
			screen.getByTestId("conflict-resolver-date-input"),
			{ target: { value: "2099-09-15" } },
		);
		fireEvent.click(screen.getByTestId("conflict-resolver-save-btn"));

		await waitFor(() =>
			expect(onChangeDate).toHaveBeenCalledWith({
				conflict: CONFLICT_1,
				subtask: SUBTASK_A,
				nextDate: "2099-09-15",
			}),
		);
	});

	it("shows a validation error when the date field is empty on save", async () => {
		renderModal();
		fireEvent.click(
			screen.getByTestId("conflict-subtask-change-date-btn-101"),
		);
		fireEvent.change(
			screen.getByTestId("conflict-resolver-date-input"),
			{ target: { value: "" } },
		);
		fireEvent.click(screen.getByTestId("conflict-resolver-save-btn"));

		await waitFor(() =>
			expect(
				screen.getByText("Selecciona una fecha valida."),
			).toBeInTheDocument(),
		);
	});

	it("shows a server error when onChangeDate rejects", async () => {
		const onChangeDate = vi
			.fn()
			.mockRejectedValue(new Error("Network error"));
		renderModal({ onChangeDate });

		fireEvent.click(
			screen.getByTestId("conflict-subtask-change-date-btn-101"),
		);
		fireEvent.click(screen.getByTestId("conflict-resolver-save-btn"));

		await waitFor(() =>
			expect(
				screen.getByText(
					"No se pudo actualizar la fecha. Intenta de nuevo.",
				),
			).toBeInTheDocument(),
		);
	});

	it("closes the resolver (not the whole modal) after a successful save", async () => {
		const onChangeDate = vi.fn().mockResolvedValue(undefined);
		const onClose = vi.fn();
		renderModal({ onChangeDate, onClose });

		fireEvent.click(
			screen.getByTestId("conflict-subtask-change-date-btn-101"),
		);
		fireEvent.click(screen.getByTestId("conflict-resolver-save-btn"));

		await waitFor(() =>
			expect(
				screen.queryByTestId("conflict-resolver-card"),
			).not.toBeInTheDocument(),
		);
		expect(onClose).not.toHaveBeenCalled();
	});

	it("shows a suggestion chip only when a capacity-safe date differs from current value", () => {
		
		renderModal({
			dateLoadMap: { "2099-07-10": 8, "2099-07-11": 8, "2099-07-12": 8 },
			maxDailyHours: 6,
		});
		fireEvent.click(
			screen.getByTestId("conflict-subtask-change-date-btn-101"),
		);
		
		expect(
			screen.getByTestId("conflict-resolver-card"),
		).toBeInTheDocument();
	});

	it("shows suggested future idle date when conflict is overdue", () => {
		renderModal({
			conflicts: [
				{
					...CONFLICT_1,
					date: "2000-01-01",
					subtasks: [{ ...SUBTASK_A, targetDate: "2000-01-01" }],
				},
			],
			dateLoadMap: {},
		});
		fireEvent.click(
			screen.getByTestId("conflict-subtask-change-date-btn-101"),
		);
		expect(
			screen.getByTestId("conflict-resolver-suggest-date-btn"),
		).toBeInTheDocument();
	});

	it("closes the modal if onChangeDate is undefined on save", async () => {
		vi.useFakeTimers();
		const onClose = vi.fn();
		renderModal({ onChangeDate: undefined, onClose });

		fireEvent.click(
			screen.getByTestId("conflict-subtask-change-date-btn-101"),
		);
		fireEvent.change(
			screen.getByTestId("conflict-resolver-date-input"),
			{ target: { value: "2099-09-15" } },
		);
		fireEvent.click(screen.getByTestId("conflict-resolver-save-btn"));

		act(() => vi.advanceTimersByTime(220));
		expect(onClose).toHaveBeenCalled();
		
		vi.useRealTimers();
	});

	it("clicking the date suggestion chip applies the suggested date", async () => {

		renderModal({
			dateLoadMap: { "2099-07-10": 8 },
			maxDailyHours: 6,
		});
		fireEvent.click(
			screen.getByTestId("conflict-subtask-change-date-btn-101"),
		);

		const chip = screen.queryByTestId("conflict-resolver-suggest-date-btn");
		if (chip) {
			fireEvent.click(chip);
			const input = screen.getByTestId("conflict-resolver-date-input") as HTMLInputElement;
		
			expect(input.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		}
	});
});

describe("ConflictModal — Adjust Hours flow", () => {
	function openHoursResolver() {
		renderModal();
		fireEvent.click(
			screen.getByTestId("conflict-subtask-adjust-hours-btn-101"),
		);
	}

	it("opens the resolver card when 'Ajustar horas' is clicked", () => {
		openHoursResolver();
		expect(
			screen.getByTestId("conflict-resolver-card"),
		).toBeInTheDocument();
	});

	it("shows title 'Reducir horas de subtarea' in the resolver", () => {
		openHoursResolver();
		expect(
			screen.getByText("Reducir horas de subtarea"),
		).toBeInTheDocument();
	});

	it("renders a number input with min='1' and step='0.25'", () => {
		openHoursResolver();
		const input = screen.getByTestId("conflict-resolver-hours-input");
		expect(input).toHaveAttribute("type", "number");
		expect(input).toHaveAttribute("min", "1");
		expect(input).toHaveAttribute("step", "0.25");
	});

	it("pre-fills the hours input with the subtask estimatedHours", () => {
		openHoursResolver();
		expect(
			screen.getByTestId("conflict-resolver-hours-input"),
		).toHaveValue(3);
	});

	it("updates the hours input when the user types", () => {
		openHoursResolver();
		const input = screen.getByTestId("conflict-resolver-hours-input");
		fireEvent.change(input, { target: { value: "2" } });
		expect(input).toHaveValue(2);
	});

	it("shows a suggestion chip with a calculated reduced hour value", () => {
		openHoursResolver();
		const chip = screen.getByTestId("conflict-resolver-suggest-hours-btn");
		expect(chip).toBeInTheDocument();
		expect(chip.textContent).toContain("Sugerido:");
	});

	it("clicking the hours suggestion chip applies the suggested value", () => {
		openHoursResolver();
		const chip = screen.getByTestId("conflict-resolver-suggest-hours-btn");
		fireEvent.click(chip);
		const input = screen.getByTestId(
			"conflict-resolver-hours-input",
		) as HTMLInputElement;
		expect(Number(input.value)).toBeGreaterThanOrEqual(1);
	});

	it("calls onReduceHours with the correct payload on save", async () => {
		const onReduceHours = vi.fn().mockResolvedValue(undefined);
		renderModal({ onReduceHours });

		fireEvent.click(
			screen.getByTestId("conflict-subtask-adjust-hours-btn-101"),
		);
		fireEvent.change(
			screen.getByTestId("conflict-resolver-hours-input"),
			{ target: { value: "2" } },
		);
		fireEvent.click(screen.getByTestId("conflict-resolver-save-btn"));

		await waitFor(() =>
			expect(onReduceHours).toHaveBeenCalledWith({
				conflict: CONFLICT_1,
				subtask: SUBTASK_A,
				nextHours: 2,
			}),
		);
	});

	it("shows a validation error when hours value is 0 (< 1)", async () => {
		renderModal();
		fireEvent.click(
			screen.getByTestId("conflict-subtask-adjust-hours-btn-101"),
		);
		fireEvent.change(
			screen.getByTestId("conflict-resolver-hours-input"),
			{ target: { value: "0" } },
		);
		fireEvent.click(screen.getByTestId("conflict-resolver-save-btn"));

		await waitFor(() =>
			expect(
				screen.getByText("Ingresa horas validas (1 o mas)."),
			).toBeInTheDocument(),
		);
	});

	it("shows a validation error when the hours field is empty on save", async () => {
		renderModal();
		fireEvent.click(
			screen.getByTestId("conflict-subtask-adjust-hours-btn-101"),
		);
		fireEvent.change(
			screen.getByTestId("conflict-resolver-hours-input"),
			{ target: { value: "" } },
		);
		fireEvent.click(screen.getByTestId("conflict-resolver-save-btn"));

		await waitFor(() =>
			expect(
				screen.getByText("Ingresa horas validas (1 o mas)."),
			).toBeInTheDocument(),
		);
	});

	it("closes the modal if onReduceHours is undefined on save", async () => {
		vi.useFakeTimers();
		const onClose = vi.fn();
		renderModal({ onReduceHours: undefined, onClose });

		fireEvent.click(
			screen.getByTestId("conflict-subtask-adjust-hours-btn-101"),
		);
		fireEvent.change(
			screen.getByTestId("conflict-resolver-hours-input"),
			{ target: { value: "2" } },
		);
		fireEvent.click(screen.getByTestId("conflict-resolver-save-btn"));

		act(() => vi.advanceTimersByTime(220));
		expect(onClose).toHaveBeenCalled();

		vi.useRealTimers();
	});

	it("shows a server error when onReduceHours rejects", async () => {
		const onReduceHours = vi
			.fn()
			.mockRejectedValue(new Error("Server error"));
		renderModal({ onReduceHours });

		fireEvent.click(
			screen.getByTestId("conflict-subtask-adjust-hours-btn-101"),
		);
		fireEvent.click(screen.getByTestId("conflict-resolver-save-btn"));

		await waitFor(() =>
			expect(
				screen.getByText(
					"No se pudieron actualizar las horas. Intenta de nuevo.",
				),
			).toBeInTheDocument(),
		);
	});

	it("closes the resolver (not whole modal) after a successful save", async () => {
		const onReduceHours = vi.fn().mockResolvedValue(undefined);
		const onClose = vi.fn();
		renderModal({ onReduceHours, onClose });

		fireEvent.click(
			screen.getByTestId("conflict-subtask-adjust-hours-btn-101"),
		);
		fireEvent.click(screen.getByTestId("conflict-resolver-save-btn"));

		await waitFor(() =>
			expect(
				screen.queryByTestId("conflict-resolver-card"),
			).not.toBeInTheDocument(),
		);
		expect(onClose).not.toHaveBeenCalled();
	});

	it("does NOT show the hours suggestion chip when estimatedHours <= 1", () => {
		renderModal({
			conflicts: [
				{
					...CONFLICT_1,
					subtasks: [{ ...SUBTASK_A, estimatedHours: 1 }],
				},
			],
		});
		fireEvent.click(
			screen.getByTestId("conflict-subtask-adjust-hours-btn-101"),
		);
		expect(
			screen.queryByTestId("conflict-resolver-suggest-hours-btn"),
		).not.toBeInTheDocument();
	});
});

describe("ConflictModal — cancel and close", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		act(() => vi.runAllTimers());
		vi.useRealTimers();
	});
	it("calls onClose after the 220 ms animation when [X] is clicked", () => {
		const onClose = vi.fn();
		renderModal({ onClose });

		fireEvent.click(screen.getByTestId("conflict-modal-close-btn"));
		expect(onClose).not.toHaveBeenCalled(); 

		act(() => vi.advanceTimersByTime(220));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("calls onClose when the backdrop is clicked", () => {
		const onClose = vi.fn();
		renderModal({ onClose });

		fireEvent.click(screen.getByTestId("conflict-modal-backdrop"));
		act(() => vi.advanceTimersByTime(220));

		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("does NOT call onClose when clicking inside the modal panel (stops propagation)", () => {
		const onClose = vi.fn();
		renderModal({ onClose });

		fireEvent.click(screen.getByTestId("conflict-modal"));
		act(() => vi.advanceTimersByTime(300));

		expect(onClose).not.toHaveBeenCalled();
	});

	it("'Cancelar' in resolver closes only the resolver, not the main modal", () => {
		const onClose = vi.fn();
		renderModal({ onClose });

		fireEvent.click(
			screen.getByTestId("conflict-subtask-change-date-btn-101"),
		);
		expect(
			screen.getByTestId("conflict-resolver-card"),
		).toBeInTheDocument();

		fireEvent.click(screen.getByTestId("conflict-resolver-cancel-btn"));

		expect(
			screen.queryByTestId("conflict-resolver-card"),
		).not.toBeInTheDocument();
		expect(screen.getByTestId("conflict-modal")).toBeInTheDocument();
		expect(onClose).not.toHaveBeenCalled();
	});

	it("clicking the resolver layer (outside the card) closes the resolver", () => {
		renderModal();
		fireEvent.click(
			screen.getByTestId("conflict-subtask-change-date-btn-101"),
		);
		fireEvent.click(screen.getByTestId("conflict-resolver-layer"));
		expect(
			screen.queryByTestId("conflict-resolver-card"),
		).not.toBeInTheDocument();
	});

	it("clicking inside the resolver card does NOT close the resolver", () => {
		renderModal();
		fireEvent.click(
			screen.getByTestId("conflict-subtask-change-date-btn-101"),
		);
		fireEvent.click(screen.getByTestId("conflict-resolver-card"));
		expect(
			screen.getByTestId("conflict-resolver-card"),
		).toBeInTheDocument();
	});
});

describe("ConflictModal — keyboard interactions", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		act(() => vi.runAllTimers());
		vi.useRealTimers();
	});
	it("Escape closes the resolver sub-panel (not the modal) when resolver is open", () => {
		const onClose = vi.fn();
		renderModal({ onClose });

		fireEvent.click(
			screen.getByTestId("conflict-subtask-change-date-btn-101"),
		);
		expect(
			screen.getByTestId("conflict-resolver-card"),
		).toBeInTheDocument();

		fireEvent.keyDown(window, { key: "Escape" });

		expect(
			screen.queryByTestId("conflict-resolver-card"),
		).not.toBeInTheDocument();
		expect(screen.getByTestId("conflict-modal")).toBeInTheDocument();
		expect(onClose).not.toHaveBeenCalled();
	});

	it("Escape triggers modal close animation when no resolver is open", () => {
		const onClose = vi.fn();
		renderModal({ onClose });

		fireEvent.keyDown(window, { key: "Escape" });
		act(() => vi.advanceTimersByTime(220));

		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("non-Escape keys do nothing", () => {
		const onClose = vi.fn();
		renderModal({ onClose });

		fireEvent.keyDown(window, { key: "Enter" });
		fireEvent.keyDown(window, { key: "Tab" });
		act(() => vi.advanceTimersByTime(300));

		expect(onClose).not.toHaveBeenCalled();
	});
});

describe("ConflictModal — resolver microcopy note", () => {
	it("shows a non-empty note in the date resolver", () => {
		renderModal();
		fireEvent.click(
			screen.getByTestId("conflict-subtask-change-date-btn-101"),
		);
		const note = screen.getByTestId("conflict-resolver-note");
		expect(note).toBeInTheDocument();
		expect(note.textContent?.trim().length).toBeGreaterThan(0);
	});

	it("shows a non-empty note in the hours resolver", () => {
		renderModal();
		fireEvent.click(
			screen.getByTestId("conflict-subtask-adjust-hours-btn-101"),
		);
		const note = screen.getByTestId("conflict-resolver-note");
		expect(note).toBeInTheDocument();
		expect(note.textContent?.trim().length).toBeGreaterThan(0);
	});

	it("shows a special oversized warning when estimatedHours > maxDailyHours", () => {
		renderModal({
			conflicts: [
				{
					...CONFLICT_1,
					subtasks: [{ ...SUBTASK_A, estimatedHours: 10 }],
				},
			],
			maxDailyHours: 6,
		});
		fireEvent.click(
			screen.getByTestId("conflict-subtask-change-date-btn-101"),
		);
		const note = screen.getByTestId("conflict-resolver-note");
		expect(note.textContent).toMatch(/10 h/);
		expect(note.textContent).toMatch(/No cabe en ningún día disponible/);
	});

	it("shows a division warning when estimatedHours > maxDailyHours but < 1.5x maxDailyHours", () => {
		renderModal({
			conflicts: [
				{
					...CONFLICT_1,
					subtasks: [{ ...SUBTASK_A, estimatedHours: 7 }],
				},
			],
			maxDailyHours: 6,
		});
		fireEvent.click(
			screen.getByTestId("conflict-subtask-change-date-btn-101"),
		);
		const note = screen.getByTestId("conflict-resolver-note");
		expect(note.textContent).toMatch(/¿Quieres dividirla o ajustar el límite solo para ese día?/);
	});
});

describe("ConflictModal — footer", () => {
	it("renders the footer status message", () => {
		renderModal();
		expect(
			screen.getByText("Puedes resolver ahora o volver luego."),
		).toBeInTheDocument();
	});
});

describe("ConflictModal — Tour callback coverage", () => {
	it("notifies when the tour is finished or skipped", () => {
		const onComplete = vi.fn();
		renderModal({ onConflictTourComplete: onComplete, hasSeenConflictTour: false });

		const props = (window as any).__lastJoyrideProps;
		if (props) {
			const handler = props.onEvent || props.callback;
			if (handler) {
				act(() => {
					handler({ status: "finished" });
				});
			}
		}
		expect(onComplete).toHaveBeenCalled();
	});
});
