import { receiveMessages, PIPELINE_TICKET_TO_CEREBRO } from "../link/interface";
import { DomParseError } from "utils/errors";
import { noResults, emailDeliveryTypo, valueFor, hasAtLeastOne, inboxExists, getUserTypes, getUserRoles, getInboxRules, highlightCell, findTableBodyEl, findTableValueEl } from "../parser/cerebro";
import { listener } from "../link/cerebro";
import { getRedFlagIcon, getYellowFlagIcon } from "utils/icons";
import { log } from "utils/logger";
import { addTooltip } from "utils/tooltip";

/**
 * Looks up a NetID or UIN
 * when on the Cerebro page
 * @throws a {@link DomParseError} if the page is malformatted (typically not on the proper page)
 *
 * @remarks
 * MUST be on the proper page or will throw and nothing will happen.
 *
 * Submits the NetID or UIN form on the page
 * to redirect and get the data.
 *
 * Typically should alert the ticket listener via {@link sendRedirection} before calling this
 */
export function lookupNetIDOrUIN(uinOrNetID: string) {
    if (!(window.location.host === "cerebro.techservices.illinois.edu" && window.location.pathname === "/")) {
        throw new Error("Not at the correct URL.");
    }
    const form = document.querySelector("form");
    if (form === null) {
        throw new DomParseError();
    }
    const searchInput: HTMLFormElement | null = form.querySelector('input[name="uin_or_netid"]');
    const submitInput: HTMLFormElement | null = form.querySelector('input[type="submit"]');
    if (searchInput === null || submitInput === null) {
        throw new DomParseError();
    }
    searchInput.value = uinOrNetID;
    submitInput.click();
}

/**
 * A piece of information from Cerebro
 */
interface CerebroDatum {
    /**
     * location of the informatio
     * Denoted by box/entry
     */
    location: string,
    /*l**
     * value of the information
     * Supplied in string representation.
     *l
    value: string,*/
    /**
     * Note regarding the value contents of the datum
     * May be a warning or an error message, depending on how the Datum is passed
     */
    note: string,
}

/**
 * Adds info with {@param failureNote} to a {@link CerebroDatum}
 * if {@link test} returns true
 *
 * Will get {@link valueFor} from the passed {@param search},
 * adding a {@link CerebroDatum} if an error is thrown or the received value is null
 * with a note explaining failure retreiving
 *
 * Adds the {@link CerebroDatum} to {@param array}
 * 
 * Will add the value with a note if failed to find the desired search
 * if {@param addOnNotFound} is true.
 */
function addIf(array: Array<CerebroDatum>, search: { section: string, key: string }, failureNote: string, test: (value: string) => boolean, addOnNotFound = true) {
	const location = search.section + "/" + search.key;
	let value: null | string;
	try {
		value = valueFor(search.section, search.key);
	} catch {
		value = null;
	}
	if (value === null) {
		if (addOnNotFound) {
			array.push({
				location: location,
				note: `Failed to check ${search.key}`,
			});
		}
	} else if (test(value)) {
		array.push({
			location: location,
			note: failureNote,
		});
	}
}

/**
 * Gets key info about a user.
 *
 * Assumes on the proper Cerebro page.
 *
 * @remarks
 * Returns the user's types (minus person and phone)
 * and relavent roles.
 *
 * @throws if no results on the page
 */
export function getKeyInfo() {
    if (noResults()) {
        throw new Error("NetID or UIN not found");
    }
	let types: Array<string> | null;
	try {
		types = getUserTypes().filter(type => type !== "person" && type !== "phone");
	} catch {
		// faied to find
		types = null;
	}

	let roles: Array<string> | null;
	try {
		roles = getUserRoles();
		roles = roles.filter(role => {
			const endingYYYYM = role.substring(role.length - 5, role.length);
			const numberYYYYM = Number(endingYYYYM);
			if (!Number.isNaN(numberYYYYM)) {
				// this is relevant. handle here
				const today = new Date();
				let prefix = today.getFullYear();
				let suffix = today.getMonth();
				if (suffix <= 9 && suffix > 1) {
					// we are looking for 8
					suffix = 8;
				} else if (suffix !== 1) {
					// we are looking for 1
					prefix += 1;
					suffix = 1;
				}
				const latestYYYYM = prefix * 10 + suffix;
				return numberYYYYM === latestYYYYM;
			}
			// else, probably relevant
			return true;
		});
	} catch {
		// there are none (box not displayed)
		roles = [];
	}

	return { types, roles };
}

