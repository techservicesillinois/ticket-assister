// <rule name="TDX/Ticket/View/Make comments private by default">
import { getCommentMakePrivateButton } from "utils/webpage/foreground/tdx/ticketView";
import { onWysiwygLoad } from "utils/webpage/foreground/tdx/shared";
import { log } from "utils/logger";

const makePrivate = () => {
	try {
		getCommentMakePrivateButton().checked = true;
	} catch (e) {
		log.e(`Failed to set make private button el to checked: ${e.message}`);
	}
}
makePrivate();
// each time loaded this gets reset.
onWysiwygLoad(makePrivate);