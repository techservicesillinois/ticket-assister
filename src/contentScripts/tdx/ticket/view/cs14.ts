// <rule name="TDX/Ticket/View/Make comments private by default">
import * as ticketView from "utils/webpage/foreground/tdx/ticketView";
import { boolToCheckboxValue } from "utils/tdx/formNames";

(() => {
	ticketView.getCommentMakePrivateButton().value = boolToCheckboxValue(true);
})();