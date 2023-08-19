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