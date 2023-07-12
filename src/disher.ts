// Probably make this a service worker
// https://developer.chrome.com/docs/extensions/reference/webNavigation/
import { getRedInfo, getYellowInfo } from "utils/webpage/foreground/cerebro";
import { getCurrentTicketNumber } from "utils/webpage/parser/ticket";
import { assignResponsibilityBg, getCurrentPerson, getTicketDatumBg } from "utils/webpage/background/ticketActions";
import { log } from "utils/logger";
import { BASE_URL } from "config";
import { Status, boolToCheckboxValue } from "utils/tdx/formNames";
import * as ticketCreate from "utils/webpage/foreground/tdx/ticketCreate";
import * as ticketView from "utils/webpage/foreground/tdx/ticketView";
import * as ticketEdit from "utils/webpage/foreground/tdx/ticketEdit";
import * as ticketUpdate from "utils/webpage/foreground/tdx/ticketUpdate";
import { getWysiwygDocument, submitOnCtrlEnter, enableCtrlKLinkingOnWysiwyg } from "utils/webpage/foreground/tdx/shared";
import { DomParseError } from "utils/errors";
import { watchDOMChanges } from "utils/lib/observeDOM";
import { getTicketViewUrl, getTicketEditUrl, getTicketUpdateUrl } from "utils/webpage/foreground/tdx/pageLocator";
import { addTkAstLogoToPage } from "utils/dishHelp/addLogo";
import { hotkeyRules, hotkeyRules2, handleHotkeys } from "utils/dishHelp/hotkeyRules";
import { getFormBox } from "utils/webpage/foreground/tdx/ticketCreate";

/**
 * This script runs functionality based on the current page.
 * It is more organized than having a bunch of content script patterns
 * and allows disabling functions
 * 
 * Background script to be ran on pages:
 * [help.uillinois.edu/TDNext/*, cerebro.techservices.illinois.edu, icardapps.uillinois.edu/appIcardQuery/DSPIndex.cfm]
 */
/**
 * A feature that runs on a page
 * and can be turned on and off in the settings menu
 */
interface ToggleableFeature {
    /**
     * Name of the feature
     * to be presented in the settings menu
     *
     * Separate with slashes (`/`) to make a submenu,
     * or to organize similar settings together
     *
     * @remarks
     * The settings menu will build a tree based on the slashes in the name,
     * displaying each subtree heading as it is written before the next slash.
     *
     * The final string after the last slash is the setting name displayed.
     */
    name: string,
    /**
     * Description of the feature
     * to be presented in the settings menu
     */
    description: string,
    /**
     * Path for which the feature is to be run on
     *
     * Supports the `*` wildcard
     */
    path: string,
}

/**
 * Registers a function with the disher
 * {@param action} will be called whenever {@param item}'s conditions are satisfied
 *
 * Registering a function automatically adds it to the settings menu
 *
 * @remarks
 * Runs when the user navigates to {@param item}.path
 * provided that the rule is enabled in settings.
 *
 * @todo maybe
 * define action as `(settings: string) => void` that passes JSON stringified metadeta
 * to the function to be used for granular detail
 * todo maybe await action() ?
 */
function rule(item: ToggleableFeature, action: () => void) {
    // todo: add to settings menu
    // todo: determine defaults

    // todo: listen for page navigation
    // todo: check if matches path (ignore queries, slashes, and hashes), which can include wildcards
    // todo: verify that this option is enabled from settings
    // todo: run action();, catch()ing and spitting out a `log.e` message instead
}

/**
 * Highlights any red flags
 * on a user's Cerebro page
 * 
 * @throws {@link DomParseError} if the document was not as expected
 */
rule({ name: "Cerebro flagger/Alert/Red", description: "Provides a summary box at the top with any red flags about an account.\nThese are things that are likely to cause an issue for the user based on their account types.", path: "cerebro.techservices.illinois.edu" }, () => {
    const redInfo = getRedInfo();
    if (redInfo.length === 0) {
        return; // and everyone is happy
    }
    const alertBox = document.createElement("ul");
    alertBox.style.border = "4px double #bf0000";
    alertBox.style.backgroundColor = "#ffc7c7";
    alertBox.style.color = "#bf0000";
    redInfo.forEach(datum => {
        const alertBullet = document.createElement("li");
        alertBullet.textContent = `${datum.note} - ${datum.location}`;
        alertBox.appendChild(alertBullet);
    });

    const insertBeforeEl = document.querySelector("#groupsettings");
    if (insertBeforeEl === null || insertBeforeEl.parentElement === null) {
        throw new DomParseError();
    }
    insertBeforeEl?.parentElement?.insertBefore(alertBox, insertBeforeEl);
});
rule({ name: "Cerebro flagger/Highlight/Red", description: "Highlights any red flags about an account on the page.\nThese are things that are likely to cause an issue for the user based on their account types.", path: "cerebro.techservices.illinois.edu" }, () => {
    // todo setting to change from highlighting cell to just making a border
    // todo
    //getRedInfo()
    //row.style.backgroundColor = "#ffc7c7";
    // todo tooltip on hover
    //x.setAttribute("title", datum.note);
});
rule({ name: "Cerebro flagger/Highlight/Yellow", description: "Highlights any yellow flags about an account on the page.\nThese are things that may cause an issue for the user, but not necessarily.", path: "cerebro.techservices.illinois.edu" }, () => {
    // todo
    //getYellowInfo()
    // todo tooltip on hover
    //x.setAttribute("title", datum.note);
});
rule({ name: "Cerebro flagger/Show count", description: "Shows a count of the number of red and yellow flags for a user's profile.", path: "cerebro.techservices.illinois.edu" }, () => {
    // todo
    // todo show a flag icon with the counts in the top right corner
    //getYellowInfo().length
    //getRedInfo().length
});

