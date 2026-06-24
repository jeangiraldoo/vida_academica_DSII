import "@testing-library/jest-dom";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Unmount React trees and clear storage between tests to avoid cross-test leakage.
afterEach(() => {
	cleanup();
	localStorage.clear();
});
