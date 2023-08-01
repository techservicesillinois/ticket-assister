// <rule name="TDX/Ticket/Create/Don't notify requestor">
import { getNotifyRequestorInputEl, formChangeListen } from "utils/webpage/foreground/tdx/ticketCreate";


// this gets reset every time
// and is reset on the first setting as well
formChangeListen(() => {
    try {
        getNotifyRequestorInputEl().checked = false;
    } catch (e) {
        log.e(`Failed to uncheck notify requestor: ${e.message}`);
    }
});
