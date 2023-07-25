// <rule name="TDX/Ticket/Create/Auto open ticket">
import { BASE_URL } from "config";
import { log } from "utils/logger";
import { getCurrentTicketNumber } from "utils/webpage/parser/ticket";

(() => {
	// todo ensure that this redirect doesn't compromise the "On ticket create/Auto take ticket" rule from race conditions
	try {
		window.location.href = BASE_URL + "/TDNext/Apps/40/Tickets/TicketDet.aspx?TicketID=" + getCurrentTicketNumber();
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
})();