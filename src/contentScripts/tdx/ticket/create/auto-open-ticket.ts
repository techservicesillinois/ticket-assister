// <rule name="TDX/Ticket/Create/Auto open ticket">
import { BASE_URL } from "config";
import { log } from "utils/logger";
import { getCurrentTicketNumber } from "utils/webpage/parser/ticket";
import { getTicketViewUrl } from "utils/webpage/foreground/tdx/pageLocator";


try {
	log.i(`Redirecting to new created ticket #${getCurrentTicketNumber()}`);
	window.location.href = getTicketViewUrl(getCurrentTicketNumber());
} catch (e) {
	log.e("Couldn't redirect to new ticket");
}
/*
// this also works:
for (const a of document.getElementsByTagName("*")) {
	if (a.children.length === 0) {
		if (a.textContent.toLowerCase().indexOf("view") !== -1) {
			window.location.href = a.href;
			//a.click();
		}
	}
}
*/
