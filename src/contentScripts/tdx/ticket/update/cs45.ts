// <rule name="TDX/Ticket/Close on close">
import { Status } from "utils/tdx/formNames";
import { getCurrentStatus } from "utils/webpage/foreground/tdx/shared";
import { getNewStatus, getSaveButton } from "utils/webpage/foreground/tdx/ticketUpdate";
import { log } from "utils/logger";
import { getCurrentTicketNumber } from "utils/webpage/parser/ticket";
import { CLOSE_TICKET_KEY } from "utils/webpage/link/session";

window.addEventListener("beforeunload", () => {
    const currentStatus = getCurrentStatus();
    const newStatus = getNewStatus();
    log.d(`Current status is ${currentStatus} and we are updating to status ${newStatus}`);
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
});