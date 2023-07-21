import { DomParseError } from "utils/errors";
import type { TicketID } from "utils/tdx/types/ticket";
import { netIDFromEmail } from "utils/tdx/types/person";
import { log } from "utils/logger";
import { TICKETS_BASE_URL, getRequestor } from "./shared";
import { openWindowWithPost } from "utils/postNewWindow";
import { FetchErrorMessage, getDomFromText, verifyFetchSuccess } from "utils/fetch";
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
	//const prevAction = actionEl.getAttribute("onclick");
	//const prevLink = innerLink.getAttribute("href");
	//const prevDataToggle = innerLink.getAttribute("data-toggle");
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
		//if (prevAction !== null) actionEl.setAttribute("onclick", prevAction);
		//if (prevLink !== null) actionEl.setAttribute("href", prevLink);
		//if (prevDataToggle !== null) actionEl.setAttribute("data-toggle", prevDataToggle);
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
	actionEl.addEventListener("click", clickActionButtonHandler); // should always be first click
	fakeOutEl.addEventListener("click", clickActionButtonHandler); // should always be second click
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

/**
 * Hides all details except for Responsibility, Request Area, and Age
 * from the details section.
 *
 * Full details can be shown again by clicking the dropdown toggle that is added
 *
 * @throws a {@link DomParseError} if there was trouble finding details
 */
export function collapseDetailsExceptFor(idsOfDetailsToKeep: Array<string>) {
	const detailEls: Array<HTMLElement> = [];
	const detailsOuter = document.querySelector("#divDetails");
	if (detailsOuter === null) {
		throw new DomParseError();
	}
	const detailsInner = detailsOuter.children[1]; // #divDetails > div
	if (detailsInner === null || !(detailsInner instanceof HTMLElement)) {
		throw new DomParseError();
	}
	detailsInner.querySelectorAll<HTMLDivElement>("div.disp-group").forEach(detailEl => {
		detailEls.push(detailEl);
	});
	//#divCustomAttributes
	const tagsEl = document.querySelector("#divTags");
	if (tagsEl !== null && tagsEl instanceof HTMLElement) {
		detailEls.push(tagsEl);
		// move this in to the main div for better organization
		//while (oldParent.hasChildNodes()) newParent.appendChild(oldParent.firstChild);
		detailsInner.append(tagsEl);
	}
	const detailsCustom = document.querySelectorAll<HTMLDivElement>("#divCustomAttributes div.disp-group");
	if (detailsCustom !== null) {
		detailEls.concat(...detailsCustom);
		// move this in to the main div for better organization
		detailsInner.append(...detailsCustom);
	}
	const elsToHide = detailEls.filter(el => !idsOfDetailsToKeep.includes(el.id));
	// add dropdown to toggle
	const showDetailsToggle = document.createElement("div");
	const icon = document.createElement("i");
	const text = document.createElement("span");
	icon.className = "fa fa-lg";
	const hideExtraDetails = () => {
		elsToHide.forEach(el => el.style.display = "none");
		text.textContent = "Show all";
		icon.classList.add("fa-caret-right");
		icon.classList.remove("fa-caret-down");
		// reformat details box CSS
		detailsInner.style.display = "flex";
		detailsInner.style.flexDirection = "row";
		detailsInner.style.gap = "1em";
	};
	const showExtraDetails = () => {
		elsToHide.forEach(el => el.style.display = "block");
		text.textContent = "Collapse";
		icon.classList.remove("fa-caret-right");
		icon.classList.add("fa-caret-down");
		// revert details box CSS
		detailsInner.style.display = "";
		detailsInner.style.flexDirection = "";
		detailsInner.style.gap = "";
	};
	showDetailsToggle.style.cursor = "pointer";
	showDetailsToggle.appendChild(icon);
	showDetailsToggle.appendChild(text);
	let detailsShown = false;
	showDetailsToggle.addEventListener("click", () => {
		if (detailsShown) {
			hideExtraDetails();
		} else {
			showExtraDetails();
		}
		detailsShown = !detailsShown;
	});
	detailsOuter.insertBefore(showDetailsToggle, detailsInner);

	hideExtraDetails();
}

/**
 * Returns the client's NetID
 * based on the requestor email
 * or null if not found
 *
 * @todo search in ticket comments and details for a NetID
 * if not present in the requestor's email
 */
function getClientNetID(): string | null {
	const emailField = getRequestorFieldDetails().children[1];
	if (emailField !== null && emailField.textContent !== null) {
		return netIDFromEmail(emailField.textContent.trim()); // will be null if not a U of I email
	}
	return null;
}
/**
 * Returns the requestor field element
 *
 * @throws {@link DomParseError}
 */
function getRequestorFieldPanel() {
	const requestorFieldEl = document.querySelector(".panel-person-card .media");
	if (requestorFieldEl === null) {
		throw new DomParseError();
	}
	return requestorFieldEl;
}
/**
 * Returns the requestor field body element
 * where the name, email, etc are listed
 *
 * @throws {@link DomParseError}
 */
function getRequestorFieldDetails() {
	const requestorFieldBodyEl = getRequestorFieldPanel().querySelector(".media-body");
	if (requestorFieldBodyEl === null) {
		throw new DomParseError();
	}
	return requestorFieldBodyEl;
}
/**
 * Adds a button next to the Requestor field
 * which copies the NetID of the client, if found.
 *
 * @throws a {@link DomParseError} if the requestor field panel could not be found
 * (may be bubbled)
 */
