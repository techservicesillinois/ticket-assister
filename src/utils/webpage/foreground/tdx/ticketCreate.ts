import { DomParseError } from "utils/errors";
import { TICKETS_BASE_URL } from "./shared";
import { CreateMethod, getAttributeFor } from "utils/tdx/formNames";
import { injectScript } from "utils/windowScript";
import { watchDOMChanges } from "utils/lib/observeDOM";
import { log } from "utils/logger";

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

/**
 * The quick select labels
 * and their associated select values
 */
export const quickSelectOptions = [
	{
		label: "Incident",
		value: "350",
	},
	{
		label: "Service Request",
		value: "107",
	},
	{
		label: "Classtech Problem Report",
		value: "134",
	},
];
/**
 * The value of the entry in {@link quickSelectOptions}
 * which is the default to show when one of the listed forms is not shown
 *
 * @remarks
 * Is not a value that the form should ever be set to.
 */
const DEFAULT_SELECT = "-1";

export function getFormBox() {
	const formBox = <HTMLDivElement>document.querySelector("div.form-group.gutter-top");
	if (formBox === null) {
		throw new DomParseError();
	}
	return formBox;
}
function getFormSelectEl() {
	const formSelectEl = <HTMLSelectElement>document.querySelector("select#FormID");
	if (formSelectEl === null) {
		throw new DomParseError();
	}
	return formSelectEl;
}

/**
 * Adds an event listener for when the form id was changed
 * either by the user or by us
 * 
 * @remarks
 * Most HTML elements are reset each time this listener is fired.
 * 
 * @internalRemarks
 * Can't use jquery directly (see notes in {@link setFormValue})
 * 
 * @todo clean this up
 * relies on setTimeout() to handle a change
 */
export function formChangeListen(listener: () => void) {
	//formSelectEl.addEventListener("input", listener);
	// *vomits jquery*
	//window.$("select#FormID").on("change", listener);

	const listenerOnRefresh = () => {
		setTimeout(listener, 600);
	};

	const formEl = document.querySelector("#select2-chosen-1");
	if (formEl === null) {
		throw new DomParseError();
	}
	watchDOMChanges(formEl, listenerOnRefresh);
	const resetButton = document.querySelector("button.js-form-reset");
	if (resetButton === null) {
		log.w("Could not find reset button to add click listener to. May drop some events.");
	} else {
		resetButton.addEventListener("click", listenerOnRefresh);
	}
}

/**
 * Sets the Form ID for the ticket,
 * hiding/showing relavent fields
 *
 * @internalRemarks
 * TDX uses select2: https://select2.org/programmatic-control/events
 * 
 * This is so stupid.
 * We need to access window's jquery.
 * And we need to pass this id.
 * All we need to do is run `window.$("#FormID").select2("val", id).trigger("change");`
 * Here we go...
 */
export function setFormValue(id: string) {
	beaconSetFormValue(id);
	injectScript("triggerFormChange.js");
}
/**
 * Sets the ID which should be used
 * in `windowScripts/triggerFormChange.js`
 */
function beaconSetFormValue(id: string) {
	if (document.querySelector("#beacon-formValue")) {
		log.w(`A beacon form value already exists: Trying to set id ${id} will probably not work in favor of the already existing beacon.`);
	}
	const beacon = document.createElement("div");
	beacon.setAttribute("id", "beacon-formValue");
	beacon.setAttribute("beacon-value", id);
	document.body.appendChild(beacon);
}

/**
 * Styles {@param el} to look like an unselected button
 */
function styleNotActive(el: HTMLElement) {
	el.style.border = "3px outset #707070";
}
/**
 * Styles {@param el} to look like a pressed in button
 */
function styleActive(el: HTMLElement) {
	el.style.border = "3px inset #707070";
}

export function generateQuickSelect() {
	const quickSelectEl = document.createElement("div");
	quickSelectEl.style.display = "flex";
	quickSelectEl.style.flexDirection = "row";
	quickSelectEl.style.gap = "0.5em";

	const formSelectEl = getFormSelectEl();
	
	const buttons: Array<HTMLButtonElement> = [];
	for (const option of quickSelectOptions) {
		const optionEl = document.createElement("button");
		optionEl.textContent = option.label;
		optionEl.value = option.value;
		optionEl.type = "button"; // don't submit on press, tdx!
		optionEl.addEventListener("click", () => {
			setFormValue(option.value); //optionEl.value
		});
		optionEl.className = "btn btn-info"; //btn-secondary
		styleNotActive(optionEl);
		buttons.push(optionEl);
		quickSelectEl.appendChild(optionEl);
	}

	
	formChangeListen(() => {
		const foundQuickSelect = quickSelectOptions.find(qsa => qsa.value === formSelectEl.value);
		if (foundQuickSelect) {
			// this should exist
			const associatedButton = buttons.find(button => button.value === foundQuickSelect.value);
			// clear out old
			buttons.forEach(button => styleNotActive(button));
			if (associatedButton !== undefined) {
				styleActive(associatedButton);
			}
		}
	});
	
	return quickSelectEl;
}

/**
 * Sets the form's Created Via value
*
 * @throws an {@link DomParseError} if the input el could not be found
 * 
 * @remarks
 * Setting this value will persist on form change
 * from TDX's default
 * 
 * Will not detect the Created Via attribute
 * unlesss a form using it has already been selected
 */
export function setCreatedVia(via: CreateMethod) {
	const el = <HTMLSelectElement>document.querySelector(`select[name="${getAttributeFor("Created Via")}"]`);
	if (el === null) {
		throw new DomParseError();
	}
	el.value = via;
}

/**
 * @returns the Additional Contacts input *group*
 * @throws a {@link DomParseError} if not found
 */
export function getAdditionalContactsEl() {
	// attribute1269 not in formNames.ts
	// so just hardcode
	const el = document.querySelector("#attribute1269-grp");
	if (el === undefined || !(el instanceof HTMLElement)) {
		throw new DomParseError();
	}
	return el;
}

/**
 * @returns the Notify Requestor input element
 * @throws a {@link DomParseError} if not found
 */
export function getNotifyRequestorInputEl() {
	const el = <HTMLInputElement>document.querySelector("input[name=\"Item.NotifyRequestor\"]");
	if (el === undefined) {
		throw new DomParseError();
	}
	return el;
}
