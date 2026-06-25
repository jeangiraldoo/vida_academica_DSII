import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", () => ({
	useNavigate: () => navigateMock,
}));

import ComingSoon from "./ComingSoon";

describe("ComingSoon component", () => {
	beforeEach(() => {
		navigateMock.mockClear();
	});

	afterEach(() => {
		cleanup();
	});

	it("renders the main coming soon page container and content section", () => {
		render(<ComingSoon />);

		expect(screen.getByTestId("coming-soon-page")).toBeInTheDocument();
		expect(screen.getByTestId("coming-soon-content")).toBeInTheDocument();
	});

	it("renders the main landing page information", () => {
		render(<ComingSoon />);

		expect(screen.getByText(/En construcci/i)).toBeInTheDocument();
		expect(screen.getByText(/Landing Page/i)).toBeInTheDocument();
		expect(screen.getByText(/Llegar/i)).toBeInTheDocument();
		expect(screen.getByText(/Estamos construyendo/i)).toBeInTheDocument();
		expect(screen.getByText(/plataforma estar/i)).toBeInTheDocument();
	});

	it("renders the login call to action correctly", () => {
		render(<ComingSoon />);

		expect(screen.getByText(/tienes una cuenta/i)).toBeInTheDocument();
		expect(screen.getByText(/Accede/i)).toBeInTheDocument();
		expect(screen.getByText(/ahora mismo/i)).toBeInTheDocument();
		expect(screen.getByTestId("coming-soon-login-btn")).toBeInTheDocument();
		expect(screen.getByText(/progreso siempre guardado/i)).toBeInTheDocument();
	});

	it("renders eighteen animated particles", () => {
		const { container } = render(<ComingSoon />);

		const particles = container.querySelectorAll(".cs-particle");

		expect(particles).toHaveLength(18);
	});

	it("navigates to the auth page when the login button is clicked", () => {
		render(<ComingSoon />);

		const loginButton = screen.getByTestId("coming-soon-login-btn");

		fireEvent.click(loginButton);

		expect(navigateMock).toHaveBeenCalledTimes(1);
		expect(navigateMock).toHaveBeenCalledWith("/auth");
	});
});
