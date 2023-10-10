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
 * Retrieves the record stored in {@link storageArea}
 * or null if not found.
 *
 * @remarks
 * Return type is based on the passed type parameter T,
 * which is the expected type as stored in storage.
 *
 * The browser API will return this type of whatever is *actually*
 * stored, not necessarily the passed type T.
 */
async function grab<T>(key: string): Promise<T | null> {
	const value = await storageArea.get(key);
	if (value[key] === undefined) {
		return null;
	}
	return value[key];
}

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
	// stored as a boolean
	return grab<boolean>(`${customPresetRulePrefix}${optionName}`);
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
	// I know that this exists. We have tests ensuring it.
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	return await getCustomRuleStatusMultiple(Object.keys(presets["All Off"]!));
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
	return grab<string>("currentPreset");
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
 * The key to be used for the custom user prefill
 * when stored in {@link storageArea}.
 *
 * @remarks
 * `ao-` prefix stands for "additional options"
 * which is where this is set by the user.
 */
const prefillKey = "ao-prefill";
/**
 * Returns the current prefill response as stored in {@link storageArea}
 * or null if not set.
 */
export async function getCurrentPrefill(): Promise<string | null> {
	return grab<string>(prefillKey);
}
/**
 * Sets the current prefill response in {@link storageArea}.
 *
 * Note that this is a raw set, and user data should be sanitized at this point
 */
export async function setCurrentPrefill(prefillData: string): Promise<void> {
	return await storageArea.set({ [prefillKey]: prefillData });
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