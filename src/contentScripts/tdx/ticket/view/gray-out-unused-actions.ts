// <rule name="TDX/Ticket/View/Gray out unused actions">
import { log } from "utils/logger";
import { grayOutActions } from "utils/webpage/foreground/tdx/ticketView";

const actionsToGrayOut = [
	"Generate Bomgar Session", "Add to My Work", "Add to Workspace", "Edit Classification", "Set Parent", "Create Parent", "Forward", "Assign Workflow",
	"Unassign Incident", "Copy Incident", "Create Incident Template",
	"Unassign Service Request", "Copy Service Request", "Create Service Request Template",
	"Convert To Project Request", "Add to Calendar",
];
try {
	/*
	// todo: get the Classification
	// and only try to gray out the proper ones
	function getClassification() {
		const copyTypeEl = dqs("#btnCopyTypeAndID").children[0].textContent;
		return copyTypeEl.substring(0, copyTypeEl.indexOf(" ID:"));
	}
	*/
	grayOutActions(actionsToGrayOut);
} catch (e: unknown) {
	if (e instanceof Error) { // which it most certainly ts thank you very much
		// to an extent, some of this is expected
		// as either service request or incident gray outs will fail
		// also "Add to My Work" cannot be grayed if you are prim resp, etc

		// if *everything* failed
		// todo this is janky
		if ((e.message.match(/,/g) || []).length === actionsToGrayOut.length) {
			log.e(`Failed to gray out action(s): ${e instanceof Error ? e.message : e}`);
		} else {
			// this is expected more or less
			log.d(`Failed to gray out action(s): ${e instanceof Error ? e.message : e}`);
		}
	}
}
