import { describe, it, expect } from "vitest";
import { prefixRecordWith } from "./prefixObject";

describe("prefixRecordWith", () => {
    it("should return the passed record with prefixed keys", () => {
		test("Record with values of type boolean", () => {
			const input: Record<string, boolean> = {
				"1": true,
				"two": true,
				"3": false,
				"four": false,
			};
			const expected: Record<string, boolean> = {
				"test1": true,
				"testtwo": true,
				"test3": false,
				"testfour": false,
			};
			expect(prefixRecordWith(input, "test")).toBe(expected);
		});
		test("Record with values of type number", () => {
			const input: Record<string, number> = {
				"-1": 0,
				"*two": 1,
				"+3": -2,
				"/four": 23,
			};
			const expected: Record<string, number> = {
				"test~-1": 0,
				"test~*two": 1,
				"test~+3": -2,
				"test~/four": 23,
			};
			expect(prefixRecordWith(input, "test~")).toBe(expected);
		});
		test("Record with values of type string", () => {
			const input: Record<string, string> = {
				"1": true,
				"two": true,
				"3": false,
				"four": false,
			};
			const expected: Record<string, string> = {
				"test1": true,
				"testtwo": true,
				"test3": false,
				"testfour": false,
			};
			expect(prefixRecordWith(input, "test")).toBe(expected);
		});
    });
});
