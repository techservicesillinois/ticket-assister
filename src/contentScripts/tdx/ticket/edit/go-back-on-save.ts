// <rule name="TDX/Ticket/Edit/Go back on save">
import { log } from "utils/logger";
import { getTicketViewUrl, getTicketEditUrl } from "utils/webpage/foreground/tdx/pageLocator";
import { getCurrentTicketNumber } from "utils/webpage/parser/ticket";


const ticketNumber = getCurrentTicketNumber();
const alertValue = document.querySelector("main .alert")?.childNodes[2]?.textContent;
if (alertValue && alertValue.trim() === "Changes saved."
		&& (document.referrer === null || document.referrer === getTicketEditUrl(ticketNumber))) {
    // go back
    const backButton = <HTMLButtonElement>document.querySelector("#divHeader button[type=\"button\"].btn-danger");
    if (backButton) {
        backButton.click();
    } else {
        // fallback
        log.w("Using fallback to return to ticket screen after saving edit");
        try { 
            window.location.href = getTicketViewUrl(ticketNumber);
        } catch (e) {
            // getCurrentTicketNumber could theoretically throw
            // but TDX wouldn't show a page in which this could happen
            // just in case...
            log.e(`Failed to return to ticket screen. (Ticket number: ${ticketNumber})`);
        }
    }
}
