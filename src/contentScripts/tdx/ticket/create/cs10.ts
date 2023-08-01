// <rule name="TDX/Ticket/Create/Auto select Service Request form">
import { log } from "utils/logger";
import { quickSelectOptions, setFormValue } from "utils/webpage/foreground/tdx/ticketCreate";

// we want to select Service Request
const formToSelect = quickSelectOptions.find(qsa => qsa.label === "Service Request");
if (formToSelect === undefined) {
    log.e(`Failed to find quick select option Service Request.`);
    log.w(`Using hardcoded default`);
    setFormValue("107");
} else {
    setFormValue(formToSelect.value);
}
