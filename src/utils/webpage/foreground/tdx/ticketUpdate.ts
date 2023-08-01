import { DomParseError } from "utils/errors";
import { Status, getStatusFromFormValue } from "utils/tdx/formNames";
import type { TicketID, LimitedHTML } from "utils/tdx/types/ticket";
import { TICKETS_BASE_URL, getRequestor, getWysiwygBody, getWysiwygWindow } from "./shared";
import { parseName } from "utils/name";
import { getCurrentTicketNumber } from "../../parser/ticket";
import { log } from "utils/logger";
import { getCurrentPerson } from "utils/webpage/background/ticketActions";
/**
 * Gets the TDX ticket update URL
 * 
 * All of these functions are **only** designed to work on the *ticket update* page,
 * located at this URL.
 */
export const getUrl = (ticketID: TicketID) => `${TICKETS_BASE_URL}/Update?TicketID=${ticketID}`;

/**
 * Gets the Save button element,
 * which submits the update.
 */
export function getSaveButton() {
	const saveEl = <HTMLButtonElement>document.querySelector("button[type=submit]#btnSubmit");
	if (saveEl === null) {
		throw new DomParseError();
	}
	return saveEl;
}

/**
 * Gets the "New Status" form select element
 *
 * @throws an {@link DomParseError} if not found
 */
function getStatusChangeEl() {
	const statusEl = <HTMLInputElement>document.querySelector("#NewStatusId");
	if (statusEl === null) {
		throw new DomParseError();
	}
	return statusEl;
}

/**
 * Gets the "New Status" form select element
 * Will return undefined if New Status is blank or unexpected
 *
 * @throws a bubbled {@link DomParseError} if the new status element is not found
 */
export function getNewStatus(): Status | undefined {
	return getStatusFromFormValue(getStatusChangeEl().value);
}
/**
 * Sets the "New Status" form select element
 * to a different status
 *
 * @throws a bubbled {@link DomParseError} if the new status element is not found
 */
export function setNewStatus(newStatus: Status) {
	getStatusChangeEl().value = newStatus;
	/*const statusSelectEl = getStatusChangeEl();
	for (const child of statusSelectEl.children) {
		if (!(child instanceof HTMLOptionElement)) {
			// this is not the case
			continue;
		}
		if (child.textContent === newStatus) {
			statusSelectEl.value = child.value;
			return;
		}
	}
	throw new Error(`Failed to set status to "${newStatus}": Could not find that status name as an option.`);*/
}

/**
 * Sets the WYSIWYG editor to be the prefill {@param data}.
 * This strips out all supported brace-enclosed variables,
 * updating their values or setting the cursor
 *
 * Currently supported brace values:
 * - all in {@link replacePrefillVariables}
 * - `{cursor}` from {@link moveCursorToDesignatedLocationAndStrip}
 *
 * @remarks
 * Is async because sometimes getting data is async
 *
 * @throws a {@link DomParseError} if there are issues finding the WYSIWYG element
 */
export async function setPrefill(data: LimitedHTML): Promise<void> {
	const filledData = await replacePrefillVariables(data);
	setComments(filledData);
	moveCursorToDesignatedLocationAndStrip(await getWysiwygBody(), await getWysiwygWindow());
}
/**
 * Sets the value of the Comments WYSIWYG editor
 * to the specified HTML
 *
 * @remarks
 * Some HTML is stripped on submission (e.g. `<script>`s)
 */
async function setComments(comments: LimitedHTML): Promise<void> {
	(await getWysiwygBody()).innerHTML = comments;
}
/**
 * Replaces variables in the HTML string
 * with their dynamic values
 *
 * Currently supported variables:
 * - `{client.name.first}`, `{client.name.last}`, `{client.name.full}` The client's listed name
 * - `{self.name.first}`, `{self.name.last}`, `{self.name.full}` Your listed name
 * - `{ticket.number}` The ticket number of the current ticket
 *
 * Will `log.e` if there are issues replacing a variable
 * due to a network error or otherwise.
 * However, the variable will still be stripped.
 *
 * @remarks
 * Some HTML is stripped on submission (e.g. `<script>`s)
 */
