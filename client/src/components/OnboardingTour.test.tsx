import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { User } from "@/api/dashboard";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OnboardingTour from "./OnboardingTour";

const locationMock = vi.hoisted(() => ({
	pathname: "/hoy",
}));

vi.mock("react-router-dom", () => ({
	useLocation: () => locationMock,
}));

vi.mock("../hooks/useTheme", () => ({
	useTheme: () => ({
		isDark: false,
	}),
}));

vi.mock("react-joyride", () => ({
	STATUS: {
		FINISHED: "finished",
		SKIPPED: "skipped",
	},
	Joyride: (props: {
		run: boolean;
		steps: unknown[];
		onEvent: (data: { status: string }) => void;
		locale: {
			next: string;
			back: string;
			close: string;
			last: string;
			skip: string;
		};
	}) => {
		return (
			<div data-testid="joyride-mock">
				<span data-testid="joyride-run">{String(props.run)}</span>
				<span data-testid="joyride-steps-count">{props.steps.length}</span>
				<span data-testid="joyride-next-label">{props.locale.next}</span>
				<button
					type="button"
					data-testid="finish-tour-btn"
					onClick={() => props.onEvent({ status: "finished" })}
				>
					Finish tour
				</button>
			</div>
		);
	},
}));

describe("OnboardingTour component", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		localStorage.clear();
		document.body.innerHTML = "";
		locationMock.pathname = "/hoy";
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("renders Joyride with the default initial state", () => {
		render(<OnboardingTour />);

		expect(screen.getByTestId("joyride-mock")).toBeInTheDocument();
		expect(screen.getByTestId("joyride-run")).toHaveTextContent("false");
		expect(screen.getByTestId("joyride-steps-count")).toHaveTextContent("0");
		expect(screen.getByTestId("joyride-next-label")).toHaveTextContent("Siguiente");
	});

	it("loads the main onboarding tour steps for the hoy route", async () => {
		render(<OnboardingTour />);

		await act(async () => {
			vi.advanceTimersByTime(250);
		});

		expect(screen.getByTestId("joyride-steps-count")).toHaveTextContent("8");
	});

	it("starts the organization onboarding tour with three steps", async () => {
		locationMock.pathname = "/organizacion";

		document.body.innerHTML = `
                        <div id="tour-org-add-subject"></div>
                        <div id="tour-org-add-activity"></div>
                        <div id="tour-org-filters"></div>
                `;

		render(<OnboardingTour />);

		await act(async () => {
			vi.advanceTimersByTime(250);
		});

		expect(screen.getByTestId("joyride-steps-count")).toHaveTextContent("3");
		expect(screen.getByTestId("joyride-run")).toHaveTextContent("true");
	});

	it("does not start the tour when the user has already seen it through the API", async () => {
		const user = {
			id: 10,
			onboarding: {
				has_seen_tour: true,
				has_seen_org_tour: false,
				has_seen_progress_tour: false,
			},
		} as User;

		render(<OnboardingTour user={user} />);

		await act(async () => {
			vi.advanceTimersByTime(250);
		});

		expect(screen.getByTestId("joyride-run")).toHaveTextContent("false");
		expect(screen.getByTestId("joyride-steps-count")).toHaveTextContent("0");
	});

	it("stores completion state and calls onTourComplete when the tour finishes", async () => {
		const onTourComplete = vi.fn();

		const user = {
			id: 7,
			onboarding: {},
		} as User;

		render(<OnboardingTour user={user} onTourComplete={onTourComplete} />);

		await act(async () => {
			vi.advanceTimersByTime(250);
		});

		fireEvent.click(screen.getByTestId("finish-tour-btn"));

		expect(localStorage.getItem("luma_has_seen_tour_user_7")).toBe("true");
		expect(onTourComplete).toHaveBeenCalledTimes(1);
		expect(onTourComplete).toHaveBeenCalledWith("has_seen_tour");
	});
});
