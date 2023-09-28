import { BASE_URL } from "config";
import { DomParseError } from "utils/errors";
import { Status, getStatusFromFormValue } from "utils/tdx/formNames";
import { netIDFromEmail } from "utils/tdx/types/person";
import type { ITDXPerson } from "utils/tdx/types/person";
import type { AtLeast } from "utils/types";

/**
 * The amount of time to wait before trying to get the WYSIWYG El again
 * 
 * Will wait a total of `TRY_AGAIN_MS` * 3 ms max.
 */
const TRY_AGAIN_MS = 400;
/**
 * Gets the element of the WYSIWYG editor on screen.
 *
 * Works on multiple pages, including ticketCreate and ticketView (for comments)
 * 
 * async: waits for iframe to load, if possible
 * 
 * @todo abstract with {@link getAttachmentsEl}
 */
async function getWysiwygEl(): Promise<HTMLIFrameElement> {
	return new Promise((res, rej) => {
		let tries = 0;
		const action = () => {
			const editorEl = document.querySelector<HTMLIFrameElement>("iframe.cke_wysiwyg_frame");
			if (editorEl === null) {
				if (tries++ < 3) {
					// wait for load?
					setTimeout(action, TRY_AGAIN_MS);
				} else {
					rej(new DomParseError());
				}
			} else {
				res(editorEl);
			}
		};
		if (document.readyState === "complete") {
			action();
		} else {
			// window.onDOMContentLoaded fires when all deferred scripts have executed (document.readyState === "interactive")
			// window.onload fires after everything, including stylesheets, images, and iframes (document.readyState === "complete")
			window.addEventListener("load", action, { once: true });
		}
	});
}
/**
 * Gets the {@link window} of the WYSIWYG editor on screen.
 *
 * Works on multiple pages, including ticketCreate and ticketView (for comments)
 */
