// <rule name="TDX/Ticket/View/Gray out unused actions">
import { log } from "utils/logger";
import * as ticketView from "utils/webpage/foreground/tdx/ticketView";

(() => {
	try {
		ticketView.grayOutActions(["Generate Bomgar Session", "Add to My Work", "Unassign Incident", "Edit Classification", "Set Parent", "Create Parent", "Copy Incident", "Add to Workspace", "Create Incident Template", "Forward", "Assign Workflow"]);
	} catch (e: unknown) {
		if (e instanceof Error) { // which it most certainly ts thank you very much
			log.e(e.message);
		}
	}
})();