export function addCopyNetIDButton() {
	const requestorFieldLeft = getRequestorFieldPanel().querySelector(".media-left");
	if (requestorFieldLeft === null) {
		throw new DomParseError();
	}
	const netID = getClientNetID();
	const copyButton = document.createElement("button");
	copyButton.textContent = "Copy NetID";
	copyButton.setAttribute("type", "button");
	/*
	position: absolute;
    top: 5em;
    right: 2em;
	*/
    copyButton.style.maxWidth = "60px"; // based on prof pic
    copyButton.style.wordBreak = "break-word";
	copyButton.style.fontWeight = "0.8em"; // save some space
	copyButton.style.backgroundColor = "#bce8f1";
    copyButton.style.border = "2px solid #d9edf7";
    copyButton.style.borderRadius = "10px";
	requestorFieldLeft.appendChild(copyButton); // below the profile picture
	if (netID === null) {
		copyButton.disabled = true;
		copyButton.style.backgroundColor = "#d2d9da";
		copyButton.style.color = "#818181";
		copyButton.style.cursor = "not-allowed";
	} else {
		copyButton.textContent = `Copy ${netID}`;
		copyButton.style.cursor = "pointer";
		copyButton.addEventListener("click", async () => {
			navigator.clipboard.writeText(netID)
				.then(() => log.i(`Successfully copied ${netID} to clipboard`),
					() => log.e(`Failed to copy ${netID} to clipboard`));
		});
	}
}

/**
 * Adds a button to open the i-card tool with the client's NetID, if found
 *
 * @throws a bubbled {@link DomParseError} if the requestor field panel details
 * could not be found
 *
 * @internalRemarks
 * Planned implementation:
 * Adds 3 buttons below to the Requestor field
 * which opens Cerebro, i-Card, and ISA, respectively,
 * with the client's NetID, if found.
 */
export function addOpenToolsButtons() {
	const requestorField = getRequestorFieldPanel();
	const netID = getClientNetID();
	const buttonIcard = document.createElement("button");
	buttonIcard.textContent = "i-card";
	buttonIcard.setAttribute("type", "button");
	buttonIcard.className = "btn btn-warning";
	//const buttonCerebro = document.createElement("button");
	//buttonCerebro.textContent = "Cerebro";
	//buttonCerebro.setAttribute("type", "button");
	//buttonCerebro.className = "btn btn-secondary";
	//const buttonIsa = document.createElement("button");
	//buttonIsa.textContent = "ISA";
	//buttonIsa.setAttribute("type", "button");
	//buttonIsa.className = "btn btn-info";

	requestorField.appendChild(buttonIcard);
	//requestorField.appendChild(buttonCerebro);
	//requestorField.appendChild(buttonIsa);
	if (netID === null) {
		// could just open the tool without NetID but nah
		// gray out buttons
		buttonIcard.setAttribute("disabled", "true");
		//buttonCerebro.setAttribute("disabled", "true");
		//buttonIsa.setAttribute("disabled", "true");
		buttonIcard.classList.add("btn-disabled");
		//buttonCerebro.classList.add("btn-disabled");
		//buttonIsa.classList.add("btn-disabled");
	} else {
		buttonIcard.addEventListener("click", () => {
			//window.open(`https://icardapps.uillinois.edu/appIcardQuery/DSPIndex.cfm?uin=${uin}`);
			openWindowWithPost("https://icardapps.uillinois.edu/appIcardQuery/act_uin_lookup.cfm", "i-card", {
				"descript": "UIUC Tech Services Student Worker Query", // not really necessary... becomes query
				"UIN": "",
				"Network_ID": netID,
				"SSN": "",
				"first_name": "",
				"mid_name": "",
				"last_name": "",
				"birthdate": "",
				"submit": "Search",
			}); // will 302 to a UIN GET page
		});
		/*buttonCerebro.addEventListener("click", () => {
			// todo: need csrfmiddlewaretoken from cerebro
			// cerebro: document.querySelector("input[name=\"\"]")
			openWindowWithPost("https://cerebro.techservices.illinois.edu/", "cerebro", {
				"csrfmiddlewaretoken": "todo",
				"uin_or_netid": "netid",
				"submit": "Get User Information",
			}); // will 302 to a GET (somehow)
		});*/
		/*buttonIsa.addEventListener("click", () => {
			// need myrandomid
			openWindowWithPost("https://identity.uillinois.edu:11443/iamAccountSupport/jsp/index.do", "isa", {
				"myrandomid": "todo",
				"SEARCH_BY": "NetID",
				"INPUT_SEARCH": "alappin",
				"BNT_SEARCH": "Search",
		});*/
	}
}

/**
 * Shows recent tickets from the requestor below the requestor profile
 * if there are any.
 * 
 * @remarks
 * Uses the same recent tickets that are seen in the ticket edit page
 */
export function addRecentRequestorTickets(): Promise<void> {
	return fetch(`https://help.uillinois.edu/TDNext/Apps/40/Tickets/Requestor?requestorUid=${getRequestor().id}&FormId=107`)
		.then(res => {
			if (!res.ok) {
				throw new Error("Res not ok");
			}
			return res.json();
		})
		.then(json => {
			return json.cardHtml;
			// also note requestor.jsondata { id, refid, accountid, accountname, email, name, phone, priorityid, priorityname }
		})
		.then(getDomFromText)
		.then(dom => {
			const recentRequests = dom.querySelector("#divRequestorRecentRequests");
			if (recentRequests === null) {
				// not really a DomParseError since this is a sub network request
				throw FetchErrorMessage.UNEXPECTED_RESPONSE;
			}
			// this panel has requestor field, tasks, and attachments
			const rightColumn = document.querySelector("#divContent")?.children[0]?.children[1];
			if (!rightColumn) {
				throw new Error("Could not find the right panel to add the request to");
			} else {
				// put in place below other right column stuff
				rightColumn.appendChild(recentRequests);
			}
		});
}