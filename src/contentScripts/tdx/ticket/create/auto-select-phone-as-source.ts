// <rule name="TDX/Ticket/Create/Auto select Phone as source">
import { setCreatedVia, formChangeListen, supportedFormIsSelected } from "utils/webpage/foreground/tdx/ticketCreate";
import { CreateMethod } from "utils/tdx/formNames";
import { log } from "utils/logger";


formChangeListen(() => {
    try {
        setCreatedVia(CreateMethod["Phone"]);
    } catch (e) {
        // this might be ok. Maybe the requested form doesn't have this field? Or maybe the form is blank
        if (supportedFormIsSelected()) {
            // so true error
            log.e(`Failed to set created via phone: ${e instanceof Error ? e.message : e}`);
        } else {
            log.d(`Failed to set created via phone on a nonstandard form.`);
        }
    }
});
