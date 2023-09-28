// <rule name="TDX/Ticket/Close on close">
// todo clean and test
import { log } from "utils/logger";
import { Status } from "utils/tdx/formNames";
import { getCurrentStatus } from "utils/webpage/foreground/tdx/shared";
import { getNewStatus, getSaveButton } from "utils/webpage/foreground/tdx/ticketEdit";
import { CLOSE_TICKET_KEY } from "utils/webpage/link/session";
import { getCurrentTicketNumber } from "utils/webpage/parser/ticket";

// listen for refreshes due to edits being submitted
window.addEventListener("beforeunload", () => {
    const currentStatus = getCurrentStatus();
    const newStatus = getNewStatus();
    log.d(`Current status is ${currentStatus} and we are editing to status ${newStatus}`);
    if (currentStatus !== Status.Closed && newStatus === Status.Closed) {
        // is now being closed with a status change
        // confirm that we are submitting the form
        if (getSaveButton().querySelector(".fa-spinner") !== null) {
            log.d(`Form was submitted; preparing to queue close ticket window`);
            window.sessionStorage.setItem(CLOSE_TICKET_KEY, JSON.stringify({
                id: getCurrentTicketNumber(),
                time: Date.now(),
            }));
        } else {
            log.d(`Form was not submitted; not preparing to close ticket`);
        }
    }
	window.sessionStorage.setItem(CLOSE_TICKET_KEY, JSON.stringify({
		id: getCurrentTicketNumber(),
		time: Date.now(),
	}));
});

const MAX_REFRESH_TIME_MS = 1000; // sounds reasonable
const lastClose = window.sessionStorage.getItem(CLOSE_TICKET_KEY);
if (lastClose === null) {
    log.d("No lastClose data, so keeping ticket window open");
} else {
    const closeData: Record<string, number> = (() => {
        try {
            return JSON.parse(lastClose);
        } catch {
            return {};
        }
    })();
    if (!("id" in closeData && "time" in closeData)
            || (Number.isNaN(closeData.id) || Number.isNaN(closeData.time))) { //hasOwnProperty
        log.w("Invalid lastClose data");
        log.d("Wiping lastClose data...");
    } else {
        if (closeData.id === getCurrentTicketNumber()
                && Date.now() - closeData.time < MAX_REFRESH_TIME_MS) {
            // close window
            log.i("Detected this ticket recently being closed from an update. Closing window");
            window.close();
        } else {
            log.d("Not closing ticket because the most recent record had a different id");
        }
    }
    // either consumed or invalid, so clear
    window.sessionStorage.removeItem(CLOSE_TICKET_KEY);
    log.d("lastClose data wiped");
}