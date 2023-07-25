// <rule name="TDX/Ticket/Edit/Ctrl+Enter to submit comment">
import * as ticketEdit from "utils/webpage/foreground/tdx/ticketEdit";
import { getWysiwygDocument, submitOnCtrlEnter } from "utils/webpage/foreground/tdx/shared";

(() => {
    submitOnCtrlEnter(document.body, ticketEdit.getSaveButton());
    submitOnCtrlEnter(getWysiwygDocument().body, ticketEdit.getSaveButton());
})();