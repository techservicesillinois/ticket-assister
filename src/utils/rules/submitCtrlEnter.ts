import { submitOnCtrlEnter, getWysiwygBody } from "utils/webpage/foreground/tdx/shared";
import { getSaveButton } from "utils/webpage/foreground/tdx/ticketEdit";
import { log } from "utils/logger";

/**
 * Adds submit on ctrl enter handlers
 * to the body and WYSIWYG els,
 * catching errors and logging them.
 * 
 * @remarks
 * To be ran on Edit and Update pages.
 * Create page needs to be ran on form update.
 * Comment page has a different submit button [id]
 */
export function addSubmitOnCtrlEnterHandlers() {
	try {
		submitOnCtrlEnter(document.body, getSaveButton());
	} catch (e) {
		log.e(`Failed to add submit on Ctrl+Enter listener to document body: ${e instanceof Error ? e.message : e}`);
	}
	(async () => {
		try {
			submitOnCtrlEnter(await getWysiwygBody(), getSaveButton());
		} catch (e) {
			log.e(`Failed to add submit on Ctrl+Enter listener to WYSIWYG body: ${e instanceof Error ? e.message : e}`);
		}
	})();
}