// <rule name="TDX/Ticket/View/Hide extra details">
import { watchDOMChanges } from "utils/lib/observeDOM";
import { log } from "utils/logger";
import { collapseDetailsExceptFor } from "utils/webpage/foreground/tdx/ticketView";

const collapse = () => {
	try {
		collapseDetailsExceptFor(["divResponsibility", "divAttribute2523", "divAge"]);
	} catch (e) {
		log.e(`Failed to collapse details: ${e instanceof Error ? e.message : e}`);
	}
};
collapse();
// every time there is an update
// (e.g. taking resp or flagging)
// recollapse
const detailsElParent = document.querySelector("#upDetails"); // dqs("#divDetails").parentElement
if (detailsElParent !== null) {
    let lastUpdated = Date.now();
    // The minimum number of seconds between updates
    // to allow re-collapsing the details el
    // To avoid double-counting of itself updating (e.g. infinite loops)
    const THROTTLE_TIME_MS = 1000;
    watchDOMChanges(detailsElParent, () => {
        const now = Date.now();
        if (now - lastUpdated > THROTTLE_TIME_MS) {
            if (document.querySelector("#tkast-details-collapse") === null) {
                log.d("Collapsing details after update");
                // TODO: toggling flag hides SRA from the mini and expanded details
                collapse();
                lastUpdated = now;
            } else {
                // probably just toggled the collapse by clicking it
                // and this was not a forced refresh
                log.d("Skipping collapse: collapse button already exists");
            }
        }
    });
} else {
    log.w("Could not locate detailsEl to watch for changes to recollapse.");
}
