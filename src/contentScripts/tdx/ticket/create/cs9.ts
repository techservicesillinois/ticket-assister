// <rule name="TDX/Ticket/Create/Ctrl+Enter to submit">
import { formChangeListen, getSaveButton } from "utils/webpage/foreground/tdx/ticketCreate";
import { getWysiwygBody, submitOnCtrlEnter } from "utils/webpage/foreground/tdx/shared";
import { log } from "utils/logger";


// NOTE: this Content Script is different than the other ones
// which use webpage/foreground/tdx/shared::addSubmitOnCtrlEnterHandlers
// because it must listen for form changes
submitOnCtrlEnter(document.body, getSaveButton());
formChangeListen(async () => {
    try {
        submitOnCtrlEnter(await getWysiwygBody(), getSaveButton());
    } catch {
        log.e("Failed to add submit on ctrl enter listener to wysiwyg body");
    }
});
