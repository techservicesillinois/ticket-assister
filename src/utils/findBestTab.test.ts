import { describe, test, expect } from "vitest";
import { findBestTab } from "./findBestTab";
import type { Tabs } from "webextension-polyfill";

/**
 * Default tab fields
 * used for testing.
 * 
 * Includes all required fields of {@link Tab} interface
 */
const defaultTabFields: Tabs.Tab = {
    index: 99,
    highlighted: false,
    active: false,
    pinned: false,
    incognito: false,
};
describe("findBestTab", () => {
    test("Favors not incognito", () => {
        const winner = { ...defaultTabFields, incognito: false };
        const loser = { ...defaultTabFields, incognito: true };
        expect(findBestTab([winner, loser])).toBe(winner);
        test("works in reverse order", () => {
            expect(findBestTab([loser, winner])).toBe(winner);
        });
    });
    test("Favors active", () => {
        const winner = { ...defaultTabFields, active: true };
        const loser = { ...defaultTabFields, active: false };
        expect(findBestTab([winner, loser])).toBe(winner);
    });
    test("Favors pinned", () => {
        const winner = { ...defaultTabFields, pinned: true };
        const loser = { ...defaultTabFields, pinned: false };
        expect(findBestTab([winner, loser])).toBe(winner);
    });
    test("Favors lower index", () => {
        const winner = { ...defaultTabFields, index: 2 };
        const loser = { ...defaultTabFields, index: 3 };
        expect(findBestTab([winner, loser])).toBe(winner);
        
        test("works in reverse order", () => {
            expect(findBestTab([loser, winner])).toBe(winner);
        });

        const winner2 = { ...defaultTabFields, index: 10 };
        const loser2 = { ...defaultTabFields, index: 30 };
        expect(findBestTab([winner2, loser2])).toBe(winner2);
        
        const winner3 = { ...defaultTabFields, index: 8 };
        const loser3 = { ...defaultTabFields, index: 9 };
        expect(findBestTab([winner3, loser3])).toBe(winner3);
    });
    test("Favors in proper order", () => {
        test("1. not incognito", () => {
            const winner = { incognito: false, active: true, pinned: true, index: 2, highlighted: true };
            const loser = { incognito: true, active: true, pinned: true, index: 1, highlighted: true };
            expect(findBestTab([winner, loser])).toBe(winner);
            test("with all else winning", () => {
                const winner = { incognito: false, active: true, pinned: true, index: 2, highlighted: true };
                const loser = { incognito: true, active: false, pinned: false, index: 1, highlighted: true };
                expect(findBestTab([winner, loser])).toBe(winner);
            });
        });
        test("2. active", () => {
            const winner = { incognito: false, active: true, pinned: true, index: 2, highlighted: true };
            const loser = { incognito: false, active: false, pinned: true, index: 1, highlighted: true };
            expect(findBestTab([winner, loser])).toBe(winner);
        });
        test("3. pinned", () => {
            const winner = { incognito: false, active: false, pinned: true, index: 2, highlighted: true };
            const loser = { incognito: false, active: false, pinned: false, index: 1, highlighted: true };
            expect(findBestTab([winner, loser])).toBe(winner);
        });
        test("4. lowest index", () => {
            const winner = { incognito: false, active: false, pinned: true, index: 1, highlighted: true };
            const loser = { incognito: false, active: false, pinned: false, index: 10, highlighted: true };
            expect(findBestTab([winner, loser])).toBe(winner);
            test("with all else tied", () => {
                const winner = { incognito: true, active: true, pinned: true, index: 1, highlighted: true };
                const loser = { incognito: true, active: true, pinned: true, index: 10, highlighted: true };
                expect(findBestTab([winner, loser])).toBe(winner);
            });
        });
    });
    test("Works with >2 elements", () => {
        const winner = { incognito: false, active: true, pinned: true, index: 2, highlighted: true };
        const loser1 = { incognito: true, active: true, pinned: true, index: 1, highlighted: true };
        const loser2 = { incognito: false, active: true, pinned: false, index: 1, highlighted: true };
        expect(findBestTab([winner, loser1, loser2])).toBe(winner);
    });
});
