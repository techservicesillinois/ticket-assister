import { describe, it, expect, test } from "vitest";
import { prefixRecordWith, setsAreEqual } from "./object";

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
				"1": "true",
				"two": "2",
				"3": "shopping spree",
				"four": "four",
			};
			const expected: Record<string, string> = {
				"test1": "",
				"testtwo": ".",
				"test3": "..",
				"testfour": "........",
			};
			expect(prefixRecordWith(input, "test")).toBe(expected);
		});
    });
});

describe("setsAreEqual", () => {
    it("should return true for two empty sets", () => {
		expect(setsAreEqual(new Set(), new Set())).toBe(true);
	});
	it("should return true for two equal sets", () => {
		const setA1 = new Set(["a"]);
		const setA2 = new Set(["a"]);
		expect(setsAreEqual(setA1, setA2)).toBe(true);
	
		const setB1 = new Set(["a", "b", "c"]);
		const setB2 = new Set(["a", "b", "c"]);
		expect(setsAreEqual(setB1, setB2)).toBe(true);

		it("even if the sets had values added in a different order", () => {
			const setC1 = new Set(["a", "b", "c"]);
			const setC2 = new Set(["c", "b", "a"]);
			expect(setsAreEqual(setC1, setC2)).toBe(true);

			const setD1 = new Set(["a", "b", "c"]);
			const setD2 = new Set(["a", "c", "b"]);
			expect(setsAreEqual(setD1, setD2), "these are equivalent (order does not matter)").toBe(true);
		});
		it("even if the sets had multiple of the same values added to it", () => {
			const setE1 = new Set(["a"]);
			const setE2 = new Set(["a", "a", "a"]);
			expect(setsAreEqual(setE1, setE2), "these are equivalent (no duplicates)").toBe(true);
		});
	});
	it("should return false for two sets of different szes", () => {
		const setA1 = new Set(["a"]);
		const setA2 = new Set(["a", "b"]);
		expect(setsAreEqual(setA1, setA2)).toBe(false);

		const setB1 = new Set(["a"]);
		const setB2 = new Set(["a", "b", "c", "d"]);
		expect(setsAreEqual(setB1, setB2)).toBe(false);

		const setC1 = new Set(["a"]);
		const setC2 = new Set(["a", "a", "b", "b"]);
		expect(setsAreEqual(setC1, setC2)).toBe(false);

	});
	it("should return false for two sets of the same size with different values", () => {
		const setA1 = new Set(["a"]);
		const setA2 = new Set(["b"]);
		expect(setsAreEqual(setA1, setA2)).toBe(false);

		const setB1 = new Set(["a", "b"]);
		const setB2 = new Set(["b", "c"]);
		expect(setsAreEqual(setB1, setB2)).toBe(false);

		const setC1 = new Set(["a", "b", "c", "d"]);
		const setC2 = new Set(["a", "b", "c", "t"]);
		expect(setsAreEqual(setC1, setC2)).toBe(false);
	});
});