/**
 * One day in milliseconds
 */
const ONE_DAY = 1000*60*60*24;
/**
 * Gets yellow flag info about a user.
 * These are things that may cause an issue for the user, but not necessarily.
 *
 * Assumes on the proper Cerebro page.
 *
 * @remarks
 * Returns the following information:
 * if create date < 1wk, most recent claim date < 1d,
 * if Box disabled, if Google Apps disabled,
 * if claim eligible,
 * if an inbox rule redirecting mail
 *
 * @throws if no results on the page
 */
export function getYellowInfo() {
    if (noResults()) {
        throw new Error("NetID or UIN not found");
    }
    const yellowInfo: Array<CerebroDatum> = [];

	const today = new Date();
	addIf(yellowInfo, { section: "Central Registry", key: "Create Date", }, "Recently created", value => {
		return today.getTime() - (new Date(value)).getTime() < ONE_DAY * 7;
	});
	addIf(yellowInfo, { section: "NetID Claim", key: "Most Recent Claim Date", }, "Recently created", value => {
		return today.getTime() - (new Date(value)).getTime() < ONE_DAY;
	}, false); // do not add if not found: this is normal
	addIf(yellowInfo, { section: "Google Apps @ Illinois", key: "Account Status", }, "Google Apps not enabled", value => value === "disabled");
	addIf(yellowInfo, { section: "U of I Box", key: "Account Status", }, "Box not enabled", value => value === "disabled");
	addIf(yellowInfo, { section: "NetID Claim", key: "Claim Eligible Status", }, "Not claimed", value => value === "Yes");
	try {
		getInboxRules().forEach(inboxRule => {
			// forwardTo will also deliver to this mailbox so is ok
			if (inboxRule.actions.indexOf("redirectTo") !== -1) {
				yellowInfo.push({
					location: "Inbox Rules",
					note: "Redirecting mail",
				});
			}
		});
	} catch {
		yellowInfo.push({
			location: "Inbox Rules",
			note: "Failed to check",
		});
	}

	// test that password recovery options exist
	const pwRecoveryEl = document.querySelector("#password_recovery");
	if (pwRecoveryEl) {
		// if null this will fail
		if (pwRecoveryEl.children[1]?.children[0]?.textContent?.trim() === "No Password Recovery options found") {
			yellowInfo.push({
				location: "Password Recovery Options",
				note: "None set",
			});
		}
	} else {
		yellowInfo.push({
			location: "Password Recovery Options",
			note: "Failed to check",
		});
	}

	// todo: check that things look normal
	// add flags if key things are missing

    return yellowInfo;
}
/**
 * Gets red flag info about a user.
 * These are things that are likely to cause an issue for the user based on their account types.
 *
 * Assumes on the proper Cerebro page.
 *
 * @remarks
 * Returns the following information:
 * if student/staff/retired/allied and AD disabled,
 * if student/staff/retired and inbox not found or EDE blank,
 * if AD account locked out,
 * if Password Last Set never or <15 min ago,
 * if EDE email delivery is close to @g.illinois.edu or @mx.uillinois.edu but is spelled wrong
 *
 * @throws if no results on the page
 */