async function replacePrefillVariables(comments: LimitedHTML): Promise<LimitedHTML> {
	/**
	 * Replaces all instanes of {@param variableName} wrapped in braces (`{}`)
	 * with the {@param newValue}
	 * in-place on the variable `comments`
	 */
	function replaceWith(variableName: string, newValue: string) {
		//return comments.split(`{${variableName}}`).join(newValue);
		// escape special regex characters
		const cleanedSearch = variableName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		comments = comments.replace(new RegExp(`\\{${cleanedSearch}\\}`, "g"), newValue);
	}
	try {
		const clientName = parseName(getRequestor().name);
		// no further lines should fail
		replaceWith("client.name.first", clientName.first);
		replaceWith("client.name.last", clientName.last);
		replaceWith("client.name.full", clientName.full);
	} catch {
		log.e("Failed to properly get clientName. Client name variable replacement will fail.");
		log.i("Replacing client name variables with blanks...");
		replaceWith("client.name.first", "");
		replaceWith("client.name.last", "");
		replaceWith("client.name.full", "");
	}
	try {
		const selfName = parseName((await getCurrentPerson()).name);
		// no further lines should fail
		replaceWith("self.name.first", selfName.first);
		replaceWith("self.name.last", selfName.last);
		replaceWith("self.name.full", selfName.full);
	} catch {
		log.e("Failed to properly get selfName. Self name variable replacement will fail.");
		log.i("Replacing self name variables with blanks...");
		replaceWith("self.name.first", "");
		replaceWith("self.name.last", "");
		replaceWith("self.name.full", "");
	}
	try {
		replaceWith("ticket.number", getCurrentTicketNumber().toString());
	} catch {
		log.e("Failed to properly get ticket.number. ticket.number variable replacement will fail.");
		log.i("Replacing ticket.number variables with blanks...");
		replaceWith("ticket.number", "");
	}

	for (const { index: openingBraceIndex } of comments.matchAll(/{/g)) {
		const closingBraceIndex = comments.indexOf("}", openingBraceIndex);
		const attemptedVariable = comments.substring((openingBraceIndex ?? 0) + 1, closingBraceIndex);
		if (attemptedVariable !== "cursor") {
			log.w(`Attempted to use unknown brace variable ${attemptedVariable}`);
		}
	}
	//res(comments);
	return comments;
}
/**
 * Finds the smallest child node which has the text value
 * Will return the first instance if there are multiple
 *
 * @returns the node or null if not found
 *
 * @remarks
 * May return a text node, not necessarily an element.
 */
function findChildWithinText(root: Node, searchFor: string): Node | null {
	for (const childNode of root.childNodes) {
		if (childNode.textContent?.indexOf(searchFor) !== -1) {
			// found here
			// return deeper level (recurse) or this el
			return findChildWithinText(childNode, searchFor) ?? childNode;
		}
	}
	return null;
}
/**
 * Sets the cursor within an element
 * to where the text `{cursor}` is,
 * and deletes this text literal
 *
 * @remarks
 * If no {cursor} designation found, will not move the cursor
 * 
 * @todo This does not work
 * Will not focus within the iframe without a click
 * from the user
 */
function moveCursorToDesignatedLocationAndStrip(contentEditableElement: HTMLElement, window: Window): void {
	const nodeToMoveCursorTo = findChildWithinText(contentEditableElement, "{cursor}");
	if (nodeToMoveCursorTo === null) return;

	const range = document.createRange();
	range.selectNodeContents(contentEditableElement); // select all
	//range.setStart(child, 0);
	range.setEnd(nodeToMoveCursorTo, 0); // # of elements to offset
	range.collapse(false); // collapse range to false=end
	const selection = window.getSelection(); // get the selection
	if (selection === null) {
		// only null if display is none on the element
		log.e("Failed to get selection");
	} else {
		selection.removeAllRanges(); // remove current selection
		selection.addRange(range); // set the range to the current selection
	}
	
	// now remove that node
	if (nodeToMoveCursorTo.parentElement === null) {
		// should not happen
		log.e("Parent element to move the cursor to is null... cannot remove {cursor} variable!");
	} else {
		nodeToMoveCursorTo.parentElement.removeChild(nodeToMoveCursorTo);
	}
}
