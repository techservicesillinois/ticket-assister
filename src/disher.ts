import { getRedInfo, getYellowInfo } from "./utils/webpage/foreground/cerebro";
import { getCurrentTicketNumber } from "./utils/webpage/parser/ticket";
import { assignResponsibilityBg, getCurrentPerson } from "./utils/webpage/background/ticketActions";
import { log } from "./utils/logger";
import { BASE_URL } from "./config";
import { DOMParseError } from "./utils/errors";

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
 * @throws {@link DOMParseError} if the document was not as expected
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
        throw new DOMParseError();
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

rule({ name: "On ticket create/Auto open ticket", description: "Automatically opens a new ticket once you create it, instead of showing the \"Created Successfully\" screen.", path: "https://help.uillinois.edu/SBTDNext/Apps/40/Tickets/TicketNewSuccess" }, () => {
    const query = new URLSearchParams(window.location.search);
    const goto = query.get("TicketID") ?? query.get("ticketid");
    if (goto === null) {
        log.i("Couldn't redirect to new ticket");
        return;
    }
    // todo ensure that this redirect doesn't compromise the "On ticket create/Auto take ticket" rule
    window.location.href = BASE_URL + "/TDNext/Apps/40/Tickets/TicketDet?TicketID=" + getCurrentTicketNumber();
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
rule({ name: "On ticket create/Auto take ticket", description: "Automatically takes a ticket (gives you Primary Responsibility) after creating a new ticket with responsibility of UIUC-TechSvc-Help Desk.", path: "https://help.uillinois.edu/SBTDNext/Apps/40/Tickets/TicketNewSuccess" }, () => {
    // todo: async/await this?
    getCurrentPerson().then(currentPerson => {
        assignResponsibilityBg(getCurrentTicketNumber(), currentPerson)
            .then(
                r => (r),
                () => log.e("Failed to take responsibility for ticket"),
            );
    });
});

rule({ name: "Show TkAst logo on tickets", description: "Displays the Ticket Assister (stylized TkAst) logo on tickets, indicating that Ticket Assister is running and assisting you.", path: "https://help.uillinois.edu/SBTDNext/Apps/40/Tickets/*" }, () => {
    const logo = document.createElement("img");
    logo.src = ""; // todo
    logo.style.width = "100px";
    logo.style.position = "fixed";
    logo.style.right = "25px";
    logo.style.bottom = "25px";
    logo.style.pointerEvents = "none";
    document.body.appendChild(logo);
});