rule({ name: "On ticket create/Auto open ticket", description: "Automatically opens a new ticket once you create it, instead of showing the \"Created Successfully\" screen.", path: `${BASE_URL}/Apps/40/Tickets/TicketNewSuccess` }, () => {
    // todo ensure that this redirect doesn't compromise the "On ticket create/Auto take ticket" rule from race conditions
	try {
		window.location.href = BASE_URL + "/TDNext/Apps/40/Tickets/TicketDet?TicketID=" + getCurrentTicketNumber();
	} catch (e) {
		log.e("Couldn't redirect to new ticket");
	}
    /*
    // this also works:
    for (const a of document.getElementsByTagName("*")) {
      if (a.children.length === 0) {
          if (a.textContent.toLowerCase().indexOf("view") !== -1) {
              window.location.href = a.href;
              //a.click();
          }
      }
    }
    */
});
rule({ name: "On ticket create/Auto take ticket", description: "Automatically takes a ticket (gives you Primary Responsibility) after creating a new ticket with responsibility of UIUC-TechSvc-Help Desk.", path: `${BASE_URL}/Apps/40/Tickets/TicketNewSuccess` }, () => {
    // todo: async/await this?
	Promise.all([getCurrentPerson(), getTicketDatumBg(getCurrentTicketNumber(), "Responsibility")]).then(([currentPerson, responsibilityField]) => {
		if (responsibilityField === "UIUC-TechServices-Help Desk") {
			assignResponsibilityBg(getCurrentTicketNumber(), currentPerson)
				.then(
					r => (r),
					() => log.e("Failed to take responsibility for ticket"),
				);
		} else {
			log.i(`Not taking newly created ticket because responsibility is ${responsibilityField}`);
		}
    });
});

rule({ name: "Show TkAst logo on tickets", description: "Displays the Ticket Assister (stylized TkAst) logo on tickets, indicating that Ticket Assister is running and assisting you.", path: `${BASE_URL}/Apps/40/Tickets/*` }, () => {
    addTkAstLogoToPage();
});

rule({ name: "Ticket create/Ctrl+Enter to submit", description: "Allows you to press Ctrl+Enter to quickly create a ticket in on new ticket screen.", path: `${BASE_URL}/Apps/40/Tickets/New` }, () => {
	submitOnCtrlEnter(document.body, ticketCreate.getSaveButton());
	submitOnCtrlEnter(getWysiwygDocument().body, ticketCreate.getSaveButton());
});
rule({ name: "Ticket create/Auto select Service Request form", description: "Automatically selects \"Tech Services - New Service Request\" on the create ticket screen.", path: `${BASE_URL}/Apps/40/Tickets/New` }, () => {
	// todo
});
rule({ name: "Ticket create/Quick select Service Request, Incident, Classtech form", description: "Provides a dropdown to quickly select between \"Tech Services - New Service Request\", \"Tech Services - New Incident\", and \"Tech Services - Classtech Problem Report\" on the create ticket screen.", path: `${BASE_URL}/Apps/40/Tickets/New` }, () => {
	getFormBox().appendChild(ticketCreate.generateQuickSelect());
});
rule({ name: "Ticket create/Add link with Ctrl+K", description: "Adds a shortcut (Ctrl+K) to add a link when typing in the view WYSIWYG editor", path: `${BASE_URL}/Apps/40/Tickets/New` }, () => {
	enableCtrlKLinkingOnWysiwyg();
});

