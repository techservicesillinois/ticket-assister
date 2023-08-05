// <rule name="TDX/Ticket/Create/Hide additional contacts">
import { formChangeListen, getAdditionalContactsEl, getFormSelectValue, quickSelectOptions, supportedFormIsSelected } from "utils/webpage/foreground/tdx/ticketCreate";
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
        const faVal = getFormSelectValue();
        if (supportedFormIsSelected() && faVal !== quickSelectOptions.find(qso => qso.label === "Classtech Problem Report")?.value) {
            log.e(`Failed to collapse additional contacts: ${e instanceof Error ? e.message : e}`);
        } else {
            log.d(`Failed to collapse additional contacts on unsupported form: ${e instanceof Error ? e.message : e}`);
        }
    }
});

