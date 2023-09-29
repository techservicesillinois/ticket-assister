// <rule name="TDX/Ticket/Assign/Warn if no SRA">
import { showNotice } from "utils/webpage/foreground/tdx/ticketAssign";
import { getTicketDatumBg } from "utils/webpage/background/ticketActions";
import { log } from "utils/logger";
import { getCurrentTicketNumber } from "utils/webpage/parser/ticket";

// could query open tabs to pull data from instead
getTicketDatumBg(getCurrentTicketNumber(), "Request Area").then(requestArea => {
	log.d(`SRA is ${requestArea}`);
	if (requestArea === undefined || requestArea === "") { // (not found)
		showNotice("Request area is not set");
		log.i("Displaying notice: Request area is not set");
	} else {
		log.d("Request area is filled out. Not displaying notice");
	}
}).catch(e => log.e(`Failed to check if the request area is not set: ${e instanceof Error ? e.message : e}`));
