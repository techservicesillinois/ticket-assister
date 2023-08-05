// <rule name="TDX/Ticket/View/Don't warn if private comment is not notifying">
import { DomParseError } from "utils/errors";
import { watchDOMChanges } from "utils/lib/observeDOM";
import { getCommentBox, getCommentMakePrivateButton, commentNotifyIsEmpty } from "utils/webpage/foreground/tdx/ticketView";
import { log } from "utils/logger";


try {
	const commentBox = getCommentBox();
	// only shows up once you start typing
	watchDOMChanges(commentBox, () => {
		try {
			const warningMessage = document.querySelector("#divWarnNotificationSelection");
			if (warningMessage === null || !(warningMessage instanceof HTMLElement)) {
				return; // no warning message
			}
			if (getCommentMakePrivateButton().checked === true && commentNotifyIsEmpty()) {
				warningMessage.style.display = "none";
			} else {
				// restore default
				warningMessage.style.display = "block";
			}
		} catch {
			log.e("Failed to try to hide private comment waning message");
		}
	});
} catch (e) {
	// probably from getCommentBox()
	log.e(`Failed to get comment box: ${e instanceof Error ? e.message : e}`);
}