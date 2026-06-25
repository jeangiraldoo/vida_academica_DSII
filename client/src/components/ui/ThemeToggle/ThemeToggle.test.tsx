import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ThemeToggle from "./ThemeToggle";
import ThemeProvider from "@/context/ThemeProvider";

function renderToggle() {
	return render(
		<ThemeProvider>
			<ThemeToggle />
		</ThemeProvider>,
	);
}

describe("ThemeToggle", () => {
	beforeEach(() => {
		localStorage.clear();
		document.documentElement.removeAttribute("data-theme");
	});

	it("starts in dark mode by default", () => {
		renderToggle();
		const btn = screen.getByTestId("theme-toggle-btn");
		expect(btn).toHaveClass("tt--dark");
		expect(btn).toHaveAttribute("aria-label", "Activar modo claro");
	});

	it("toggles to light mode on click", () => {
		renderToggle();
		const btn = screen.getByTestId("theme-toggle-btn");
		fireEvent.click(btn);
		expect(btn).toHaveClass("tt--light");
		expect(btn).toHaveAttribute("aria-label", "Activar modo oscuro");
		expect(document.documentElement.getAttribute("data-theme")).toBe("light");
	});

	it("persists the chosen theme in localStorage", () => {
		renderToggle();
		fireEvent.click(screen.getByTestId("theme-toggle-btn"));
		expect(localStorage.getItem("luma_theme")).toBe("light");
	});

	it("reads the initial theme from localStorage", () => {
		localStorage.setItem("luma_theme", "light");
		renderToggle();
		expect(screen.getByTestId("theme-toggle-btn")).toHaveClass("tt--light");
	});
});
