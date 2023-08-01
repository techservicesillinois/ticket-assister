// <rule name="TDX/Ticket/Update/Ctrl+Enter to submit comment">
import { getWysiwygBody, submitOnCtrlEnter } from "utils/webpage/foreground/tdx/shared";
import { getSaveButton } from "utils/webpage/foreground/tdx/ticketUpdate";


submitOnCtrlEnter(document.body, getSaveButton());
(async () => {
    submitOnCtrlEnter(await getWysiwygBody(), getSaveButton());
})();
