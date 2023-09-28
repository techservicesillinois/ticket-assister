// <rule name="TDX/Ticket/Close on close">
import { log } from "utils/logger";
import { CLOSE_TICKET_KEY, MAX_REFRESH_TIME_MS } from "utils/webpage/link/session";
import { getCurrentTicketNumber } from "utils/webpage/parser/ticket";

const lastClose = window.localStorage.getItem(CLOSE_TICKET_KEY);
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
        if (closeData.id !== getCurrentTicketNumber()) {
            log.d("Not closing ticket because the most recent record had a different id");
        } else if (Date.now() - closeData.time < MAX_REFRESH_TIME_MS) {
            // close window
            log.i("Detected this ticket recently being closed from an update. Closing window");
            window.close();
        } else {
            log.d("Not closing ticket because the most recent record was too long ago");
        }
    }
    // either consumed or invalid, so clear
    window.localStorage.removeItem(CLOSE_TICKET_KEY);
    log.d("lastClose data wiped");
}