export async function getWysiwygWindow() {
	const editorEl = await getWysiwygEl();
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
export async function getWysiwygDocument(): Promise<Document> {
	const editorEl = await getWysiwygEl();
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
 * Does not return a HTMLBodyElement because https://stackoverflow.com/a/35297274/8804293
 */
export async function getWysiwygBody(): Promise<HTMLElement> {
	return (await getWysiwygDocument()).body;
}

/**
 * Sets up the Ctrl+K keyboard shortcut
 * when typing in the WYSIWYG editor.
 *
 * @remarks
 * Will only activate for the first editor on the page. This is assuming that there is only 1 editor.
 * Runs on DOMContentLoaded; i.e. this should not be called late
 * 
 * By default, Ctrl+L linking is enabled in the wYSIWYG editor,
 * so this is likely not useful.
 */
export async function enableCtrlKLinkingOnWysiwyg() {
	// contentWindow would work as well
	detectCtrlAndKey("k", await getWysiwygBody(), () => {
		const createLinkEl: HTMLElement | null = document.querySelector(".cke_button.cke_button__link");
		if (createLinkEl === null) {
			throw new Error("Failed to add link: couldn't locate link button");
		} else {
			createLinkEl.click();
		}
	}, true);
}

/**
 * Runs {@param callback} whenever Ctrl+{@param key} is pressed
 * within the {@param element} context
 * 
 * Prevents default if {@param preventDefault}
 */
function detectCtrlAndKey(key: string, element: HTMLElement, callback: () => void, preventDefault = false) {
	element.addEventListener("keydown", event => {
		if (event.key === key && (event.metaKey || event.ctrlKey)) {
			if (preventDefault) {
				event.preventDefault();
			}
			callback();
		}
	});
}
/**
 * Clicks `elementToSubmit` whenever Ctrl+Enter is pressed in the context of `elementToListenOn`
 */
export function submitOnCtrlEnter(elementToListenOn: HTMLElement, elementToSubmit: HTMLElement) {
	detectCtrlAndKey("Enter", elementToListenOn, () => elementToSubmit.click(), true);
}

/**
 * Gets the base URL of the ticket interaction screen
 * which is the prefix for things like view and edit
 */
export const TICKETS_BASE_URL = `${BASE_URL}/Apps/40/Tickets`;

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
	const uinEl = personCard.children[5];
	if (uinEl !== undefined && uinEl.textContent !== null) {
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

/**
 * Collapses an element {@param el}
 * into an expandable accordian
 * with the label {@param label} or blank
 *
 * Hides by default according to {@param hideInitially}
 * 
 * @returns a reference to the created collapser
 *
 * @remarks
 * Assumes that `el.parentElement` exists,
 * namely, that `el` is not the root `html` element.
 *
 * @internalRemarks
 * Different than the dropdown used for hiding ticket view details
 * since that version required hacking around the data
 */
export function collapseEl(el: HTMLElement, label?: string, hideInitially = true) {
	// todo modify tabindex
	const collapser = document.createElement("div");
	const dropdownIcon = document.createElement("i");
	dropdownIcon.className = "fa fa-lg";
	collapser.appendChild(dropdownIcon);
	const labelEl = document.createElement("span");
	collapser.appendChild(labelEl);

	const hide = () => {
		el.style.display = "none";
		dropdownIcon.classList.add("fa-caret-right");
		dropdownIcon.classList.remove("fa-caret-down");
		if (label !== undefined) {
			labelEl.textContent = `Show ${label}`;
		} else {
			labelEl.textContent = "Show more";
		}
	};
	const show = () => {
		el.style.display = "block";
		dropdownIcon.classList.remove("fa-caret-right");
		dropdownIcon.classList.add("fa-caret-down");
		if (label !== undefined) {
			labelEl.textContent = `Hide ${label}`;
		} else {
			labelEl.textContent = "Hide more";
		}
	};
	collapser.style.cursor = "pointer";

	let shown = false;
	collapser.addEventListener("click", () => {
		shown = !shown;
		if (shown) {
			show();
			// shawn
		} else {
			hide();
		}
	});

	if (hideInitially) {
		hide();
	}

	// see @remarks with any concerns
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	el.parentElement!.insertBefore(collapser, el);

	return collapser;
}

/**
 * Runs {@param listener} every time the WYSIWYG el on screen is loaded
 * (i.e. its contentDocument DOM is loaded)
 * which often is right after it has been unloaded in a refresh.
 */
export async function onWysiwygLoad(listener: () => void): Promise<void> {
	const wys = await getWysiwygEl();
	wys.addEventListener("load", listener);
	/*watchDOMChanges(await getWysiwygDocument(), changes => {
		changes.forEach(change => {
			// if indicated that there has been a refresh
			//if (change.target.nodeName === "TITLE")
			//if (change.addedNodes.some((node: Node) => node.nodeType === Node.DOCUMENT_NODE)) { // <html>
			for (const node of change.addedNodes) {
				//if (node.nodeName === "HEAD")
				if (node.nodeType === Node.DOCUMENT_TYPE_NODE) { // <!doctype>
					// let it finish loading
					// todo: listen for Wysiwyg body load
					setTimeout(listener, 100);
					break;
				}
			}
		});
	});*/
	return;
}

/**
 * The `__doPostBack` function defined in TDX's `window`
 *
 * @return true if probable success, false if probably failure
 */
export function doPostBack(eventTarget, eventArgument) {
	let theForm = document.forms['Form1'];
	if (!theForm) {
		theForm = document.Form1;
	}
	if (!theForm.onsubmit || (theForm.onsubmit() != false)) {
		theForm.__EVENTTARGET.value = eventTarget;
		theForm.__EVENTARGUMENT.value = eventArgument;
		theForm.submit();
		// note: page will be refreshed
		return true;
	} else {
		return false;
	}
}

/**
 * Returns the text representation of the status
 * in the top right corner
 * or undefined if the element is not found
 */
function getStatusText(): string | undefined {
	const statusEl = document.querySelector("#thTicket_lblStatus");
	if (statusEl === null) {
		throw new DomParseError();
	}
	return statusEl.textContent ?? undefined;
}

/**
 * Gets the current status, as told by the top right text
 */
export function getCurrentStatus(): Status | undefined {
	const statusText = getStatusText();
	return statusText === undefined
		? undefined
		: getStatusFromFormValue(statusText);
}