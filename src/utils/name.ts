/**
 * Stores name data
 */
export interface Name {
	first: string,
	last: string,
	full: string,
}
/**
 * Returns a {@link Name} from a full name (display name) string
 */
export function parseName(name: string): Name {
	const splitName = name.split(" ");
	let first = splitName[0],
		last = splitName[1];
	if (splitName.length === 3) {
		//first = splitName[0];
		last = splitName[2];
	}/* else if (splitName.length > 3) {
		// ?
		// go with the first two things anyways
	}*/
	const prefixesToStrip = ["dr", "mr", "ms", "dr.", "mr.", "ms.", "mrs", "mrs."];
	// could first sort these by length and optimize the search
	for (const prefix of prefixesToStrip) {
		if (first.substring(0, prefix.length) === prefix) {
			first = first.substring(0, prefix.length);
			break;
		}
	}
	return {
		first,
		last,
		full: name,
	};
}