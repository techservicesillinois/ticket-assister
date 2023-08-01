// <rule name="TDX/Ticket/Edit/Ctrl+Enter to submit comment">
import { getSaveButton } from "utils/webpage/foreground/tdx/ticketEdit";
import { getWysiwygBody, submitOnCtrlEnter } from "utils/webpage/foreground/tdx/shared";


submitOnCtrlEnter(document.body, getSaveButton());
(async () => {
    submitOnCtrlEnter(await getWysiwygBody(), getSaveButton());
})();
