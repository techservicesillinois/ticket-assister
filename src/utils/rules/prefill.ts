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

/**
 * A list of the allowed brace variables
 *
 * Does not include the surrounding braces themselves.
 *
 * @remarks
 * Should be even with the list in {@link replacePrefillVariables}.
 *
 * Includes all variables that are parsed and replaced,
 * even if they aren't fully working yet (e.g., {cursor}).
 */
export const PERMITTED_BRACE_VARIABLES = [
	"client.name.first", "client.name.last", "client.name.full",
	"self.name.first", "self.name.last", "self.name.full",
	"ticket.number",
	"cursor"
];