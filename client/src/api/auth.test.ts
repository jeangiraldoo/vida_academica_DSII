import { describe, it, expect, beforeEach } from "vitest";
import {
	getAccessToken,
	getRefreshToken,
	setAuthTokens,
	setAccessToken,
	isTokenValid,
	clearAuthStorage,
} from "./auth";

/** Builds a minimal JWT whose payload carries the given `exp` (seconds). */
function makeJwt(exp: number): string {
	const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
	const payload = btoa(JSON.stringify({ exp }));
	return `${header}.${payload}.signature`;
}

describe("auth token storage", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("returns null when no tokens are stored", () => {
		expect(getAccessToken()).toBeNull();
		expect(getRefreshToken()).toBeNull();
	});

	it("stores and reads access and refresh tokens", () => {
		setAuthTokens("access-123", "refresh-456");
		expect(getAccessToken()).toBe("access-123");
		expect(getRefreshToken()).toBe("refresh-456");
	});

	it("overwrites only the access token with setAccessToken", () => {
		setAuthTokens("access-123", "refresh-456");
		setAccessToken("access-789");
		expect(getAccessToken()).toBe("access-789");
		expect(getRefreshToken()).toBe("refresh-456");
	});

	it("clears stored tokens", () => {
		setAuthTokens("access-123", "refresh-456");
		clearAuthStorage();
		expect(getAccessToken()).toBeNull();
		expect(getRefreshToken()).toBeNull();
	});

	it("removes legacy token keys when storing", () => {
		localStorage.setItem("access_token", "legacy");
		localStorage.setItem("refresh_token", "legacy");
		setAuthTokens("access-123", "refresh-456");
		expect(localStorage.getItem("access_token")).toBeNull();
		expect(localStorage.getItem("refresh_token")).toBeNull();
	});
});

describe("isTokenValid", () => {
	it("returns false for null", () => {
		expect(isTokenValid(null)).toBe(false);
	});

	it("returns false for a malformed token", () => {
		expect(isTokenValid("not-a-jwt")).toBe(false);
	});

	it("returns false for an expired token", () => {
		const past = Math.floor(Date.now() / 1000) - 3600;
		expect(isTokenValid(makeJwt(past))).toBe(false);
	});

	it("returns true for a token that has not expired", () => {
		const future = Math.floor(Date.now() / 1000) + 3600;
		expect(isTokenValid(makeJwt(future))).toBe(true);
	});
});
