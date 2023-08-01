import { DomParseError } from "utils/errors";

/**
 * Gets the Exchange Online panel
 *
 * @throws a {@link DomParseError} if it does not look like expected
 */
function getExchangeElBody(): HTMLTableSectionElement {
	const el = document.querySelector("#exchange_online");
	if (el === undefined || !(el instanceof HTMLTableElement)) {
		throw new DomParseError();
	}
	const body = el.querySelector("tbody");
	if (body === null || body.children.length < 3) {
		throw new DomParseError();
	}
	return body;
}

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
	return getExchangeElBody().children[3]?.textContent?.trim() !== "No mailbox found";
}
/**
 * A listed inbox rule
 */
interface InboxRule {
	/**
	 * The number of the rule
	 * as listed in Cerebro
	 *
	 * Determines the in which rules are ran
	 * 
	 * @remarks
	 * This is not very useful as array positioning
	 * also should determine the same order,
	 * but Cerebro has this information listed
	 * so we will, too.
	 */
	no: number,
	/**
	 * The user-set name of the inbox rule
	 */
	name: string,
	/**
	 * The JSON string of conditions
	 */
	conditions: string,
	/**
	 * The JSON string of actions
	 */
	actions: string,
}
/**
 * Returns an array of the user's inbox Rules
 * Returns empty if the inbox is not found
 */
export function getInboxRules(): Array<InboxRule> {
	if (!inboxExists()) {
		return [];
	}
	const bod = getExchangeElBody();
	const inboxRules: Array<InboxRule> = [];
	// cerebro people make the weirdest formats
	// todo verify that the data looks good and throw if not
	for (let i = 3; i < bod.children.length; i += 3) {
		const a = bod.children[i].children[0];
		const b = bod.children[i].children[1];
		const c = bod.children[i + 1]?.children[1]; //bod.children[i + 1].querySelector(".columnvalue")
		const d = bod.children[i + 2]?.children[1];
		if (
			a === undefined || b === undefined || c === undefined || d === undefined
			|| a.textContent === null || b.textContent === null || c.textContent === null || d.textContent === null
		) {
			throw new DomParseError();
		}
		inboxRules.push({
			no: Number(a.textContent.substring(4)),
			name: b.textContent,
			conditions: c.textContent,
			actions: d.textContent,
		});
	}
	return inboxRules;
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
 * @remarks
 * Returns false if email forwarding is not set
 * for that email
 * (That should be tested for separately and is not a *typo*.)
 *
 * @internalRemarks
 * Matches supplied email is close to @g.illinois.edu or @mx.uillinois.edu but is spelled wrong
 */
export function emailDeliveryTypo(currentDeliveryEmail: string): boolean {
	if (currentDeliveryEmail === "Email Forwarding not set") {
		// this is a separate issue
		return false;
	}
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
			for (let i = 0; i < validEntries.length; i++) {
				if (c !== validEntries[i][currentCharMatched]) {
					mistakes[i]++;
				}
			}
			if (!mistakes.some(count => count === 0) && mistakes.some(count => count === 1)) {
				// off by exactly one from a valid entry
				return true;
			}
			currentCharMatched++;
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
 * Finds the table `body` el with the caption {@param caption}
 * @throws if not found
 */
export function findTableBodyEl(caption: string) {
	let tbody: HTMLTableSectionElement | null = null;
	//document.querySelectorAll("caption.tabletitle").forEach(sectionTitleEl => {
	for (const sectionTitleEl of document.querySelectorAll("caption.tabletitle")) {
		if (sectionTitleEl.textContent === caption) {
			// should be next child
			const maybeTbody = sectionTitleEl.parentElement?.querySelector("tbody");
			if (maybeTbody) {
				tbody = maybeTbody;
			}
			break;
		}
	}
	if (tbody === null) {
		throw new Error("table body could not be found");
	}
	return tbody;
}
/**
 * Finds the value with the title {@param title}
 * in the table `body` {@param table}
 * @throws if not found
 */
export function findTableValueEl(title: string, tbody: HTMLTableSectionElement) {
	for (const entryKeyEl of tbody.querySelectorAll("th.columntitle")) {
		if (entryKeyEl.textContent === title) {
			// should be next child
			const valueEl = entryKeyEl.parentElement?.querySelector("td"); // .columnvalue, .columnvaluegood, .columnvaluebad
			if (!valueEl) {
				throw new Error("title could not be found in table body");
			}
			return valueEl;
		}
	}
	throw new Error("key could not be found in section");
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
	const tbody = findTableBodyEl(section);
	return findTableValueEl(key, tbody).textContent?.trim() ?? "";
}

/**
 * Returns a string in an array representation,
 * splitting on whitespace and cleaning things up
 */
export function cleanUpInfo(input: string): Array<string> {
	return input
		.split(" ")
		.map(actType => actType.trim())
		.filter(actType => actType !== '');
}

/**
 * Gets an array of the person's types
 *
 * @throws if unable to find types on screen
 */
export function getUserTypes(): Array<string> {
	return cleanUpInfo(valueFor("Central Registry", "Type"));
}
/**
 * Gets an array of the person's roles
 *
 * @throws if unable to find types on screen
 */
export function getUserRoles(): Array<string> {
	return cleanUpInfo(valueFor("Central Registry", "Role"));
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

/**
 * The part before the netid
 * that only displays on success
 *
 * @internalRemarks
 * On failure: "NetID X was not found in Central Registry."
 */
const prefixString = "Currently Viewing Information for NetID: "; //"NetID: "
/**
 * Gets the NetID of the user on screen
 *
 * @returns null if not found or a string of the NetID
 */
export function getCurrentNetId(): string | null {
	const heading = document.querySelector("h2")?.textContent;
	if (!heading || heading.indexOf(prefixString) === -1) {
		return null;
	}
	return heading.substring(heading.indexOf(prefixString) + prefixString.length);
}

/**
 * Highlights {@param cell} with color {@param color}
 */
export function highlightCell(cell: HTMLElement, color: string) {
	cell.style.backgroundColor = color;
}