import * as browser from "webextension-polyfill";
import type { ITDXPersonBasic } from "utils/tdx/types/person";
import { storageArea } from "utils/rules/storage";

/**
 * The name in {@link storageArea}
 * in which the current user is set
 */
const currentUserStorageName = "currentUser";
/**
 * The {@link Date} which the current user
 * (stored in {@link currentUserStorageName})
 * was last set
 */
const currentUserStorageNameLastSet = "currentUser-set";

/**
 * The number of milliseconds
 * after which the current user stored
 * has expired and needs to be refreshed.
 *
 * @remarks
 * Set to 7 days.
 */
const EXPIRY_TIME_MS = 1000*60*60*24*7;

/**
 * Gets the current user
 * as set in {@link storageArea}
 *
 * @returns a {@link Promise}, which resolves to an ITDXPersonBasic of the current user,
 * or null if not set or expired
 */
export async function getCurrentPersonCached(): Promise<ITDXPersonBasic | null> {
	const value = await storageArea.get([currentUserStorageName, currentUserStorageNameLastSet]);
	if (
			value[currentUserStorageName] === undefined
			|| value[currentUserStorageNameLastSet] === undefined
			|| new Date() - value[currentUserStorageNameLastSet] > EXPIRY_TIME_MS
	) {
		return null;
	}
	return value[currentUserStorageName];
}
/**
 * Sets the current person in {@link storageArea}
 *
 * @returns a {@link Promise}, which resolves on write success and rejects on failure
 *
 * @remarks
 * Also stores a "last updated" date
 */
export async function setCurrentPersonCached(currentPerson: ITDXPersonBasic): Promise<void> {
	await storageArea.set({
		[currentUserStorageName]: currentPerson,
		[currentUserStorageNameLastSet]: new Date(),
	});
	return;
}
