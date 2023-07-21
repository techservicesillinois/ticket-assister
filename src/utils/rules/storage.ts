// eslint-disable-next-line @typescript-eslint/no-var-requires
const browser = require("webextension-polyfill");
import { prefixRecordWith } from "utils/prefixObject";

/**
 * The storage API to use.
 *
 * @remarks
 * browser.storage.sync = synced across Chrome profile
 *
 * In storageArea, we are storing:
 * - Current preset [one of presets or "Custom"]
 * - "Custom" preset settings
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
export async function updateRuleStatus(name: string, value: boolean): Promise<void> {
	await storageArea.set({ [`${customPresetRulePrefix}${name}`]: value });
	return;
}
/**
 * Updates multiple rules' on/off states saved in storage
 *
 * For bulk updates
 *
 * @returns a {@link Promise}, which resolves on write success and rejects on failure
 */
export async function updateRuleStatusMultiple(optionStatuses: Record<string, boolean>): Promise<void> {
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
export async function getRuleStatus(optionName: string): Promise<boolean | null> {
	const value = await storageArea.get(optionName);
	if (value === null) {
		return null;
	}
	const valueBool = stringToBoolean(value);
	if (valueBool === null) {
		throw new Error("Invalid data associated with that value.");
	}
	return valueBool;
}
/**
 * Gets the value of a rule
 * i.e. is it on or off currently
 *
 * Nonexistant keys *and keys with an invalid value* are set to null
 *
 * @returns a {@link Promise}, which resolves to a boolean indicating if the rule is on on success
 * and rejects on failure
 * (i.e. not a boolean)
 *
 * For bulk retrieval
 */
export async function getRuleStatusMultiple(optionNames: Array<string>): Promise<Array<boolean | null>> {
	const values: Record<string, string> = await storageArea.get(optionNames);
	return Object.entries(values).map(([key, value]) => {
		if (value === null) {
			return null;
		}
		const valueBool: boolean | null = stringToBoolean(value);
		return valueBool;
	});
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
	if (value === null) {
		return null;
	}
	return value;
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


/**
 * Converts a string to a boolean,
 * returning null if not possible
 *
 * @remarks
 * Only will parse "true" or "false"
 */
function stringToBoolean(str: string): boolean | null {
	if (str === "true") {
		return true;
	} else if (str === "false") {
		return false;
	} else {
		return null;
	}
}