import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const tokenValidRef = vi.hoisted(() => ({ current: false }));

vi.mock("@/api/auth", () => ({
	getAccessToken: () => "token",
	isTokenValid: () => tokenValidRef.current,
	clearAuthStorage: vi.fn(),
}));

vi.mock("@/api/client", () => ({
	default: { defaults: { headers: { common: {} as Record<string, string> } } },
}));

vi.mock("sonner", () => ({
	Toaster: () => null,
	toast: { success: vi.fn() },
}));

vi.mock("@/pages/Landing/Landing", () => ({ default: () => <div data-testid="landing-stub" /> }));
vi.mock("@/pages/Auth/Login/Login", () => ({ default: () => <div data-testid="login-stub" /> }));
vi.mock("@/pages/Auth/Register/Register", () => ({
	default: () => <div data-testid="register-stub" />,
}));
vi.mock("@/pages/Dashboard/Dashboard", () => ({
	default: () => <div data-testid="dashboard-stub" />,
}));

import App from "./App";

function renderAt(path: string) {
	return render(
		<MemoryRouter initialEntries={[path]}>
			<App />
		</MemoryRouter>,
	);
}

beforeEach(() => {
	tokenValidRef.current = false;
});

afterEach(() => {
	cleanup();
});

describe("App routing", () => {
	it("renderiza la landing en la raíz", () => {
		renderAt("/");
		expect(screen.getByTestId("landing-stub")).toBeInTheDocument();
	});

	it("muestra el login en /auth sin sesión", () => {
		renderAt("/auth");
		expect(screen.getByTestId("login-stub")).toBeInTheDocument();
	});

	it("muestra el registro en /registro", () => {
		renderAt("/registro");
		expect(screen.getByTestId("register-stub")).toBeInTheDocument();
	});

	it("redirige a /auth cuando se entra a una ruta protegida sin sesión", () => {
		renderAt("/hoy");
		expect(screen.getByTestId("login-stub")).toBeInTheDocument();
	});

	it("muestra el dashboard en una ruta protegida con sesión válida", () => {
		tokenValidRef.current = true;
		renderAt("/hoy");
		expect(screen.getByTestId("dashboard-stub")).toBeInTheDocument();
	});

	it("redirige a /hoy desde /auth cuando ya hay sesión válida", () => {
		tokenValidRef.current = true;
		renderAt("/auth");
		expect(screen.getByTestId("dashboard-stub")).toBeInTheDocument();
	});

	it("usa el fallback hacia la landing en rutas desconocidas", () => {
		renderAt("/ruta-inexistente");
		expect(screen.getByTestId("landing-stub")).toBeInTheDocument();
	});
});
