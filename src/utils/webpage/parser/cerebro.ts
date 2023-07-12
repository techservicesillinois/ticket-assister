/**
 * Determines if an Office 365 inbox exists for a user
 *
 * @remarks
 * Is based off of the value displayed under "Inbox Rules"
 * This value is not always correct. T2 can check directly.
 *
 * @todo implement
 */
export function inboxExists(): boolean {
	// todo
	return false;
}
/**
 * Returns an array of the user's inbox Rules
 * Returns empty if the inbox is not found
 */
export function getInboxRules() {
	// todo
	throw new Error("Not Implemented");
}

/**
 * Determines if an array contains at least one element
 * that is in another array
 *
 * @remarks
 * Useful for determining if a user has at least one of those types,
 * e.g. `hasAtLeastOne(usersAccountTypes, shouldHaveOneOfThese)`
 */
export function hasAtLeastOne(arr: Array<string>, matchAtLeastOne: Array<string>) {
	for (const typeToMatch of matchAtLeastOne) {
		if (arr.includes(typeToMatch)) {
			return true;
		}
	}
	return false;
}

/**
 * Determines if a passed email is a near typo.
 * Return true if so.
 *
 * @internalRemarks
 * Matches supplied email is close to @g.illinois.edu or @mx.uillinois.edu but is spelled wrong
 */
export function emailDeliveryTypo(currentDeliveryEmail: string): boolean {
	const patternsToCheck = [
		{ // mistyped @mx.uillinois.edu
			bad: /@(mx\.)?u?i?l*in(oi|io)s\.edu/,
			ok: /@mx\.uillinois\.edu$/,
		},
		{ // mistyped @g.illinois.edu
			bad: /@g\.u?i?l*in(oi|io)s\.edu/,
			ok: /@g\.illinois\.edu$/,
		},
	];

	for (const { bad, ok } of patternsToCheck) {
		if (bad.test(currentDeliveryEmail) && !ok.test(currentDeliveryEmail)) {
			// bad
			return true;
		}
	}

	// off-by-one character
	/**
	 * Valid entries for the domain of the email
	 * Starting after the @ symbol.
	 */
	const validEntries = ["g.illinois.edu", "mx.uillinois.edu"];
	let inTheAt = false;
	let currentCharMatched = -1;
	const mistakes = [0, 0];
	for (const c of currentDeliveryEmail) {
		if (!inTheAt) {
			if (c === "@") {
				inTheAt = true;
				currentCharMatched = 0;
			}
		} else {
			currentCharMatched++;
			for (let i = 0; i < validEntries.length; i++) {
				if (c !== validEntries[i][currentCharMatched]) {
					mistakes[i]++;
				}
			}
			if (mistakes.every(count => count === 1)) {
				// off by exactly one from a valid entry
				return true;
			}
		}
	}
	if (inTheAt === false) {
		// no @ in the email
		return true;
	}

	// ok (probably)
	return false;
}

/**
 * Finds the value for a heading.
 * Must be on the Cerebro site.
 *
 * @throws if the section or key in a section could not be found
 *
 * @remarks
 * Must exactly match key (case sensitive)
 */
export function valueFor(section: string, key: string): string {
	let tbody: HTMLTableSectionElement | null = null;
	//document.querySelectorAll("caption.tabletitle").forEach(sectionTitleEl => {
	for (const sectionTitleEl of document.querySelectorAll("caption.tabletitle")) {
		if (sectionTitleEl.textContent === section) {
			// should be next child
			const maybeTbody = sectionTitleEl.parentElement?.querySelector("tbody");
			if (maybeTbody) {
				tbody = maybeTbody;
			}
			break;
		}
	}
	if (tbody === null) {
		throw new Error("section could not be found");
	}
	for (const entryKeyEl of tbody.querySelectorAll("th.columntitle")) {
		if (entryKeyEl.textContent === key) {
			// should be next child
			const valueEl = entryKeyEl.parentElement?.querySelector("td"); // .columnvalue, .columnvaluegood, .columnvaluebad
			if (!valueEl) {
				throw new Error("key's value could not be found in section");
			}
			return valueEl.textContent?.trim() ?? "";
		}
	}
	throw new Error("key could not be found in section");
}

/**
 * Returns true if there are no results on the current Cerebro page
 *
 * @remarks
 * Returns true if either of these error messages are shown:
 * - "NetID X was not found in Central Registry"
 * - "That is not a valid UIN or NetID."
 */
export function noResults(): boolean {
	if (
		document.querySelector("#groupsettings") === null
		|| document.querySelector("h2")?.textContent?.indexOf("was not found in Central Registry.") !== -1
		|| document.querySelector("ul.errorlist > li")?.textContent === "That is not a valid UIN or NetID."
	) {
		return true;
	}
	return false;
}