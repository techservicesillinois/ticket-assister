// <rule name="TDX/Ticket/View/Highlight misconfigured requestor field">
import { getRequestorFieldPanel } from "utils/webpage/foreground/tdx/ticketView";
import { getRequestor } from "utils/webpage/foreground/tdx/shared";
import { log } from "utils/logger";


try {
    const requstor = getRequestor();
    if (requstor.netid && !requstor.id) {
        // they should have the field filled out (netid exists)
        // and it isn't filled out (tdx id does not exist)
        getRequestorFieldPanel().style.border = "1px dotted #aa0000";
    } else {
        log.d("No client NetID or requestor field already filled out; requestor field ok");
    }
} catch (e) {
    log.e(`Failed to highlight misconfigured requestor field: ${e.message}`);
}