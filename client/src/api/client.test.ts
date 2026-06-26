import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

type Handler = ((arg: unknown) => unknown) | null;
const reqHandlers = vi.hoisted(() => ({
	onFulfilled: null as Handler,
	onRejected: null as Handler,
}));
const resHandlers = vi.hoisted(() => ({
	onFulfilled: null as Handler,
	onRejected: null as Handler,
}));
const axiosPost = vi.hoisted(() => vi.fn());

vi.mock("axios", () => {
	const instance = {
		interceptors: {
			request: {
				use: (f: Handler, r: Handler) => {
					reqHandlers.onFulfilled = f;
					reqHandlers.onRejected = r;
				},
			},
			response: {
				use: (f: Handler, r: Handler) => {
					resHandlers.onFulfilled = f;
					resHandlers.onRejected = r;
				},
			},
		},
	};
	return { default: { create: () => instance, post: axiosPost } };
});

const getAccessTokenMock = vi.hoisted(() => vi.fn());
const getRefreshTokenMock = vi.hoisted(() => vi.fn());
const setAccessTokenMock = vi.hoisted(() => vi.fn());
const clearAuthStorageMock = vi.hoisted(() => vi.fn());

vi.mock("./auth", () => ({
	getAccessToken: getAccessTokenMock,
	getRefreshToken: getRefreshTokenMock,
	setAccessToken: setAccessTokenMock,
	clearAuthStorage: clearAuthStorageMock,
}));

// Importing registers the interceptors on the mocked instance.
import "./client";

const reqFulfilled = reqHandlers.onFulfilled as (c: unknown) => { headers: Record<string, string> };
const reqRejected = reqHandlers.onRejected as (e: unknown) => Promise<unknown>;
const resFulfilled = resHandlers.onFulfilled as (r: unknown) => unknown;
const resRejected = resHandlers.onRejected as (e: unknown) => Promise<unknown>;

beforeEach(() => {
	vi.clearAllMocks();
});

describe("client request interceptor", () => {
	it("adds the Bearer token when present", () => {
		(getAccessTokenMock as Mock).mockReturnValue("abc");
		const config = reqFulfilled({ headers: {} });
		expect(config.headers.Authorization).toBe("Bearer abc");
	});

	it("does not add a header when there is no token", () => {
		(getAccessTokenMock as Mock).mockReturnValue(null);
		const config = reqFulfilled({ headers: {} });
		expect(config.headers.Authorization).toBeUndefined();
	});

	it("rejects on request error", async () => {
		await expect(reqRejected(new Error("boom"))).rejects.toThrow("boom");
	});
});

describe("client response interceptor", () => {
	it("returns the response unchanged on success", () => {
		const response = { data: 1 };
		expect(resFulfilled(response)).toBe(response);
	});

	it("rejects non-401 errors", async () => {
		await expect(resRejected({ response: { status: 500 }, config: {} })).rejects.toBeDefined();
	});

	it("does not retry a 401 when there is no refresh token", async () => {
		getRefreshTokenMock.mockReturnValue(null);
		await expect(
			resRejected({ response: { status: 401 }, config: { _retry: false } }),
		).rejects.toBeDefined();
		expect(axiosPost).not.toHaveBeenCalled();
	});
});
