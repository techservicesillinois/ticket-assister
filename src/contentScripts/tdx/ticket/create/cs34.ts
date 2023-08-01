// <rule name="TDX/Ticket/Create/Auto select Phone as source">
import { setCreatedVia, formChangeListen } from "utils/webpage/foreground/tdx/ticketCreate";
import { CreateMethod } from "utils/tdx/formNames";
import { log } from "utils/logger";


formChangeListen(() => {
    try {
        setCreatedVia(CreateMethod["Phone"]);
    } catch (e) {
        // this might be ok. Maybe the requested form doesn't have this field?
        log.e(`Failed to set created via phone: ${e.message}`);
    }
});
