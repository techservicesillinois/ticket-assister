import { DomParseError } from "utils/errors";

/**
 * Gets the Save button element,
 * which submits the assign.
 * 
 * @throws a {@link DomParseError} if failed.
 */
export function getSaveButton() {
	const saveEl = <HTMLButtonElement | null>document.querySelector("button#btnAdd");
	if (saveEl === null) {
		throw new DomParseError();
	}
	return saveEl;
}

/**
 * Gets the New Responsibility text input element
 * 
 * @throws a {@link DomParseError} if failed.
 */
export function getNewResponsibilityEl() {
	const el = <HTMLInputElement | null>document.querySelector("input#taluResponsible_txtinput");
	if (el === null) {
		throw new DomParseError();
	}
	return el;
}
/**
 * Displays a notice box
 * on the Ticket Reassign screen
 */
export function showNotice(message: string) {
	const messageEl = document.createElement("p");
	messageEl.style.backgroundColor = "#a3ccf5";
	messageEl.style.color = "#000";
	messageEl.style.padding = "1em";
	messageEl.style.borderRadius = "1em";
	const leadEl = document.createElement("span");
	leadEl.textContent = "Notice: ";
	leadEl.style.fontWeight = "600";
	messageEl.appendChild(leadEl);
	const contentsEl = document.createTextNode(message);
	messageEl.appendChild(contentsEl);
	
	const appendAfter = (() => {
		const pot = document.querySelector("form .container-fluid .gutter-top");
		if (pot === null) return document.body;
		return pot;
	})();
	appendAfter.appendChild(messageEl);
}