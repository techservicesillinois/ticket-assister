import { getCurrentPrefill } from "./storage";

/**
 * The default prefill reply to be used
 * in absense of one stored in storage.
 *
 * @see getCurrentPrefill
 */
export const DEFAULT_PREFILL = "Hello {client.name.first},<br /><br /><br /><br />Best,<br />{self.name.first}<br />Technology Services";

/**
 * Returns the current prefill response stored
 * or the default if not set.
 */
export async function getCustomPrefillOrDefault(): Promise<string> {
	try {
		const stored = await getCurrentPrefill();
		if (stored != null) {
			return stored;
		}
	} catch {/* */}
    // errored or not set: give the default
    return DEFAULT_PREFILL;
}
