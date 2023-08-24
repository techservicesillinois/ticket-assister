// todo: "utils/*" paths won't work
	// replace "../../utils" with "utils"
import { getCurrentTicketNumber } from "../../utils/webpage/parser/ticket";
import { getCommentBox, scrollIntoViewWithHeader } from "../../utils/webpage/foreground/tdx/ticketView";
import { getTicketEditUrl, getTicketUpdateUrl } from "../../utils/webpage/foreground/tdx/pageLocator";
import { log } from "../../utils/logger";
import { TICKETS_BASE_URL, doPostBack } from "../../utils/webpage/foreground/tdx/shared";

/**
 * Sets up hotkeys based on rules
 * Running callbacks whenever a key is pressed
 * and an input is not focused (active)
 *
 * Only runs if that is the only key being pressed
 * (i.e. not a chord)
 */
export function handleHotkeys(hotkeyRules: Record<string, () => void>) {
	window.addEventListener("keydown", event => {
		// verify not typing in an input box
		if (document.activeElement !== null && document.activeElement.tagName !== "INPUT") {
			for (const key of Object.keys(hotkeyRules)) {
				if (event.key === key && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
					// run callback
					hotkeyRules[key]();
				}
			}
		}
	});
}
export const hotkeyRules: Record<string, () => void> = {
	"e": () => {
		// open Edit page
		const editButton = document.querySelector("#btnEdit");
		if (editButton !== null && (editButton instanceof HTMLElement)) {
			editButton.click();
		} else {
			// fallback
			window.location.href = getTicketEditUrl(getCurrentTicketNumber());
		}
	},
	"u": () => {
		// open Update page
		const updateButton = document.querySelector("#btnUpdateTicket");
		if (updateButton !== null && (updateButton instanceof HTMLElement)) {
			updateButton.click();
		} else {
			// fallback
			// use default... the onclick of a sample update button
			window.open(getTicketUpdateUrl(getCurrentTicketNumber()), "TicketUpdate564440", "popup=1,width=992,height=700,left=459,top=160");
		}
	},
	"r": () => {
		// Refresh ticket page
		window.location.reload();
	},
	"c": () => {
		// jump to Comment box
		const commentButton = document.querySelector("#btnComment");
		if (commentButton === null || !(commentButton instanceof HTMLElement)) {
			log.e("Failed to open comment section");
		} else {
			if (commentButton.style.display !== "none") {
				commentButton.click();
			} else {
				try {
					scrollIntoViewWithHeader(getCommentBox());
				} catch {
					log.e("Failed to scroll to comment section");
				}
				// comments already open
				// focus
				// todo this isn't working
				// also tdx's wysiwyg is so weird
				// iframeEl.contentWindow.focus(); 
				// iframeEl.contentDocument.body.click(); 
			}
		}
	},
	"a": () => {
		// Assign (reassign/escalate)
		const reassignButton = document.querySelector("#divReassignTicket");
		if (reassignButton === null || !(reassignButton instanceof HTMLElement)) {
			log.e("Failed to scroll to top of feed section");
			return;
		} else {
			// fallback
			window.open(`${TICKETS_BASE_URL}/TicketReassign?TicketID=${getCurrentTicketNumber()}`, "TicketAssign564440", "popup=1,width=992,height=700,left=459,top=160");
		}
	},
};
export const hotkeyRules2: Record<string, () => void> = {
	"t": () => {
		const takeButton = document.querySelector("#btnTakeTicket");
		// only run if this is an option
		if (takeButton !== null) {
			// Chrome doesn't like running the script on clicking the button manually
			// so have it your way
			doPostBack("btnTakeTicket", "");
		}
		/*
		// Take primary responsibility (if unassigned)
		if (takeButton !== null  && (takeButton instanceof HTMLElement)) {
			// TDX will only render if unassigned
			takeButton.click();
			// unfortunately will still alert confirmation
		} else {
			log.i(`No take button found; not taking responsibility.`);
			// check unassigned
			/.
			// hard to tell...
			// responsibility must not contain a slash to not be group and individual assigned
			// and responsibility must not be the name of a person
			const responsibility = getTicketDatumsRecursively()["Responsibility"];
			if (
				responsibility.indexOf("/") === -1
				&& (responsibility === "Unassigned"
				|| responsibility.indexOf("UIUC-") !== -1)
			) {
				takeResponsibilityBg(getCurrentTicketNumber());
				// fallback: window.__doPostBack("btnTakeTicket", "")
			}
			./
		}
		*/
	},
	"d": () => {
		// jump to latest feeD activity
		const feedBox = document.querySelector("#ticketFeed");
		if (feedBox === null || !(feedBox instanceof HTMLElement)) {
			log.e("Failed to scroll to top of feed section");
			return;
		}
		scrollIntoViewWithHeader(feedBox);
	},
	"f": () => {
		// toggle Flag
		//const flagButton = document.querySelector("#btnToggleFlag");
		/*if (flagButton !== null && flagButton instanceof HTMLElement) {
			flagButton.click(); // toggled!
			log.i("Toggled flag.");
		} else {
			doPostBack("btnToggleFlag","");
			log.w("Could not find flag button. Doing fallback postBack");
		}*/

		// chrome says: "Refused to run the JavaScript URL because it violates the following Content Security Policy directive"
		// so just do this
		// this will also annoyingly refresh the page *sigh*
		doPostBack("btnToggleFlag","");
		log.i("Toggled flag.");
	},
};

