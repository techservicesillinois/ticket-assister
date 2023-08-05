import { DomParseError } from "utils/errors";
import type { TicketID } from "utils/tdx/types/ticket";
import { log } from "utils/logger";
import { TICKETS_BASE_URL, getRequestor } from "./shared";
import { openWindowWithPost } from "utils/postNewWindow";
import { FetchErrorMessage, getDomFromText, verifyFetchSuccess } from "utils/fetch";
import { listener } from "../../link/ticket";
import { receiveMessages, PIPELINE_CEREBRO_TO_TICKET } from "../../link/interface";
import { squishArray } from "utils/stringParser";
import { generateFlagSummaryEl } from "../cerebro";
import { BASE_URL } from "config";
import { getCurrentTicketNumber } from "../../parser/ticket";
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
	if (innerLink === undefined || !(innerLink instanceof HTMLElement)) {
		throw new DomParseError();
	}
	//actionEl.setAttribute("disabled", "true");
	//const prevAction = actionEl.getAttribute("onclick");
	//const prevLink = innerLink.getAttribute("href");
	//const prevDataToggle = innerLink.getAttribute("data-toggle");
	// clear out
	const fakeOutEl0 = <HTMLElement>actionEl.cloneNode(true);
	const fakeOutLinkEl0 = <HTMLElement>fakeOutEl0.children[0]; // this will exist because it does on actionEl
	// our decoy will have removed attributes and event listeners
	actionEl.parentElement?.insertBefore(fakeOutEl0, actionEl);
	// this gets rid of most functionality
	fakeOutEl0.removeAttribute("onclick");
	// this gets rid of add to work and unassign functionality
	fakeOutLinkEl0.removeAttribute("href");
	fakeOutLinkEl0.removeAttribute("onclick");
	// this gets rid of add to workspace functionality
	fakeOutLinkEl0.removeAttribute("data-toggle");
	// now need to re-clone
	const fakeOutEl = <HTMLElement>fakeOutEl0.cloneNode(true);
	const fakeOutLinkEl = <HTMLElement>fakeOutEl.children[0];  // this will exist because it does on fakeOutEl0
	fakeOutEl0.replaceWith(fakeOutEl);
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
	log.i(`Grayed out ${actionTitles.length} actions`);
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
	if (detailsInner === undefined || !(detailsInner instanceof HTMLElement)) {
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
	showDetailsToggle.id = "tkast-details-collapse";
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
export function getClientNetID(): string | null {
	return getRequestor().netid ?? null;
}
/**
 * Returns the requestor field element
 *
 * @throws {@link DomParseError}
 */
function getRequestorFieldPanel() {
	const requestorFieldEl = document.querySelector(".panel-person-card .media");
	if (requestorFieldEl === null || !(requestorFieldEl instanceof HTMLElement)) {
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
	copyButton.style.transition = "color 0.4s ease";
	let timeout: NodeJS.Timeout | null = null;
	const SHOW_FOR_MS = 1200;
	const setMessage = (message: string) => {
		if (timeout !== null) {
			// must wait
			return;
		}
		const prevText = copyButton.textContent;
		copyButton.textContent = message;
		setTimeout(() => {
			copyButton.style.color = "#bce8f1"; // hide
		}, SHOW_FOR_MS - 500);
		timeout = setTimeout(() => {
			copyButton.style.color = "#000"; // show
			copyButton.textContent = prevText;
			timeout = null;
		}, SHOW_FOR_MS);
	};
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
				.then(() => {
					log.i(`Successfully copied ${netID} to clipboard`)
					setMessage("Copied!");
				},
				() => {
					log.e(`Failed to copy ${netID} to clipboard`)
					setMessage("Failed to copy");
				});
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
	const buttonsWrapper = document.createElement("div");
	/*buttonsWrapper.style.display = "flex";
	buttonsWrapper.style.flexDirection = "row";
	buttonsWrapper.style.alignItems = "stretch";*/
	buttonsWrapper.style.display = "table-cell";
	buttonsWrapper.style.paddingLeft = "3em";
	const buttonsWrapperInner = document.createElement("div");
	buttonsWrapperInner.style.display = "flex";
	buttonsWrapperInner.style.flexDirection = "column";
	buttonsWrapperInner.style.alignItems = "stretch";
	buttonsWrapperInner.style.gap = "0.5em";

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
			openWindowWithPost(CEREBRO_URL, "cerebro", {
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
	buttonsWrapperInner.appendChild(buttonIcard);
	//buttonsWrapperInner.appendChild(buttonCerebro);
	//buttonsWrapperInner.appendChild(buttonIsa);
	buttonsWrapper.appendChild(buttonsWrapperInner);
	requestorField.appendChild(buttonsWrapper);
}

/**
 * Shows recent tickets from the requestor below the requestor profile
 * if there are any.
 * 
 * @remarks
 * Uses the same recent tickets that are seen in the ticket edit page
 */
export function addRecentRequestorTickets(): Promise<void> {
	return fetch(`${BASE_URL}/Apps/40/Tickets/Requestor?requestorUid=${getRequestor().id}&FormId=107`)
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
			// strip this Request
			const recentRequestsGroup = dom.querySelector("#divRequestorRecentRequests > .list-group");
			if (recentRequestsGroup !== null) {
				for (const requestEl of recentRequestsGroup.children) {
					const ticketIdEl = requestEl.children[1]?.children[0];
					const ticketId = Number(ticketIdEl?.textContent?.trim().slice(-6));
					if (ticketId && !Number.isNaN(ticketId) && ticketId === getCurrentTicketNumber()) {
						// remove: this is the same request
						// we know that its parent is not null
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						requestEl.parentElement!.removeChild(requestEl);
						// no others should match
						break;
					}
				}
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

/**
 * Sets up TDX Ticket View's message listener
 * for communication with Cerebro
 * 
 * @deprecated
 * Receive directly in cs31.ts
 */
export function listenForMessages(onInfo: (info: Object) => void) {
	receiveMessages(PIPELINE_CEREBRO_TO_TICKET, async message => await listener(message, onInfo));
}

/**
 * Returns the element housing the Cerebro info for a client,
 * creating it if it does not exist
 */
function getCerebroInfoBox() {
	const id = "tkast-cerebro-info";
	const existingEl = document.querySelector(`#${id}`);
	if (existingEl && existingEl instanceof HTMLElement) {
		return existingEl;
	}
	const createdEl = document.createElement("div");
	createdEl.id = id;
	const requestorFieldPanel = getRequestorFieldPanel();
	if (requestorFieldPanel.parentElement === null) {
		// for the 0.1% of the time that this is the case
		log.e("Failed to get cerebro info box: requestorFieldPanel's parent is null");
	} else {
		requestorFieldPanel.parentElement.appendChild(createdEl);
	}
	return createdEl;
}
/**
 * Notes that the client's Cerebro info is being serached up
 * below the requestor field
 */
export function setCerebroInfoLoading() {
	const cerebroInfoBox = getCerebroInfoBox();
	cerebroInfoBox.textContent = "Getting user info...";
	cerebroInfoBox.classList.add("loading");
	cerebroInfoBox.style.color = "#0071c5";
	
	// this is probably only called once
	// so inject
	// todo: extract this into an `injectStyle(style: string)` function
	// that tracks it with an id and won't double-insert
	const sty = document.createElement("style");
	sty.textContent = `
	@keyframes fade-in-out {
		0% { opacity: 1; }
		50% { opacity: 0.5; }
		100% { opacity: 1; }
	}
	#tkast-cerebro-info.loading {
		animation: fade-in-out 2s cubic-bezier(0.2, 0.01, 0.25, 1) infinite;
	}`;
	document.head.append(sty);
}
/**
 * Notes that the client's Cerebro info will not be found
 * (due to not detecting a NetID or UIN)
 * below the requestor field
 */
export function setCerebroInfoIdle() {
	const cerebroInfoBox = getCerebroInfoBox();
	cerebroInfoBox.textContent = "No user info to display.";
	cerebroInfoBox.classList.remove("loading");
	cerebroInfoBox.style.color = "#a46800";
	cerebroInfoBox.style.fontWeight = "300";
}
/**
 * Notes that the client's Cerebro info could not be found
 * below the requestor field
 */
export function setCerebroInfoError() {
	const cerebroInfoBox = getCerebroInfoBox();
	cerebroInfoBox.classList.remove("loading");
	cerebroInfoBox.textContent = "Failed to get user info.";
	cerebroInfoBox.style.color = "#c50000";
	cerebroInfoBox.style.fontWeight = "600";
}
/**
 * Adds the client's Cerebro info
 * below the requestor field
 */
export function addCerebroInfo(info: Object) {
	const cerebroInfoBox = getCerebroInfoBox();
	cerebroInfoBox.classList.remove("loading");
	cerebroInfoBox.style.border = "2px dotted #000033";
	cerebroInfoBox.style.padding = "1em";

	const typesEl = document.createElement("p");
	if (info.key.types.length === 0) {
		typesEl.textContent = "[person/phone]";
	} else {
		typesEl.textContent = squishArray(info.key.types);
	}
	typesEl.style.margin = "0.25em 0";
	const rolesEl = document.createElement("p");
	rolesEl.textContent = squishArray(info.key.roles);
	rolesEl.style.fontSize = "0.75em";
	typesEl.style.margin = "0";

	
	const flagSummaryEl = generateFlagSummaryEl(info.red, info.yellow);
	flagSummaryEl.style.float = "right";
	// todo make this not an override
	flagSummaryEl.children[1]!.style.right = "0";

	/*const redFlagsEl = document.createElement("div");
	redFlagsEl.style.backgroundColor = "#ffabab";
	// todo: red flag icon
	info.red.forEach(redFlag => {
		const redFlagNoticeEl = document.createElement("p");
		const locationEl = document.createElement("span");
		locationEl.textContent = redFlag.location;
		locationEl.style.fontSize = "0.75em";
		const connectingEl = document.createTextNode(": ");
		const noteEl = document.createElement("span");
		noteEl.textContent = redFlag.note;
		noteEl.style.fontWeight = "700";

		redFlagNoticeEl.appendChild(locationEl);
		redFlagNoticeEl.appendChild(connectingEl);
		redFlagNoticeEl.appendChild(noteEl);
		redFlagsEl.appendChild(redFlagNoticeEl);
	});
	const yellowFlagsEl = document.createElement("div");
	yellowFlagsEl.style.backgroundColor = "#fff4ab";
	yellowFlagsEl.style.fontSize = "0.75em";
	// todo: yellow flag icon
	info.yellow.forEach(yellowFlag => {
		const yellowFlagNoticeEl = document.createElement("p");
		const locationEl = document.createElement("span");
		locationEl.textContent = yellowFlag.location;
		locationEl.style.fontSize = "0.75em";
		const connectingEl = document.createTextNode(": ");
		const noteEl = document.createElement("span");
		noteEl.textContent = yellowFlag.note;

		yellowFlagNoticeEl.appendChild(locationEl);
		yellowFlagNoticeEl.appendChild(connectingEl);
		yellowFlagNoticeEl.appendChild(noteEl);
		yellowFlagsEl.appendChild(yellowFlagNoticeEl);
	});*/

	cerebroInfoBox.textContent = ""; // clear out
	cerebroInfoBox.appendChild(flagSummaryEl);
	cerebroInfoBox.appendChild(typesEl);
	cerebroInfoBox.appendChild(rolesEl);
	//cerebroInfoBox.appendChild(redFlagsEl);
	//cerebroInfoBox.appendChild(yellowFlagsEl);
}

/**
 * The amount of time to wait before trying to get the WYSIWYG El again
 * 
 * Will wait a total of `TRY_AGAIN_MS` * 3 ms max.
 */
const TRY_AGAIN_MS = 400;
/**
 * Gets the attachments element
 * 
 * @internalRemarks
 * Must be complete not interactive
 * because the attachment el data lazy loads
 * 
 * Note: before being "complete", is an el with no children
 * 
 * @todo abstract with {@link getWysiwygEl}
 */
export async function getAttachmentsEl(): Promise<Element> {
	return new Promise((res, rej) => {
		let tries = 0;
		const action = () => {
			const attachmentsEl = document.querySelector("#divAttachments");
			if (attachmentsEl === null || attachmentsEl.children.length !== 1 || attachmentsEl.children[0].classList.contains("WhiteOut")) {
				// still loading (hopefully)
				if (tries++ < 3) {
					setTimeout(action, TRY_AGAIN_MS);
				} else {
					rej(new DomParseError());
				}
			} else {
				res(attachmentsEl);
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
 * Returns the number of attachments
 * on the ticket
 * 
 * @remarks
 * Is async in case the attachments el has not yet loaded
 */
export async function getAttachmentCount(): Promise<number> {
	const attachmentsEl = await getAttachmentsEl();
	const attachmentsCountEl = attachmentsEl.querySelector(".js-attachments-count");
	const attachmentsCount = Number(attachmentsCountEl?.textContent);
	if (attachmentsCountEl !== null && !Number.isNaN(attachmentsCount)) {
		return attachmentsCount;
	} else {
		// fallback
		const attachmentsList = attachmentsEl.querySelector(".js-attachments-body");
		if (attachmentsList !== null && attachmentsList.children.length >= 2) {
			return attachmentsList.children.length - 2;
		} else {
			// out of options
			throw new DomParseError();
		}
	}
}
