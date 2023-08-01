// <rule name="TDX/Ticket/View/Don't warn if private comment is not notifying">
import { DomParseError } from "utils/errors";
import { watchDOMChanges } from "utils/lib/observeDOM";
import { getCommentBox, getCommentMakePrivateButton, commentNotifyIsEmpty } from "utils/webpage/foreground/tdx/ticketView";


// only shows up once you start typing
watchDOMChanges(getCommentBox(), () => {
	const warningMessage = document.querySelector("div#divWarnNotificationSelection");
	if (warningMessage === null || !(warningMessage instanceof HTMLElement)) {
		throw new DomParseError();
	}
	if (getCommentMakePrivateButton().checked === true && commentNotifyIsEmpty()) {
		warningMessage.style.display = "none";
	} else {
		// restore default
		warningMessage.style.display = "block";
	}
});
