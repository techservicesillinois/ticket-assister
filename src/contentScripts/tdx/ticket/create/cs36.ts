// <rule name="TDX/Ticket/Create/Don't notify requestor">
import { getNotifyRequestorInputEl, formChangeListen, supportedFormIsSelected } from "utils/webpage/foreground/tdx/ticketCreate";
import { log } from "utils/logger";


// this gets reset every time
// and is reset on the first setting as well
formChangeListen(() => {
    try {
        getNotifyRequestorInputEl().checked = false;
    } catch (e) {
        if (supportedFormIsSelected()) {
            log.e(`Failed to uncheck notify requestor: ${e.message}`);
        } else {
            log.d(`Failed to uncheck notify requestor on unsupported form: ${e.message}`);
        }
    }
});
