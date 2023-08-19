// <rule name="TDX/Ticket/Assign/Auto focus">
import { getNewResponsibilityEl } from "utils/webpage/foreground/tdx/ticketAssign";
import { log } from "utils/logger";


try {
    getNewResponsibilityEl().click();
    log.d("Focused in the New Responsibility element");
} catch (e) {
    log.e(`Failed to focus in the New Responsibility element: ${e instanceof Error ? e.message : e}`);
}
