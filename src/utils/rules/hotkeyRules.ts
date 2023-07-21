// todo: "utils/*" paths won't work
	// replace "../../utils" with "utils"
import { getCurrentTicketNumber } from "../../utils/webpage/parser/ticket";
import { getCommentBox, scrollIntoViewWithHeader } from "../../utils/webpage/foreground/tdx/ticketView";
import { getTicketEditUrl, getTicketUpdateUrl } from "../../utils/webpage/foreground/tdx/pageLocator";
import { log } from "../../utils/logger";
import { TICKETS_BASE_URL } from "../../utils/webpage/foreground/tdx/shared";

/**
 * Sets up hotkeys based on rules
 * Running callbacks whenever a key is pressed
 * and an input is not focused (active)
 */
export function handleHotkeys(hotkeyRules: Record<string, () => void>) {
	window.addEventListener("keydown", event => {
		// verify not typing in an input box
		if (document.activeElement !== null && document.activeElement.tagName !== "INPUT") {
			for (const key of Object.keys(hotkeyRules)) {
				if (event.key === key) {
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
	"t": () => {
		// Take primary responsibility (if unassigned)
		const takeButton = document.querySelector("#divTakeTicket");
		if (takeButton !== null  && (takeButton instanceof HTMLElement)) {
			// TDX will only render if unassigned
			takeButton.click();
		} else {
			// check unassigned
			/*
			// hard to tell...
			// responsibility must not contain a slash to not be group and individual assigned
			// and responsibility must not be the name of a person
			const responsibility = getTicketDatumsRecursively()["Responsibility"];
			if (
				responsibility.indexOf("/") === -1
				&& (responsibility === "Unassigned"
				|| responsibility.indexOf("UIUC-") !== -1)
			) {
				takePrimRespBg(); // import { takePrimRespBg } from "./utils/webpage/background/ticketActions";
			}
			*/
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
};
export const hotkeyRules2: Record<string, () => void> = {
	"e": () => {
		// Escalate (reassign)
		const reassignButton = document.querySelector("#divReassignTicket");
		if (reassignButton === null || !(reassignButton instanceof HTMLElement)) {
			log.e("Failed to scroll to top of feed section");
			return;
		} else {
			// fallback
			window.open(`${TICKETS_BASE_URL}/TicketReassign?TicketID=${getCurrentTicketNumber()}`, "TicketAssign564440", "popup=1,width=992,height=700,left=459,top=160");
		}
	},
	"f": () => {
		// jump to latest Feed activity
		const feedBox = document.querySelector("#ticketFeed");
		if (feedBox === null || !(feedBox instanceof HTMLElement)) {
			log.e("Failed to scroll to top of feed section");
			return;
		}
		scrollIntoViewWithHeader(feedBox);
	},
};