rule({ name: "Ticket view/Ctrl+Enter to submit comment", description: "Allows you to press Ctrl+Enter to quickly submit a comment when you are typing in the comment box.", path: `${BASE_URL}/Apps/40/Tickets/TicketDet` }, () => {
	submitOnCtrlEnter(getWysiwygDocument().body, ticketView.getCommentSaveButton());
});
rule({ name: "Ticket view/Make comments private by default", description: "Automatically makes sure that Make comments private is checked by default when created a new comment", path: `${BASE_URL}/Apps/40/Tickets/TicketDet` }, () => {
    ticketView.getCommentMakePrivateButton().value = boolToCheckboxValue(true);
});
rule({ name: "Ticket view/Don't warn if private comment is not notifying", description: "Remove's TDX's warning about providing comments without selecting anyone to notify if comment is marked as private", path: `${BASE_URL}/Apps/40/Tickets/TicketDet` }, () => {
	// only shows up once you start typing
	watchDOMChanges(ticketView.getCommentBox(), () => {
		const warningMessage = document.querySelector("div#divWarnNotificationSelection");
		if (warningMessage === null || !(warningMessage instanceof HTMLElement)) {
			throw new DomParseError();
		}
		if (ticketView.getCommentMakePrivateButton().checked === true && ticketView.commentNotifyIsEmpty()) {
			warningMessage.style.display = "none";
		} else {
			// restore default
			warningMessage.style.display = "block";
		}
	});
});
rule({ name: "Ticket view/Hotkeys", description: "Enables the following keyboard shortcuts when not typing in an input box:\n- E => open Edit page\n- U => open Update page\n- T => Take primary responsibility (if unassigned)\n- R => Refresh ticket page\n- C => jump to Comment box", path: `${BASE_URL}/Apps/40/Tickets/TicketDet` }, () => {
	handleHotkeys(hotkeyRules);
});
rule({ name: "Ticket view/Additional Hotkeys", description: "Enables the following keyboard shortcuts when not typing in an input box:\n- F => jump to latest Feed activity", path: `${BASE_URL}/Apps/40/Tickets/TicketDet` }, () => {
	handleHotkeys(hotkeyRules2);
});
rule({ name: "Ticket view/Add link with Ctrl+K", description: "Adds a shortcut (Ctrl+K) to add a link when typing in the view WYSIWYG editor", path: `${BASE_URL}/Apps/40/Tickets/TicketDet` }, () => {
	enableCtrlKLinkingOnWysiwyg();
});
rule({ name: "Ticket view/Gray out unused actions", description: "Grays out infrequently used actions, requiring a double-click to click them.\nThis is to avoid accidentally clicking a different button", path: `${BASE_URL}/Apps/40/Tickets/TicketDet` }, () => {
	try {
		ticketView.grayOutActions(["Generate Bomgar Session", "Add to My Work", "Unassign Incident", "Edit Classification", "Set Parent", "Create Parent", "Copy Incident", "Add to Workspace", "Create Incident Template", "Forward", "Assign Workflow"]);
	} catch (e: unknown) {
        if (e instanceof Error) { // which it most certainly ts thank you very much
            log.e(e.message);
        }
	}
});

rule({ name: "Ticket edit/Go back on save", description: "Automatically returns to the ticket detail page after saving changes to an edit.", path: `${BASE_URL}/Apps/40/Tickets/Edit` }, () => {
	const alertValue = document.querySelector("main > .alert")?.childNodes[2].textContent;
	if (alertValue && alertValue.trim() === "Changes saved.") {
		// go back
		const backButton = <HTMLButtonElement>document.querySelector("#divHeader button[type=\"button\"].btn-danger");
		if (backButton) {
			backButton.click();
		} else {
			// fallback
			log.w("Using fallback to return to ticket screen after saving edit");
			try { 
				window.location.href = getTicketViewUrl(getCurrentTicketNumber());
			} catch (e) {
				// getCurrentTicketNumber could theoretically throw
				// but TDX wouldn't show a page in which this could happen
				// just in case...
				log.e("Failed to return to ticket screen.");
			}
		}
	}
});
rule({ name: "Ticket edit/Add link with Ctrl+K", description: "Adds a shortcut (Ctrl+K) to add a link when typing in the view WYSIWYG editor", path: `${BASE_URL}/Apps/40/Tickets/Edit` }, () => {
	enableCtrlKLinkingOnWysiwyg();
});
rule({ name: "Ticket edit/Ctrl+Enter to submit comment", description: "Allows you to press Ctrl+Enter to quickly submit edits.", path: `${BASE_URL}/Apps/40/Tickets/Edit` }, () => {
	submitOnCtrlEnter(document.body, ticketEdit.getSaveButton());
	submitOnCtrlEnter(getWysiwygDocument().body, ticketEdit.getSaveButton());
});

rule({ name: "Ticket update/Add link with Ctrl+K", description: "Adds a shortcut (Ctrl+K) to add a link when typing in the view WYSIWYG editor", path: `${BASE_URL}/Apps/40/Tickets/Update` }, () => {
	enableCtrlKLinkingOnWysiwyg();
});
rule({ name: "Ticket update/Ctrl+Enter to submit comment", description: "Allows you to press Ctrl+Enter to quickly submit an update email.", path: `${BASE_URL}/Apps/40/Tickets/Update` }, () => {
	submitOnCtrlEnter(document.body, ticketUpdate.getSaveButton());
	submitOnCtrlEnter(getWysiwygDocument().body, ticketUpdate.getSaveButton());
});
rule({ name: "Ticket update/Auto set Awaiting Customer Response", description: "Automatically changes the status to Awaiting Customer Response when updating a ticket that is New, Open, or Reopened.", path: `${BASE_URL}/Apps/40/Tickets/Update` }, () => {
    const currentStatus = ticketUpdate.getNewStatus();
    if (currentStatus !== undefined) {
        //if (["New", "Open", "Reopened"].includes(currentStatus)) {
        if (new Set([Status["New"], Status["Open"], Status["Reopened"]]).has(currentStatus)) {
            ticketUpdate.setNewStatus(Status["Awaiting Customer Response"]);
        }
    }
});
