import { DomParseError } from "utils/errors";
import { TICKETS_BASE_URL } from "./shared";
/**
 * Gets the TDX ticket create URL
 * 
 * All of these functions are **only** designed to work on the *ticket create* page,
 * located at this URL.
 */
export const getUrl = () => `${TICKETS_BASE_URL}/New`;

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

const quickSelectOptions = [
	{
		label: "Quick select...",
		value: "",
	},
	{
		label: "Incident",
		value: "todo", // todo
	},
	{
		label: "Service Request",
		value: "todo", // todo
	},
	{
		label: "Classtech Problem Report",
		value: "todo", // todo
	},
];
export function getFormBox() {
	const formBox = document.querySelector("div.form-group.gutter-top");
	if (formBox === null || !(formBox instanceof HTMLElement)) {
		throw new DomParseError();
	}
	return formBox;
}

export function generateQuickSelect() {
	const quickSelectEl = document.createElement("select");
	
	for (const option of quickSelectOptions) {
		const optionEl = document.createElement("option");
		optionEl.textContent = option.label;
		optionEl.value = option.value;
		// todo listeners should change the form when selected
	}
	
	// todo: set active the current form, or [0] ("Quick select...") if not in the list of quick forms
	
	return quickSelectEl;
}
