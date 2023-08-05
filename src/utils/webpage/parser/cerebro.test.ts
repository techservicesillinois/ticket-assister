import { describe, it, expect } from "vitest";
import { emailDeliveryTypo, hasAtLeastOne } from "./cerebro"; // todo

describe("hasAtLeastOne", () => {
    it("should succeed with one to one", () => {
        expect(hasAtLeastOne(["a"], ["a"])).toBe(true);
        expect(hasAtLeastOne(["b"], ["b"])).toBe(true);
    });
    it("should not succeed with empty array(s)", () => {
        expect(hasAtLeastOne(["a"], [])).toBe(false);
        expect(hasAtLeastOne([], ["a"])).toBe(false);
        expect(hasAtLeastOne([], [])).toBe(false);
    });
    it("should succeed with many to one that has the value", () => {
        expect(hasAtLeastOne(["a", "b", "c"], ["a"])).toBe(true);
        expect(hasAtLeastOne(["a", "b", "c"], ["b"])).toBe(true);
    });
    it("should succeed with many to many that has the value", () => {
        expect(hasAtLeastOne(["a", "b", "c", "d", "e", "f", "g"], ["a", "b", "c"])).toBe(true);
        expect(hasAtLeastOne(["a", "b", "c", "d", "e", "f", "g"], ["a", "b", "z"])).toBe(true);
        expect(hasAtLeastOne(["a", "b", "c", "d", "e", "f", "g"], ["a", "z", "z"])).toBe(true);
        expect(hasAtLeastOne(["a", "b", "c", "d", "e", "f", "g"], ["z", "z", "a"])).toBe(true);
    });
    it("should not succeed if the first array does not contain any elements of the second array", () => {
        expect(hasAtLeastOne(["a", "b", "c", "d", "e", "f", "g"], ["z", "z", "z"])).toBe(false);
        expect(hasAtLeastOne(["a", "b", "c", "d", "e", "f", "g"], ["t", "u", "v"])).toBe(false);
        expect(hasAtLeastOne(["z"], ["a", "b", "c", "d", "e", "f", "g"])).toBe(false);
    });
});

describe("emailDeliveryTypo", () => {
    it("should succeed for valid entries", () => {
        describe("Illinois delivery", () => {
            expect(emailDeliveryTypo("test@mx.uillinois.edu")).toBe(false);
            expect(emailDeliveryTypo("test@g.illinois.edu")).toBe(false);
        });
        describe("non-Illinois delivery", () => {
            expect(emailDeliveryTypo("test@otherdomain.com")).toBe(false);
            expect(emailDeliveryTypo("test@uic.edu")).toBe(false);
            expect(emailDeliveryTypo("netid@gmail.com")).toBe(false);
        });
    });
    it("should fail when near @mx.uillinois.edu", () => {
        expect(emailDeliveryTypo("test@ilinois.edu")).toBe(true);
        expect(emailDeliveryTypo("test@illlinois.edu")).toBe(true);
        expect(emailDeliveryTypo("test@mx.uilinois.edu")).toBe(true);
        expect(emailDeliveryTypo("test@mx.uilllinois.edu")).toBe(true);
        expect(emailDeliveryTypo("test@mx.ilinois.edu")).toBe(true);
        expect(emailDeliveryTypo("test@mx.illinois.edu")).toBe(true);
        expect(emailDeliveryTypo("test@mx.illlinois.edu")).toBe(true);
    
        expect(emailDeliveryTypo("test@mx.uillinios.edu")).toBe(true);
        expect(emailDeliveryTypo("test@ilinios.edu")).toBe(true);
        expect(emailDeliveryTypo("test@illlinios.edu")).toBe(true);
        expect(emailDeliveryTypo("test@mx.uilinios.edu")).toBe(true);
        expect(emailDeliveryTypo("test@mx.uilllinios.edu")).toBe(true);
        expect(emailDeliveryTypo("test@mx.ilinios.edu")).toBe(true);
        expect(emailDeliveryTypo("test@mx.illinios.edu")).toBe(true);
        expect(emailDeliveryTypo("test@mx.illlinios.edu")).toBe(true);
    });
    it("should fail for @illinois.edu", () => {
        // I think.
        expect(emailDeliveryTypo("test@illinois.edu")).toBe(true);
    });
    it("should fail when near @g.illinois.edu", () => {
        expect(emailDeliveryTypo("test@g.ilinois.edu")).toBe(true);
        expect(emailDeliveryTypo("test@g.illlinois.edu")).toBe(true);
        expect(emailDeliveryTypo("test@g.uilinois.edu")).toBe(true);
        expect(emailDeliveryTypo("test@g.uillinois.edu")).toBe(true);
        expect(emailDeliveryTypo("test@g.uilllinois.edu")).toBe(true);
    
        expect(emailDeliveryTypo("test@g.illinios.edu")).toBe(true);
        expect(emailDeliveryTypo("test@g.ilinios.edu")).toBe(true);
        expect(emailDeliveryTypo("test@g.illlinios.edu")).toBe(true);
        expect(emailDeliveryTypo("test@g.uilinios.edu")).toBe(true);
        expect(emailDeliveryTypo("test@g.uillinios.edu")).toBe(true);
        expect(emailDeliveryTypo("test@g.uilllinios.edu")).toBe(true);
    });
    it("should fail when off by one from @mx.uillinois.edu", () => {
        expect(emailDeliveryTypo("test@mz.uillinois.edu")).toBe(true);
        expect(emailDeliveryTypo("test@mx.uillinois.edz")).toBe(true);
    });
    it("should fail when off by one from @g.illinois.edu", () => {
        expect(emailDeliveryTypo("test@z.illinois.edu")).toBe(true);
        expect(emailDeliveryTypo("test@g.illinois.edz")).toBe(true);
    });
});

