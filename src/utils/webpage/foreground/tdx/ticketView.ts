import { DomParseError } from "utils/errors";
import type { TicketID } from "utils/tdx/types/ticket";
import { log } from "utils/logger";
import { TICKETS_BASE_URL } from "./shared";
/**
 * Gets the TDX ticket view URL
 * 
 * All of these functions are **only** designed to work on the *ticket view* page,
 * located at this URL.
 */
export const getUrl = (ticketID: TicketID) => `${TICKETS_BASE_URL}/TicketDet.aspx?TicketID=${ticketID}`;

/**
 * Gets the Save button element on the Comment dropdown,
 * which submits the comment.
 */
export function getCommentSaveButton() {
	const saveEl = <HTMLInputElement>document.querySelector("input[type=submit]#btnSaveComment");
	// we love our type guards
	if (saveEl === null) {
		throw new DomParseError();
	}
	return saveEl;
}
export function getCommentMakePrivateButton() {
	const makePrivateEl = <HTMLInputElement>document.querySelector("input[name=chkMarkCommentsPrivate]");
	if (makePrivateEl === null) {
		throw new DomParseError();
	}
	return makePrivateEl;
}

export function commentNotifyIsEmpty() {
	const notifyDisplayEl = <HTMLSpanElement>document.querySelector("#divComment button.ms-choice > span");
	if (notifyDisplayEl === null) {
		throw new DomParseError();
	}
	return notifyDisplayEl.classList.contains("placeholder");
}

export function getCommentBox() {
	const commentWrapperEl = document.querySelector("#divComment");
	if (commentWrapperEl === null || !(commentWrapperEl instanceof HTMLElement)) {
		throw new DomParseError();
	}
	return commentWrapperEl;
}

/**
 * Scrolls {@param element} into view
 * accounting for the offset due to the header
 */
export function scrollIntoViewWithHeader(element: HTMLElement) {
	element.scrollIntoView();
	// correct offset
	const header = document.querySelector("#divHeader");
	if (header !== null) {
		window.scrollBy({ top: -header.clientHeight, left: 0, behavior: "instant" });
	}
}

/**
 * Returns an action button from the Actions list
 * @returns the element or null if not found
 * @throws a {@link DomParseError} if the actions dropdown menu was not found
 */
function getActionEl(actionTitle: string): HTMLElement | null {
	//const actionEls = document.querySelector("#drpActions > .dropdown-menu")?.children;
	const actionEls = document.querySelectorAll("#drpActions > .dropdown-menu li");
	if (actionEls === null) {
		throw new DomParseError();
	}
	for (const actionEl of actionEls) {
		if (actionEl.textContent?.trim() === actionTitle) {
			if (actionEl instanceof HTMLElement) { // should always be true
				return actionEl;
			} else {
				log.w(`Found the proper element, but it was of type ${actionEl.constructor?.name || actionEl}`);
			}
		}
	}
	return null;
}

/**
 * Grays out an action from the Actions list
 * requiring a double-click to click it
 *
 * {@param actionTitle} is case-sensitive.
 *
 * @throws an {@link Error} if the {@param actionTitle} was not found in the actions list
 */
const doubleClickDelayMs = 1000;
function grayOutAction(actionTitle: string) {
	const actionEl = getActionEl(actionTitle);
	if (actionEl === null) {
		throw new Error("Action title not found");
	}
	if (actionEl.parentElement === null) {
		throw new DomParseError();
	}
	const innerLink = actionEl.children[0]; // actionEl.querySelector("a");
	if (innerLink === null || !(innerLink instanceof HTMLElement)) {
		throw new DomParseError();
	}
	//actionEl.setAttribute("disabled", "true");
	const prevAction = actionEl.getAttribute("onclick");
	const prevLink = innerLink.getAttribute("href");
	const prevDataToggle = innerLink.getAttribute("data-toggle");
	// clear out
	const fakeOutEl = <HTMLElement>actionEl.cloneNode(true);
	const fakeOutLinkEl = <HTMLElement>fakeOutEl.children[0];
	// our decoy will have removed attributes and event listeners
	actionEl.parentElement?.insertBefore(fakeOutEl, actionEl);
	// this gets rid of most functionality
	fakeOutEl.removeAttribute("onclick");
	// this gets rid of add to work and unassign functionality
	fakeOutLinkEl.removeAttribute("href");
	// this gets rid of add to workspace functionality
	fakeOutEl.removeAttribute("data-toggle");
	const deactivateLink = () => {
		stylizeGrayedOut(fakeOutLinkEl);
		actionEl.style.display = "none";
		fakeOutEl.style.display = "block";
	};
	deactivateLink();
	const activateLink = () => {
		resetStylizeGrayedOut(fakeOutLinkEl);
		if (prevAction !== null) actionEl.setAttribute("onclick", prevAction);
		if (prevLink !== null) actionEl.setAttribute("href", prevLink);
		actionEl.style.display = "block";
		fakeOutEl.style.display = "none";
	};

	const actionsDropdown = document.querySelector("#drpActions");
	if (actionsDropdown === null || !(actionsDropdown instanceof HTMLElement)) {
		throw new DomParseError();
	}

	let lastClick = 0;
	let resetStateTimeout: NodeJS.Timeout | null = null;
	const clickActionButtonHandler = () => {
		// if first click
		if (Date.now() - lastClick > doubleClickDelayMs) {
			// reopen- TDX will close otherwise
			//evt.preventDefault();
			requestAnimationFrame(() => actionsDropdown.classList.add("open"));
			// activate
			activateLink();
			// prepare to deactivate
			resetStateTimeout = setTimeout(deactivateLink, doubleClickDelayMs);
		} else {
			// second click
			// click action has been triggered by TDX
			// deactivate now
			if (resetStateTimeout !== null) {
				clearTimeout(resetStateTimeout);
			}
			deactivateLink();
		}
		lastClick = Date.now();
	};
	actionEl.addEventListener("click", clickActionButtonHandler);
	fakeOutEl.addEventListener("click", clickActionButtonHandler);
}
function stylizeGrayedOut(element: HTMLElement) {
	// based on chrome's user-agent light mode default for buttons
	element.style.backgroundColor = "rgba(239, 239, 239, 0.3)";
	element.style.color = "rgba(16, 16, 16, 0.3)";
	element.style.borderColor = "rgba(118, 118, 118, 0.3)";
}
function resetStylizeGrayedOut(element: HTMLElement) {
	// based on chrome's user-agent light mode default for buttons
	element.style.backgroundColor = "";
	element.style.color = "";
	element.style.borderColor = "";
}

/**
 * Grays out actions from the Actions list
 * requiring a double-click to click each one
 *
 * Each entry in {@param actionTitles} is case-sensitive.
 *
 * @throws an {@link Error} if one or more of the {@param actionTitles} were not found in the actions list
 */
export function grayOutActions(actionTitles: Array<string>) {
	// todo: gray out
	// todo: have #drpActions stay open (re-add open class) on first click
	const failedToGrayOut = [];
	for (const actionTitle of actionTitles) {
		try {
			grayOutAction(actionTitle);
		} catch {
			failedToGrayOut.push(actionTitle);
		}
	}
	if (failedToGrayOut.length > 0) {
		throw new Error(`Failed to gray out actions: ${failedToGrayOut.reduce((accum, curr) => `${accum}, ${curr}`, "").slice(2)}`);
	}
}
