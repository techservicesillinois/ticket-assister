// <rule name="TDX/Ticket/Create/Quick select Service Request, Incident, Classtech form">
import { getFormBox, generateQuickSelect } from "utils/webpage/foreground/tdx/ticketCreate";
import { log } from "utils/logger";


try {
	getFormBox().appendChild(generateQuickSelect());
} catch (e) {
	log.e(`Failed to add quick select: ${e instanceof Error ? e.message : e}`);
}
