import "@testing-library/jest-dom";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Depending on the jsdom/Node build, the environment's `localStorage` may be
// missing or only partially implemented (e.g. `clear` not being a function).
// Install a deterministic in-memory Storage so the suite behaves identically
// across machines and CI.
function createMemoryStorage(): Storage {
	const store = new Map<string, string>();
	return {
		get length() {
			return store.size;
		},
		clear() {
			store.clear();
		},
		getItem(key: string) {
			return store.has(key) ? (store.get(key) as string) : null;
		},
		key(index: number) {
			return Array.from(store.keys())[index] ?? null;
		},
		removeItem(key: string) {
			store.delete(key);
		},
		setItem(key: string, value: string) {
			store.set(key, String(value));
		},
	} as Storage;
}

Object.defineProperty(globalThis, "localStorage", {
	value: createMemoryStorage(),
	writable: true,
	configurable: true,
});

// Unmount React trees and clear storage between tests to avoid cross-test leakage.
afterEach(() => {
	cleanup();
	localStorage.clear();
});
