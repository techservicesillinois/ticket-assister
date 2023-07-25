// <rule name="TDX/Ticket/Update/Ctrl+Enter to submit comment">
import { getWysiwygDocument, submitOnCtrlEnter } from "utils/webpage/foreground/tdx/shared";
import * as ticketUpdate from "utils/webpage/foreground/tdx/ticketUpdate";

(() => {
    submitOnCtrlEnter(document.body, ticketUpdate.getSaveButton());
    submitOnCtrlEnter(getWysiwygDocument().body, ticketUpdate.getSaveButton());
})();