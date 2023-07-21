import { BASE_URL } from "config";
import { DomParseError } from "utils/errors";
import { log } from "utils/logger";
import { ITDXPerson, netIDFromEmail } from "utils/tdx/types/person";
import type { AtLeast } from "utils/types";

/**
 * Gets the element of the WYSIWYG editor on screen.
 *
 * Works on multiple pages, including ticketCreate and ticketView (for comments)
 */
function getWysiwygEl() {
	const editorEl = document.querySelector<HTMLIFrameElement>("iframe.cke_wysiwyg_frame");
	if (editorEl === null) {
		throw new DomParseError();
	}
	return editorEl;
}
/**
 * Gets the {@link window} of the WYSIWYG editor on screen.
 *
 * Works on multiple pages, including ticketCreate and ticketView (for comments)
 */
export function getWysiwygWindow() {
	const editorEl = getWysiwygEl();
	if (editorEl.contentWindow === null) {
		throw new DomParseError();
	}
	return editorEl.contentWindow;
}
/**
 * Gets the {@link Document} of the WYSIWYG editor on screen.
 *
 * Works on multiple pages, including ticketCreate and ticketView (for comments)
 */
export function getWysiwygDocument() {
	const editorEl = getWysiwygEl();
	if (editorEl.contentDocument === null) {
		throw new DomParseError();
	}
	return editorEl.contentDocument;
}
/**
 * Gets the body element of the WYSIWYG editor
 *
 * Works on multiple pages, including ticketCreate and ticketView (for comments)
 *
 * @internalRemarks
 * Does not return a HTMLBodyElement because https://stackoverflow.com/a/35297274
 */
export function getWysiwygBody(): HTMLElement {
	return getWysiwygDocument().body;
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

/**
 * Gets as much information about a client in the contact box as possible.
 * 
 * Guaranteed to get the requestor's full name and email.
 * If they have a TDX account, will get their TDX ID and try to get their NetID and UIN
 * 
 * Does **not** work on the ticket create page
 * until the requestor field has been completed
 * 
 * @throws a {@link DomParseError} if was unable to find it in the ticket update screen
 *
 * @remarks
 * People who are not in TDX (i.e. requestor field not linked)
 * will not have a TDX ID nor NetID or UIN,
 * so only a name will be returned
 */
export function getRequestor(): AtLeast<ITDXPerson, "name" | "email"> {
	const personCard = document.querySelector(".panel-person-card .media-body");
	// this is required
	if (personCard === null) {
		throw new DomParseError();
	}

	//const nameEl = personCard.children[0];
	const nameEl = personCard.querySelector(".media-heading");
	// name is required
	if (nameEl === null) {
		throw new DomParseError();
	}
	const name = nameEl.textContent?.trim();
	if (!name) {
		throw new DomParseError();
	}
	const tdxPersonUrl = nameEl.children[0]?.getAttribute("href");

	let id;
	if (tdxPersonUrl) {
		/*const startIdx = tdxPersonUrl.indexOf("?U=");
		if (startIdx !== -1) {
			id = tdxPersonUrl.substring(startIdx + 3);
		}*/
		const queryStringStartIndex = tdxPersonUrl.indexOf("?");
		// if query string found
		if (queryStringStartIndex !== -1) {
			const queryParams = new URLSearchParams(tdxPersonUrl.substring(queryStringStartIndex + 1));
			id = queryParams.get("U") ?? undefined;
		}
	}

	let email;
	for (const aEl of personCard.querySelectorAll("div > a[href]")) {
		const href = aEl.getAttribute("href");
		if (href !== null && href.substring(0, 7) === "mailto:") {
			email = href.substring(7);
			break;
		}
	}
	// email is required
	if (email === undefined) {
		throw new DomParseError();
	}

	// todo get uin
	let uin;
	const uinEl = personCard.children[4];
	if (uinEl !== null && uinEl.textContent !== null) {
		// will auto-trim
		if (!Number.isNaN(Number(uinEl.textContent))) {
			uin = Number(uinEl.textContent); //parseInt(uinEl.textContent, 10) //+uinEl.textContent
		}
	}
	
	return {
		name,
		email, // todo
		uin, // if possible
		netid: netIDFromEmail(email) ?? undefined, // if possible
		id, // if possible
	};
}