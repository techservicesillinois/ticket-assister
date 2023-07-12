import { BASE_URL } from "config";
import { DomParseError } from "utils/errors";
import { log } from "utils/logger";

/**
 * Gets the {@link Document} of the WYSIWYG editor on screen.
 *
 * Works on multiple pages, including ticketCreate and ticketView (for comments)
 */
export function getWysiwygDocument() {
	const editorEl = document.querySelector<HTMLIFrameElement>("iframe.cke_wysiwyg_frame");
	if (editorEl === null || editorEl.contentDocument === null) {
		throw new DomParseError();
	}
	return editorEl.contentDocument;
}
/**
 * Sets up the Ctrl+K keyboard shortcut
 * when typing in the WYSIWYG editor.
 *
 * @remarks
 * Will only activate for the first editor on the page. This is assuming that there is only 1 editor.
 */
export function enableCtrlKLinkingOnWysiwyg() {
	// contentWindow would work as well
	detectCtrlAndKey("k", getWysiwygDocument().body, () => {
		const createLinkEl: HTMLElement | null = document.querySelector(".cke_button.cke_button__link");
		if (createLinkEl === null) {
			log.e("Failed to add link: couldn't locate link button");
		} else {
			createLinkEl.click();
		}
	});
}

/**
 * Runs {@param callback} whenever Ctrl+{@param key} is pressed
 * within the {@param element} context
 */
function detectCtrlAndKey(key: string, element: HTMLElement, callback: () => void) {
	element.addEventListener("keydown", event => {
		if (event.key === key && (event.metaKey || event.ctrlKey)) {
			callback();
		}
	});
}
/**
 * Clicks `elementToSubmit` whenever Ctrl+Enter is pressed in the context of `elementToListenOn`
 */
export function submitOnCtrlEnter(elementToListenOn: HTMLElement, elementToSubmit: HTMLElement) {
	detectCtrlAndKey("Enter", elementToListenOn, () => elementToSubmit.click());
}

/**
 * Gets the base URL of the ticket interaction screen
 * which is the prefix for things like view and edit
 */
export const TICKETS_BASE_URL = `${BASE_URL}/Apps/40/Tickets/`;
