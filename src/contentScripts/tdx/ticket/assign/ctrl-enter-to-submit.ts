// <rule name="TDX/Ticket/Assign/Ctrl+Enter to submit">
import { getSaveButton, getNewResponsibilityEl } from "utils/webpage/foreground/tdx/ticketAssign";
import { submitOnCtrlEnter } from "utils/webpage/foreground/tdx/shared";
import { log } from "utils/logger";
import { watchDOMChanges } from "utils/lib/observeDOM";


try {
    submitOnCtrlEnter(document.body, getSaveButton());
    log.d("Added Ctrl+Enter listener on document body");
} catch (e) {
    log.e(`Failed to add submit on Ctrl+Enter listener on document body: ${e instanceof Error ? e.message : e}`);
}

try {
    const addCtrlEnterToInputEl = () => {
        // a fresh copy
        submitOnCtrlEnter(getNewResponsibilityEl(), getSaveButton());
        log.d("Added Ctrl+Enter listener on input el");
    }
    // getNewResponsibilityEl().parentElement.parentElement refreshes on select new person
    watchDOMChanges(getNewResponsibilityEl().parentElement.parentElement, addCtrlEnterToInputEl);
    // don't need to run immediately since the document body listener works at first
} catch (e) {
    log.e(`Failed to add submit on Ctrl+Enter listener on input el: ${e instanceof Error ? e.message : e}`);
}