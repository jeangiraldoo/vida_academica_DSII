import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

vi.mock("./client", () => ({
	default: {
		get: vi.fn(),
		post: vi.fn(),
		patch: vi.fn(),
		delete: vi.fn(),
	},
}));

import client from "./client";
import {
	fetchMe,
	updateMe,
	fetchActivities,
	createActivity,
	updateActivity,
	deleteActivity,
	fetchTodayView,
	fetchSubtasks,
	createSubtask,
	updateSubtask,
	deleteSubtask,
	fetchSubjects,
	createSubject,
	updateSubject,
	deleteSubject,
	fetchConflicts,
} from "./dashboard";

const http = client as unknown as {
	get: Mock;
	post: Mock;
	patch: Mock;
	delete: Mock;
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe("dashboard API", () => {
	it("fetchMe gets the current user", async () => {
		http.get.mockResolvedValue({ data: { id: 1 } });
		await expect(fetchMe()).resolves.toEqual({ id: 1 });
		expect(http.get).toHaveBeenCalledWith("/me/");
	});

	it("updateMe patches the current user", async () => {
		http.patch.mockResolvedValue({ data: { id: 1, max_daily_hours: 5 } });
		const result = await updateMe({ max_daily_hours: 5 });
		expect(result.max_daily_hours).toBe(5);
		expect(http.patch).toHaveBeenCalledWith("/me/", { max_daily_hours: 5 });
	});

	it("fetchActivities sends pagination params when provided", async () => {
		http.get.mockResolvedValue({ data: [] });
		await fetchActivities(2, 10);
		expect(http.get).toHaveBeenCalledWith("/activities/", { params: { page: 2, limit: 10 } });
	});

	it("fetchActivities omits params when not provided", async () => {
		http.get.mockResolvedValue({ data: [] });
		await fetchActivities();
		expect(http.get).toHaveBeenCalledWith("/activities/", { params: {} });
	});

	it("createActivity posts the payload", async () => {
		http.post.mockResolvedValue({ data: { id: 9 } });
		const payload = {
			title: "T",
			course_name: "C",
			due_date: "2026-06-30",
			status: "pending" as const,
		};
		const result = await createActivity(payload);
		expect(result.id).toBe(9);
		expect(http.post).toHaveBeenCalledWith("/activities/", payload);
	});

	it("updateActivity patches by id", async () => {
		http.patch.mockResolvedValue({ data: { id: 3 } });
		await updateActivity(3, { title: "New" });
		expect(http.patch).toHaveBeenCalledWith("/activities/3/", { title: "New" });
	});

	it("deleteActivity deletes by id", async () => {
		http.delete.mockResolvedValue({ data: undefined });
		await deleteActivity(7);
		expect(http.delete).toHaveBeenCalledWith("/activities/7/");
	});

	it("fetchTodayView maps params into the query", async () => {
		http.get.mockResolvedValue({ data: {} });
		await fetchTodayView({ nDays: 3, courseId: 5, status: "hoy", page: 1, limit: 20 });
		expect(http.get).toHaveBeenCalledWith("/today/", {
			params: { n_days: 3, courseId: 5, status: "hoy", page: 1, limit: 20 },
		});
	});

	it("fetchTodayView sends an empty query when no params are given", async () => {
		http.get.mockResolvedValue({ data: {} });
		await fetchTodayView();
		expect(http.get).toHaveBeenCalledWith("/today/", { params: {} });
	});

	it("fetchSubtasks gets subtasks for an activity", async () => {
		http.get.mockResolvedValue({ data: [] });
		await fetchSubtasks(4);
		expect(http.get).toHaveBeenCalledWith("/activities/4/subtasks/");
	});

	it("createSubtask posts a subtask", async () => {
		http.post.mockResolvedValue({ data: { id: 1 } });
		const payload = {
			name: "S",
			estimated_hours: 2,
			target_date: "2026-06-30",
			status: "pending" as const,
			ordering: 0,
		};
		await createSubtask(4, payload);
		expect(http.post).toHaveBeenCalledWith("/activities/4/subtasks/", payload);
	});

	it("updateSubtask maps postponement_note to note", async () => {
		http.patch.mockResolvedValue({ data: { id: 1 } });
		await updateSubtask(4, 1, { name: "S", postponement_note: "reason" });
		expect(http.patch).toHaveBeenCalledWith("/activities/4/subtasks/1/", {
			name: "S",
			note: "reason",
		});
	});

	it("updateSubtask omits note when there is no postponement_note", async () => {
		http.patch.mockResolvedValue({ data: { id: 1 } });
		await updateSubtask(4, 1, { name: "S" });
		expect(http.patch).toHaveBeenCalledWith("/activities/4/subtasks/1/", { name: "S" });
	});

	it("deleteSubtask deletes a subtask", async () => {
		http.delete.mockResolvedValue({ data: undefined });
		await deleteSubtask(4, 1);
		expect(http.delete).toHaveBeenCalledWith("/activities/4/subtasks/1/");
	});

	it("fetchSubjects gets the subjects", async () => {
		http.get.mockResolvedValue({ data: [] });
		await fetchSubjects();
		expect(http.get).toHaveBeenCalledWith("/subjects/");
	});

	it("createSubject posts a subject name", async () => {
		http.post.mockResolvedValue({ data: { id: 1, name: "Math" } });
		await createSubject("Math");
		expect(http.post).toHaveBeenCalledWith("/subjects/", { name: "Math" });
	});

	it("updateSubject patches a subject name", async () => {
		http.patch.mockResolvedValue({ data: { id: 1, name: "Physics" } });
		await updateSubject(1, "Physics");
		expect(http.patch).toHaveBeenCalledWith("/subjects/1/", { name: "Physics" });
	});

	it("deleteSubject deletes a subject", async () => {
		http.delete.mockResolvedValue({ data: undefined });
		await deleteSubject(1);
		expect(http.delete).toHaveBeenCalledWith("/subjects/1/");
	});

	it("fetchConflicts gets the conflicts", async () => {
		http.get.mockResolvedValue({ data: [] });
		await fetchConflicts();
		expect(http.get).toHaveBeenCalledWith("/conflicts/");
	});
});
