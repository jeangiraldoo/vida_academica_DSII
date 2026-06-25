import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
	formatDate,
	daysUntil,
	classifyActivity,
	checkDailyConflicts,
	EMPTY_KANBAN,
} from "./dashboardUtils";

describe("formatDate", () => {
	it("formats an ISO date as dd/mm/yyyy", () => {
		expect(formatDate("2026-06-24")).toBe("24/06/2026");
	});

	it("returns a dash for null or undefined", () => {
		expect(formatDate(null)).toBe("—");
		expect(formatDate(undefined)).toBe("—");
	});

	it("returns the original value when it is not a full date", () => {
		expect(formatDate("2026-06")).toBe("2026-06");
	});
});

describe("daysUntil / classifyActivity", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-06-24T10:00:00"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns 0 for today", () => {
		expect(daysUntil("2026-06-24")).toBe(0);
	});

	it("returns a positive number for a future date", () => {
		expect(daysUntil("2026-06-27")).toBe(3);
	});

	it("returns a negative number for a past date", () => {
		expect(daysUntil("2026-06-21")).toBe(-3);
	});

	it("classifies a past date as overdue", () => {
		expect(classifyActivity("2026-06-20")).toBe("overdue");
	});

	it("classifies today as today", () => {
		expect(classifyActivity("2026-06-24")).toBe("today");
	});

	it("classifies a future date as upcoming", () => {
		expect(classifyActivity("2026-06-30")).toBe("upcoming");
	});
});

describe("checkDailyConflicts", () => {
	it("returns null when no day exceeds the limit", () => {
		const subtasks = [
			{ target_date: "2026-06-24", estimated_hours: 2 },
			{ target_date: "2026-06-25", estimated_hours: 3 },
		];
		expect(checkDailyConflicts(subtasks, 5)).toBeNull();
	});

	it("returns the conflicting day when the limit is exceeded", () => {
		const subtasks = [
			{ target_date: "2026-06-24", estimated_hours: 4 },
			{ target_date: "2026-06-24", estimated_hours: 3 },
		];
		expect(checkDailyConflicts(subtasks, 5)).toEqual({
			date: "2026-06-24",
			totalHours: 7,
		});
	});

	it("returns null when the max daily hours is zero or negative", () => {
		const subtasks = [{ target_date: "2026-06-24", estimated_hours: 8 }];
		expect(checkDailyConflicts(subtasks, 0)).toBeNull();
	});

	it("ignores subtasks without a target date", () => {
		const subtasks = [{ target_date: "", estimated_hours: 10 }];
		expect(checkDailyConflicts(subtasks, 5)).toBeNull();
	});
});

describe("EMPTY_KANBAN", () => {
	it("exposes the four empty columns", () => {
		expect(EMPTY_KANBAN).toEqual({
			overdue: [],
			today: [],
			upcoming: [],
			postponed: [],
		});
	});
});
