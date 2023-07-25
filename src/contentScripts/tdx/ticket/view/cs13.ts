// <rule name="TDX/Ticket/View/Ctrl+Enter to submit comment">
import * as ticketView from "utils/webpage/foreground/tdx/ticketView";
import { getWysiwygDocument, submitOnCtrlEnter } from "utils/webpage/foreground/tdx/shared";

(() => {
	submitOnCtrlEnter(getWysiwygDocument().body, ticketView.getCommentSaveButton());
})();