// <rule name="TDX/Ticket/Create/Hide additional contacts">
import { formChangeListen, getAdditionalContactsEl } from "utils/webpage/foreground/tdx/ticketCreate";
import { collapseEl } from "utils/webpage/foreground/tdx/shared";
import { log } from "utils/logger";


/**
 * Tracks the previous hide el
 * if additional contacts have been hidden before
 * 
 * @remarks
 * Each time the form changes,
 * this gets called but the Person Requiring Service field gets unlinked.
 * So, we need to recreate it
 * and remove the old.
 */
let lastHideEl: HTMLElement | null = null;
formChangeListen(() => {
    try {
        if (lastHideEl) {
            // almost certainly has a parent element
            if (lastHideEl.parentElement) {
                lastHideEl.parentElement.removeChild(lastHideEl);
            }
        }
        lastHideEl = collapseEl(getAdditionalContactsEl(), "Additional Contacts", true);
    } catch (e) {
        log.e(`Failed to collapse additional contacts: ${e.message}`);
    }
});

