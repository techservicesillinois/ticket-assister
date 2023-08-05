// <rule name="TDX/Ticket/View/Button to copy NetID">
import { addCopyNetIDButton } from "utils/webpage/foreground/tdx/ticketView";
import { log } from "utils/logger";


try {
	addCopyNetIDButton();
} catch (e) {
	log.e(`Failed to add copy NetID button: ${e instanceof Error ? e.message : e}`);
}
