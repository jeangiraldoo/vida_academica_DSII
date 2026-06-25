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

// ── Import del componente (después de los mocks) ──────────────────────────
import Login from "./Login";
import ThemeProvider from "@/context/ThemeProvider";

// ── Helper ────────────────────────────────────────────────────────────────
const onLoginSuccess = vi.fn();

function renderLogin() {
  return render(
    <ThemeProvider>
      <Login onLoginSuccess={onLoginSuccess} />
    </ThemeProvider>
  );
}

// ── Setup / teardown ──────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

// ─────────────────────────────────────────────────────────────────────────
describe("Login — estructura visual", () => {
  it("renderiza el contenedor principal y la tarjeta", () => {
    renderLogin();
    expect(screen.getByTestId("login-page")).toBeInTheDocument();
    expect(screen.getByTestId("login-card")).toBeInTheDocument();
  });

  it("renderiza el formulario con los campos de usuario y contraseña", () => {
    renderLogin();
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
    expect(screen.getByTestId("login-username-input")).toBeInTheDocument();
    expect(screen.getByTestId("login-password-input")).toBeInTheDocument();
  });

  it("renderiza el botón de submit con el texto correcto", () => {
    renderLogin();
    expect(screen.getByTestId("login-submit-btn")).toBeInTheDocument();
    expect(screen.getByText("Iniciar sesión")).toBeInTheDocument();
  });

  it("renderiza el switch de navegación entre formularios", () => {
    renderLogin();
    expect(screen.getByTestId("login-auth-switch")).toBeInTheDocument();
    expect(screen.getByTestId("login-go-register-btn")).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe("Login — toggle de contraseña", () => {
  it("el campo de contraseña inicia oculto (type=password)", () => {
    renderLogin();
    expect(screen.getByTestId("login-password-input")).toHaveAttribute("type", "password");
  });

  it("al hacer click en el toggle muestra la contraseña (type=text)", () => {
    renderLogin();
    fireEvent.click(screen.getByTestId("login-password-toggle-btn"));
    expect(screen.getByTestId("login-password-input")).toHaveAttribute("type", "text");
  });

  it("un segundo click vuelve a ocultar la contraseña", () => {
    renderLogin();
    const toggle = screen.getByTestId("login-password-toggle-btn");
    fireEvent.click(toggle);
    fireEvent.click(toggle);
    expect(screen.getByTestId("login-password-input")).toHaveAttribute("type", "password");
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe("Login — validación de campos vacíos", () => {
  it("muestra toast.error si ambos campos están vacíos al enviar", async () => {
    renderLogin();
    fireEvent.submit(screen.getByTestId("login-form"));
    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        "Por favor, completa todos los campos para continuar."
      );
    });
  });

  it("no llama a la API si el usuario está vacío", async () => {
    renderLogin();
    fireEvent.change(screen.getByTestId("login-password-input"), {
      target: { value: "secret123" },
    });
    fireEvent.submit(screen.getByTestId("login-form"));
    await waitFor(() => {
      expect(clientPostMock).not.toHaveBeenCalled();
    });
  });

  it("no llama a la API si la contraseña está vacía", async () => {
    renderLogin();
    fireEvent.change(screen.getByTestId("login-username-input"), {
      target: { value: "jean" },
    });
    fireEvent.submit(screen.getByTestId("login-form"));
    await waitFor(() => {
      expect(clientPostMock).not.toHaveBeenCalled();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe("Login — login exitoso", () => {
  it("llama a la API con identifier y password correctos", async () => {
    clientPostMock.mockResolvedValueOnce({
      data: { access: "token-access", refresh: "token-refresh" },
    });
    renderLogin();
    fireEvent.change(screen.getByTestId("login-username-input"), {
      target: { value: "jean" },
    });
    fireEvent.change(screen.getByTestId("login-password-input"), {
      target: { value: "superjean" },
    });
    fireEvent.submit(screen.getByTestId("login-form"));
    await waitFor(() => {
      expect(clientPostMock).toHaveBeenCalledWith("/api/token/", {
        identifier: "jean",
        password: "superjean",
      });
    });
  });

  it("guarda los tokens tras un login exitoso", async () => {
    clientPostMock.mockResolvedValueOnce({
      data: { access: "token-access", refresh: "token-refresh" },
    });
    renderLogin();
    fireEvent.change(screen.getByTestId("login-username-input"), {
      target: { value: "jean" },
    });
    fireEvent.change(screen.getByTestId("login-password-input"), {
      target: { value: "superjean" },
    });
    fireEvent.submit(screen.getByTestId("login-form"));
    await waitFor(() => {
      expect(setAuthTokensMock).toHaveBeenCalledWith("token-access", "token-refresh");
    });
  });

  it("muestra toast de bienvenida tras un login exitoso", async () => {
    clientPostMock.mockResolvedValueOnce({
      data: { access: "token-access", refresh: "token-refresh" },
    });
    renderLogin();
    fireEvent.change(screen.getByTestId("login-username-input"), {
      target: { value: "jean" },
    });
    fireEvent.change(screen.getByTestId("login-password-input"), {
      target: { value: "superjean" },
    });
    fireEvent.submit(screen.getByTestId("login-form"));
    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalledWith("Bienvenido de nuevo.");
    });
  });

  it("invoca onLoginSuccess después del delay de animación", async () => {
    clientPostMock.mockResolvedValueOnce({
      data: { access: "token-access", refresh: "token-refresh" },
    });
    renderLogin();
    fireEvent.change(screen.getByTestId("login-username-input"), {
      target: { value: "jean" },
    });
    fireEvent.change(screen.getByTestId("login-password-input"), {
      target: { value: "superjean" },
    });
    fireEvent.submit(screen.getByTestId("login-form"));

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalled());

    // El componente usa setTimeout 700ms antes de llamar onLoginSuccess
    vi.advanceTimersByTime(700);
    expect(onLoginSuccess).toHaveBeenCalledWith("token-access");
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe("Login — errores de autenticación", () => {
  it("muestra error de credenciales inválidas en 401", async () => {
    clientPostMock.mockRejectedValueOnce({
      response: { status: 401 },
    });
    renderLogin();
    fireEvent.change(screen.getByTestId("login-username-input"), {
      target: { value: "usuario_falso" },
    });
    fireEvent.change(screen.getByTestId("login-password-input"), {
      target: { value: "clave_falsa" },
    });
    fireEvent.submit(screen.getByTestId("login-form"));
    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        "Usuario/correo o contraseña incorrectos."
      );
    });
  });

  it("muestra error de conexión ante un error de red", async () => {
    clientPostMock.mockRejectedValueOnce(new Error("Network Error"));
    renderLogin();
    fireEvent.change(screen.getByTestId("login-username-input"), {
      target: { value: "jean" },
    });
    fireEvent.change(screen.getByTestId("login-password-input"), {
      target: { value: "superjean" },
    });
    fireEvent.submit(screen.getByTestId("login-form"));
    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        "Error de conexión. Intenta más tarde."
      );
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe("Login — navegación", () => {
  it("navega a /registro al hacer click en 'Crear cuenta'", async () => {
    renderLogin();
    fireEvent.click(screen.getByTestId("login-go-register-btn"));
    vi.advanceTimersByTime(240);
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/registro");
    });
  });
});