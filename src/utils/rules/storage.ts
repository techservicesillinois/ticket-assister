import * as browser from "webextension-polyfill";
import presets from "../../rules/presets";
import { prefixRecordWith } from "utils/object";

/**
 * The storage API to use.
 *
 * @remarks
 * browser.storage.sync = synced across Chrome profile
 *
 * In storageArea, we are storing:
 * - Current preset [one of the presets (including CUSTOM_PRESET)]
 * - Custom preset settings
 *   - string => boolean for each
 */
export const storageArea = browser.storage.sync;

/**
 * The prefix before keys in {@link storageArea} for rules
 * in the "Custom" preset
 */
export const customPresetRulePrefix = "rule-";

/**
 * Updates a rule's on/off state in storage
 *
 * @returns a {@link Promise}, which resolves on write success and rejects on failure
 *
 * @internalRemarks
 * beware of runtime.lastError
 */
export async function updateCustomRuleStatus(name: string, value: boolean): Promise<void> {
	return await storageArea.set({ [`${customPresetRulePrefix}${name}`]: value });
}
/**
 * Updates multiple rules' on/off states saved in storage
 *
 * For bulk updates
 *
 * @returns a {@link Promise}, which resolves on write success and rejects on failure
 */
export async function updateCustomRuleStatusMultiple(optionStatuses: Record<string, boolean>): Promise<void> {
	await storageArea.set(prefixRecordWith(optionStatuses, customPresetRulePrefix));
	return;
}

/**
 * Gets the value of a rule
 * i.e. is it on or off currently
 *
 * @returns a {@link Promise}, which resolves to a boolean indicating if the rule is on on success
 * and rejects on failure OR if improper data is stored at that key
 * (i.e. not a boolean)
 *
 * @internalRemarks
 * can use storageArea.get({ key: defaultValue });
 */
export async function getCustomRuleStatus(optionName: string): Promise<boolean | null> {
	const storedName = `${customPresetRulePrefix}${optionName}`;
	const value = await storageArea.get(storedName);
	if (value[storedName] === undefined) {
		return null;
	}
	// stored as a boolean
	return value[storedName];
}
/**
 * Gets the values (i.e. on or off) of multiple rules
 *
 * Nonexistant keys *and keys with an invalid value* are set to null
 *
 * @returns a {@link Promise}, which resolves to a boolean indicating if the rule is on on success
 * and rejects on failure
 * (i.e. not a boolean)
 *
 * For bulk retrieval
 * 
 * @internalRemarks
 * This could alternatively return a Promise<**Map**<string, boolean | null>>
 * 
 * Adds the {@link customPresetRulePrefix} to each of the {@param optionNames}
 */
export async function getCustomRuleStatusMultiple(optionNames: Array<string>): Promise<Record<string, boolean | null>> {
	const storedNames = optionNames.map(optionName => `${customPresetRulePrefix}${optionName}`);
	const values: Record<string, boolean | null> = await storageArea.get(storedNames);
	const ret: Record<string, boolean | null> = {};
	Object.entries(values).map(([key, value]) => {
		// already a boolean
		// or null
		const keyWithoutPrefix = key.substring(customPresetRulePrefix.length); // the rule name
		ret[keyWithoutPrefix] = value;
	});
	return ret;
}
/**
 * Gets the values (i.e. on or off) of all custom rules
 * stored in {@link storageArea}.
 *
 * Nonexistant keys *and keys with an invalid value* are set to null
 *
 * @returns a {@link Promise}, which resolves to a boolean indicating if the rule is on on success
 * and rejects on failure
 * (i.e. not a boolean)
 * 
 * @internalRemarks
 * Uses the keys of "All Off" preset to find all
 * since all presets should be defined there
 */
export async function getAllCustomRuleStatuses(): Promise<Record<string, boolean | null>> {
	return await getCustomRuleStatusMultiple(Object.keys(presets["All Off"]));
}

/**
 * Gets the current preset
 * as set in {@link storageArea}
 *
 * @returns a {@link Promise}, which resolves to the string value of the preset name,
 * null if not set,
 * and rejects on failure
 */
export async function getCurrentPreset(): Promise<string | null> {
	const value = await storageArea.get("currentPreset");
	if (value["currentPreset"] === undefined) {
		return null;
	}
	return value["currentPreset"];
}
/**
 * Updates the current preset in {@link storageArea}
 *
 * @returns a {@link Promise}, which resolves on write success and rejects on failure
 */
export async function setCurrentPreset(presetName: string): Promise<void> {
	await storageArea.set({ currentPreset: presetName });
	return;
}