export function getRedInfo(): Array<CerebroDatum> {
    if (noResults()) {
        // white-hot flag
        throw new Error("NetID or UIN not found");
    }
    const redInfo: Array<CerebroDatum> = [];
	//function addIf(array: Array<CerebroDatum>, search: { section: string, key: string }, failureNote: string, test: (value: string) => boolean) {
	addIf(redInfo, { section: "Central Registry", key: "Illinois Email Delivery", }, "Not set", value => value === "Email Forwarding not set");
	addIf(redInfo, { section: "Central Registry", key: "Illinois Email Delivery", }, "Typo detected", emailDeliveryTypo);
	addIf(redInfo, { section: "Active Directory (AD)", key: "Account Status", }, "Not enabled", value => value !== "enabled");

	addIf(redInfo, { section: "Active Directory (AD)", key: "AD Account Lockout" }, "Locked out", value => value !== "No");
	try {
		const accountTypes = getUserTypes();
		const shouldHaveEmail = ["student", "staff", "retired"];
		if (hasAtLeastOne(accountTypes, shouldHaveEmail)) {
			addIf(redInfo, { section: "Central Registry", key: "Illinois Email Delivery" }, "Blank", value => value === "");

			try {
				if (!inboxExists()) {
					redInfo.push({
						location: "Inbox Rules",
						note: "Inbox does not exist",
					});
				}
			} catch {
				redInfo.push({
					location: "Inbox Rules",
					note: "Failed to check inbox existance",
				});
			}
		}
	} catch {
		redInfo.push({
			location: "Central Registry/Type",
			note: "Failed to check account types",
		});
	}

	addIf(redInfo, { section: "Active Directory (AD)", key: "Password Last Set" }, "Not set", value => value === "Never");
	const FIFTEEN_MINUTES = 15 * 60 * 1000; // ms
	addIf(redInfo, { section: "Active Directory (AD)", key: "Password Last Set" }, "Not set", value => {
		const pwSetOn = new Date(valueFor("Active Directory (AD)", "Password Last Set"));
		return (Date.now() - pwSetOn.getTime() < FIFTEEN_MINUTES);
	});

	addIf(redInfo, { section: "Enterprise ID Assignments", key: "UIUC (Urbana) NetID" }, "No UIUC NetID. Probable mismatch.",
		value => value === "No NetID found", false); // should not be here anyways

    return redInfo;
}

/**
 * Sets up Cerebro's message listener
 * for communication with tickets
 */
export function listenForMessages() {
	receiveMessages(PIPELINE_TICKET_TO_CEREBRO, listener);
}

/**
 * Creates a compact list of info
 * from the {@param infos} provided
 */
export function genListInfoEl(infos: Array<CerebroDatum>) {
	const infoBox = document.createElement("ul");
	//infoBox.style.listStyle = "none";
	infoBox.style.margin = "0";

	for (const info of infos) {
		const messageEl = document.createElement("li");
		//messageEl.textContent = `${info.location}: ${info.note}`;
		const locationPart = document.createTextNode(`${info.location}: `);
		const notePart = document.createElement("span");
		notePart.textContent = info.note;
		notePart.style.fontWeight = "700";
		messageEl.appendChild(locationPart);
		messageEl.appendChild(notePart);
		
		// override Cerebro's styling
		messageEl.style.display = "list-item";
		infoBox.appendChild(messageEl);
	}

	return infoBox;
}

/**
 * Generates teh flag summary el
 * listing the number of red and yellow flags
 * detected on screen.
 *
 * @remarks
 * Leaves the styling alone, allowing the callee to append the child
 * and align it
 * 
 * Based on the passed {@param redInfo} and {@param yellowInfo},
 * so can be generated on any page(provided that information is known)
 */
