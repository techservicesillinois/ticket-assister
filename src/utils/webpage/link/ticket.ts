import { sendMessage, PIPELINE_TICKET_TO_CEREBRO } from "./interface";

export const sendMessageToCerebro: (message: Object) => Promise<any> = async message => sendMessage(PIPELINE_TICKET_TO_CEREBRO, message);

/**
 * Handles cross-tab messages from a TDX Ticket
 *
 * Tickets primarily function as an information receiver
 *
 * @remarks
 * Sends and receives JSON
 * 
 * @deprecated: Do not use
 * Use cs31::onResponse instead
 */
export function listener(message: Object, onInfo: (info: Object) => void) {
	const parsedMessage = message;
	if (parsedMessage.status === "info") {
		onInfo(parsedMessage.info);
	} else if (parsedMessage.status === "redirect") {
		// they are redirecting. yay.
		// todo indicate that somewhere
	} // else ignore
}
