import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Pagination from "./Pagination";

describe("Pagination", () => {
	it("renders nothing when there is a single page", () => {
		const { container } = render(
			<Pagination currentPage={1} totalPages={1} onPageChange={() => {}} />,
		);
		expect(container).toBeEmptyDOMElement();
	});

	it("renders a button per visible page", () => {
		render(<Pagination currentPage={1} totalPages={3} onPageChange={() => {}} />);
		expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();
	});

	it("marks the current page button as active", () => {
		render(<Pagination currentPage={2} totalPages={3} onPageChange={() => {}} />);
		expect(screen.getByRole("button", { name: "2" })).toHaveClass("active");
	});

	it("disables previous controls on the first page", () => {
		render(<Pagination currentPage={1} totalPages={3} onPageChange={() => {}} />);
		const buttons = screen.getAllByRole("button");
		// First two buttons are "first" and "previous".
		expect(buttons[0]).toBeDisabled();
		expect(buttons[1]).toBeDisabled();
	});

	it("calls onPageChange with the selected page number", () => {
		const onPageChange = vi.fn();
		render(<Pagination currentPage={1} totalPages={3} onPageChange={onPageChange} />);
		fireEvent.click(screen.getByRole("button", { name: "3" }));
		expect(onPageChange).toHaveBeenCalledWith(3);
	});

	it("navigates to the next page from the chevron control", () => {
		const onPageChange = vi.fn();
		render(<Pagination currentPage={2} totalPages={5} onPageChange={onPageChange} />);
		const buttons = screen.getAllByRole("button");
		// Last button is "last", second to last is "next".
		fireEvent.click(buttons[buttons.length - 2]);
		expect(onPageChange).toHaveBeenCalledWith(3);
	});
});