export function generateFlagSummaryEl(redInfo: Array<CerebroDatum> | null, yellowInfo: Array<CerebroDatum> | null) {
	const flagSummaryEl = document.createElement("div");
	const flagPart = document.createElement("div");
	const detailsPart = document.createElement("div");

	detailsPart.style.position = "absolute";
	detailsPart.style.margin = "0";
	detailsPart.style.marginLeft = "-100px";
	detailsPart.style.zIndex = "2";
	detailsPart.style.background = "#d7dfed";
	detailsPart.style.width = "200px";
	detailsPart.style.fontSize = "0.75em";

	const redFlagPart = document.createElement("div");
	redFlagPart.style.display = "inline";
	redFlagPart.style.color = "#951923";
	redFlagPart.style.margin = "0 0.25rem";
	redFlagPart.appendChild(getRedFlagIcon());
	const redFlagCount = document.createElement("span");
	if (redInfo === null) {
		redFlagCount.textContent = "--";
	} else {
		redFlagCount.textContent = String(redInfo.length);

		const redDetails = genListInfoEl(redInfo);
		redDetails.style.padding = "0.25em";
		redDetails.style.width = "100%";
		redDetails.style.paddingLeft = "1.25em";
		redDetails.style.display = "none";
		detailsPart.appendChild(redDetails);
		redFlagPart.addEventListener("mouseover", () => {
			redDetails.style.display = "block";
		});
		redFlagPart.addEventListener("mouseout", () => {
			redDetails.style.display = "none";
		});
		redFlagPart.style.cursor = "help"; // hover for info

		if (redInfo.length > 0) {
			addWiggleAnimationCss();
			const redFlagIcon = redFlagPart.children[0];
			if (redFlagIcon && redFlagIcon instanceof HTMLElement) {
				redFlagIcon.style.animation = "wiggle 0.25s 2 forwards";
			}
		}
	}
	redFlagPart.appendChild(redFlagCount);
	flagPart.appendChild(redFlagPart);

	const yellowFlagPart = document.createElement("div");
	yellowFlagPart.style.display = "inline";
	yellowFlagPart.style.color = "#db981e";
	yellowFlagPart.style.margin = "0 0.25rem";
	yellowFlagPart.appendChild(getYellowFlagIcon());
	const yellowFlagCount = document.createElement("span");
	if (yellowInfo === null) {
		yellowFlagCount.textContent = "--";
	} else {
		yellowFlagCount.textContent = String(yellowInfo.length);

		const yellowDetails = genListInfoEl(yellowInfo);
		yellowDetails.style.padding = "0.25em";
		yellowDetails.style.width = "100%";
		yellowDetails.style.paddingLeft = "1.25em";
		yellowDetails.style.display = "none";
		detailsPart.appendChild(yellowDetails);
		yellowFlagPart.addEventListener("mouseover", () => {
			yellowDetails.style.display = "block";
		});
		yellowFlagPart.addEventListener("mouseout", () => {
			yellowDetails.style.display = "none";
		});
		yellowFlagPart.style.cursor = "help"; // hover for info
	}
	yellowFlagPart.appendChild(yellowFlagCount);
	flagPart.appendChild(yellowFlagPart);

	flagSummaryEl.appendChild(flagPart);
	flagSummaryEl.appendChild(detailsPart);
	
	return flagSummaryEl;
}

/**
 * Adds the wiggle animation css
 * to the document's `<head>`
 * 
 * @remarks
 * This will successively add CSS to the `head`
 * when called multiple times.
 * It would be too much of a cost to check if this was already injected
 * since it is an inline definition.
 * @todo make this an out-of-line definition
 * stored in the extension
 */
function addWiggleAnimationCss() {
	const sty = document.createElement("style");
	sty.textContent = `
	@keyframes wiggle {
		0% { transform: rotate(0deg); }
		25% { transform: rotate(-10deg); }
		50% { transform: rotate(0deg); }
		75% { transform: rotate(10deg); }
		100% { transform: rotate(0deg); }
	}`;
	document.head.appendChild(sty);
}

/**
 * Highlights the section of {@param info} with {@param color},
 * providing a tooltip with the details on hover
 */
export function highlightInfo(info: Array<CerebroDatum>, color: string) {
	function markCell(cell: HTMLElement, note: string) {
		highlightCell(cell, color);
		// boring tooltip
		cell.setAttribute("title", note);
		// fancytooltip
		addTooltip(cell, note);
	}
	info.forEach(info => {
		const sections = info.location.split("/");
		try {
			if (sections.length === 2) {
				markCell(findTableValueEl(sections[1], findTableBodyEl(sections[0])), info.note);
			} else if (sections.length === 1) {
				// for a more general box highlight
				// things like "Inbox Rules", "Password Recovery Options"
				markCell(findTableBodyEl(sections[0]), info.note);
			} else {
				log.e(`Unprepared to find element with location ${info.location}, so no visual highlights possible`);
			}
		} catch (e) {
			// probably not on screen
			// warn because this may not be possible
			log.w(`Failed to mark cell at location ${info.location}: ${e}`);
		}
	});
	
}