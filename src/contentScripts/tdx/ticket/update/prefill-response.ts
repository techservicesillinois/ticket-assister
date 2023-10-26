// <rule name="TDX/Ticket/Update/Prefill response">
import { getCustomPrefillOrDefault } from "utils/rules/prefill";
import { setPrefill } from "utils/webpage/foreground/tdx/ticketUpdate";
import { log } from "utils/logger";


(async () => {
	try {
		await setPrefill(await getCustomPrefillOrDefault());
		log.i(`Prefill population complete.`);
	} catch (e) {
		log.e(`Failed to insert prefill: ${e instanceof Error ? e.message : e}`);
	}
})();
