// <rule name="TDX/Ticket/View/Show client's recent tickets">
import { addRecentRequestorTickets } from "utils/webpage/foreground/tdx/ticketView";
import { log } from "utils/logger";


try {
	addRecentRequestorTickets();
} catch (e) {
	log.e(`Failed to add recent requestor tickets: ${e instanceof Error ? e.message : e}`);
}
