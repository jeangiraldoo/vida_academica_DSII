import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks hoisted (deben ir antes de los imports del módulo) ──────────────
const navigateMock = vi.hoisted(() => vi.fn());
const toastErrorMock = vi.hoisted(() => vi.fn());
const toastSuccessMock = vi.hoisted(() => vi.fn());
const clientPostMock = vi.hoisted(() => vi.fn());
const setAuthTokensMock = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", () => ({
	useNavigate: () => navigateMock,
}));

vi.mock("sonner", () => ({
	toast: {
		error: toastErrorMock,
		success: toastSuccessMock,
	},
}));

vi.mock("@/api/client", () => ({
	default: {
		post: clientPostMock,
		defaults: { headers: { common: {} } },
	},
}));

vi.mock("@/api/auth", () => ({
	setAuthTokens: setAuthTokensMock,
}));

import Register from "./Register";
import ThemeProvider from "@/context/ThemeProvider";

function renderRegister() {
	return render(
		<ThemeProvider>
			<Register />
		</ThemeProvider>,
	);
}

function fillForm(values: {
	username?: string;
	email?: string;
	password?: string;
	confirm?: string;
}) {
	if (values.username !== undefined) {
		fireEvent.change(screen.getByTestId("register-username-input"), {
			target: { value: values.username },
		});
	}
	if (values.email !== undefined) {
		fireEvent.change(screen.getByTestId("register-email-input"), {
			target: { value: values.email },
		});
	}
	if (values.password !== undefined) {
		fireEvent.change(screen.getByTestId("register-password-input"), {
			target: { value: values.password },
		});
	}
	if (values.confirm !== undefined) {
		fireEvent.change(screen.getByTestId("register-confirm-password-input"), {
			target: { value: values.confirm },
		});
	}
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
	vi.useRealTimers();
	cleanup();
});

describe("Register — estructura visual", () => {
	it("renderiza la página, la tarjeta y el formulario", () => {
		renderRegister();
		expect(screen.getByTestId("register-page")).toBeInTheDocument();
		expect(screen.getByTestId("register-card")).toBeInTheDocument();
		expect(screen.getByTestId("register-form")).toBeInTheDocument();
	});

	it("renderiza los cuatro campos y el botón de submit", () => {
		renderRegister();
		expect(screen.getByTestId("register-username-input")).toBeInTheDocument();
		expect(screen.getByTestId("register-email-input")).toBeInTheDocument();
		expect(screen.getByTestId("register-password-input")).toBeInTheDocument();
		expect(screen.getByTestId("register-confirm-password-input")).toBeInTheDocument();
		expect(screen.getByTestId("register-submit-btn")).toBeInTheDocument();
	});
});

describe("Register — toggles de contraseña", () => {
	it("muestra y oculta la contraseña", () => {
		renderRegister();
		const input = screen.getByTestId("register-password-input");
		expect(input).toHaveAttribute("type", "password");
		fireEvent.click(screen.getByTestId("register-password-toggle-btn"));
		expect(input).toHaveAttribute("type", "text");
		fireEvent.click(screen.getByTestId("register-password-toggle-btn"));
		expect(input).toHaveAttribute("type", "password");
	});

	it("muestra y oculta la confirmación de contraseña", () => {
		renderRegister();
		const input = screen.getByTestId("register-confirm-password-input");
		expect(input).toHaveAttribute("type", "password");
		fireEvent.click(screen.getByTestId("register-confirm-password-toggle-btn"));
		expect(input).toHaveAttribute("type", "text");
	});
});

describe("Register — validación", () => {
	it("muestra error y no llama a la API si hay campos vacíos", async () => {
		renderRegister();
		fireEvent.submit(screen.getByTestId("register-form"));
		await waitFor(() => {
			expect(toastErrorMock).toHaveBeenCalledWith(
				"Por favor, completa todos los campos obligatorios.",
			);
		});
		expect(clientPostMock).not.toHaveBeenCalled();
	});

	it("muestra error si las contraseñas no coinciden", async () => {
		renderRegister();
		fillForm({ username: "jean", email: "j@x.com", password: "secret123", confirm: "other123" });
		fireEvent.submit(screen.getByTestId("register-form"));
		await waitFor(() => {
			expect(toastErrorMock).toHaveBeenCalledWith("Las contraseñas no coinciden.");
		});
		expect(clientPostMock).not.toHaveBeenCalled();
	});
});

describe("Register — registro exitoso", () => {
	function fillValid() {
		fillForm({ username: "jean", email: " j@x.com ", password: "secret123", confirm: "secret123" });
	}

	it("registra al usuario y hace auto-login", async () => {
		clientPostMock
			.mockResolvedValueOnce({ data: {} })
			.mockResolvedValueOnce({ data: { access: "acc", refresh: "ref" } });
		renderRegister();
		fillValid();
		fireEvent.submit(screen.getByTestId("register-form"));

		await waitFor(() => {
			expect(clientPostMock).toHaveBeenCalledWith("/register/", {
				username: "jean",
				email: "j@x.com",
				password: "secret123",
				password_confirm: "secret123",
			});
		});
		await waitFor(() => {
			expect(setAuthTokensMock).toHaveBeenCalledWith("acc", "ref");
		});
		expect(toastSuccessMock).toHaveBeenCalledWith("¡Cuenta creada! Ahora inicia sesión.");
	});

	it("navega a /auth tras el delay de éxito", async () => {
		clientPostMock
			.mockResolvedValueOnce({ data: {} })
			.mockResolvedValueOnce({ data: { access: "acc", refresh: "ref" } });
		renderRegister();
		fillValid();
		fireEvent.submit(screen.getByTestId("register-form"));

		await waitFor(() => expect(toastSuccessMock).toHaveBeenCalled());
		vi.advanceTimersByTime(700);
		expect(navigateMock).toHaveBeenCalledWith("/auth");
	});
});

describe("Register — manejo de errores", () => {
	it("muestra los mensajes del backend cuando el registro falla", async () => {
		clientPostMock.mockRejectedValueOnce({
			response: { data: { username: ["Ya existe ese usuario."] } },
		});
		renderRegister();
		fillForm({ username: "jean", email: "j@x.com", password: "secret123", confirm: "secret123" });
		fireEvent.submit(screen.getByTestId("register-form"));

		await waitFor(() => {
			expect(toastErrorMock).toHaveBeenCalledWith("Ya existe ese usuario.");
		});
	});

	it("muestra error de conexión ante un error de red", async () => {
		clientPostMock.mockRejectedValueOnce(new Error("Network Error"));
		renderRegister();
		fillForm({ username: "jean", email: "j@x.com", password: "secret123", confirm: "secret123" });
		fireEvent.submit(screen.getByTestId("register-form"));

		await waitFor(() => {
			expect(toastErrorMock).toHaveBeenCalledWith("Error de conexión. Intenta más tarde.");
		});
	});
});

describe("Register — navegación", () => {
	it("navega a /auth al cambiar a iniciar sesión", async () => {
		renderRegister();
		fireEvent.click(screen.getByTestId("register-go-login-btn"));
		vi.advanceTimersByTime(240);
		await waitFor(() => {
			expect(navigateMock).toHaveBeenCalledWith("/auth");
		});
	});
});
