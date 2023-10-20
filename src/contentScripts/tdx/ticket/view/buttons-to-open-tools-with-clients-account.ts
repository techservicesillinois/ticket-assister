// <rule name="TDX/Ticket/View/Buttons to open tools with client's account">
import { addOpenToolsButtons } from "utils/webpage/foreground/tdx/ticketView";
import { log } from "utils/logger";


try {
	addOpenToolsButtons();
} catch (e) {
	log.e(`Failed to add open tools buttons: ${e instanceof Error ? e.message : e}`);
}

