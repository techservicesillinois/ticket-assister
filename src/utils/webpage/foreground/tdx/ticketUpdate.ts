import { DomParseError } from "utils/errors";
import { Status, getStatusFromFormValue } from "utils/tdx/formNames";
import type { TicketID } from "utils/tdx/types/ticket";
import { TICKETS_BASE_URL } from "./shared";
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
}