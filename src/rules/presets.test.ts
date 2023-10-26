import { describe, test, expect } from "vitest";
import presets, { CUSTOM_PRESET } from "./presets";
import rules from "./rules";
import { setsAreEqual } from "utils/object";


describe("Defined presets list", () => {
    test("has every rule (as defined in rules.ts) set (to either true or false)", () => {
        Object.entries(presets).forEach(([presetName, optionSettings]) => {
            if (presetName === CUSTOM_PRESET) return; // allowed
            
            const allDefinedRules: Array<string> = rules.map(rule => rule.name);
            const presetDefinedRules: Array<string> = Object.keys(optionSettings);
            // allRules should be equal to rulesSet (order does not matter)
            //expect(allDefinedRules.length).toBe(presetDefinedRules.length);
            const allSet = new Set(allDefinedRules);
            const presetSet = new Set(presetDefinedRules);
            expect(setsAreEqual(presetSet, allSet), `Preset ${presetName} had only ${presetSet.size}/${allSet.size} rules configured`).toBe(true);
        });
    });
});