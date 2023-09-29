// <rule name="TDX/Ticket/Close on close">
import { Status } from "utils/tdx/formNames";
import { getCurrentStatus, getStatusText } from "utils/webpage/foreground/tdx/shared";
import { getNewStatus, getSaveButton } from "utils/webpage/foreground/tdx/ticketUpdate";
import { log } from "utils/logger";
import { getCurrentTicketNumber } from "utils/webpage/parser/ticket";
import { CLOSE_TICKET_KEY } from "utils/webpage/link/session";

window.addEventListener("beforeunload", () => {
    // note: only one log call will be save due to timing constraints
    const currentStatus = getCurrentStatus();
    const newStatus = getNewStatus();
    if (currentStatus !== Status.Closed && newStatus === Status.Closed) {
        // is now being closed with a status change
        // confirm that we are submitting the form
        if (getSaveButton().querySelector(".fa-spinner") !== null) {
            log.d(`Current status is ${currentStatus} and we are updating to status ${newStatus}\nForm was submitted; preparing to queue close ticket window`);
            window.localStorage.setItem(CLOSE_TICKET_KEY, JSON.stringify({
                id: getCurrentTicketNumber(),
                time: Date.now(),
            }));
        } else {
            log.d(`Form was not submitted; not preparing to close ticket`);
        }
    }
});