// <rule name="TDX/Ticket/Create/Ctrl+Enter to submit">
import * as ticketCreate from "utils/webpage/foreground/tdx/ticketCreate";
import { getWysiwygDocument, submitOnCtrlEnter } from "utils/webpage/foreground/tdx/shared";

(() => {
	submitOnCtrlEnter(document.body, ticketCreate.getSaveButton());
	submitOnCtrlEnter(getWysiwygDocument().body, ticketCreate.getSaveButton());
})();