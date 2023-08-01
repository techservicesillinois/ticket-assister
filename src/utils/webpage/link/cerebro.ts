import { sendMessage, jsonOrThrow, PIPELINE_CEREBRO_TO_TICKET } from "./interface";
import { getCurrentNetId } from "../parser/cerebro";
import { lookupNetIDOrUIN, getKeyInfo, getYellowInfo, getRedInfo } from "../foreground/cerebro";
import { log } from "utils/logger";

export const sendMessageToTicket: (message: Object) => void = message => sendMessage(PIPELINE_CEREBRO_TO_TICKET, message);

/**
 * Stores if the page is redirecting currently
 * 
 * If the page is redirecting, it will not redirect further
 */
let redirecting = false;

/**
 * Handles cross-tab messages from Cerebro
 *
 * Cerebro primarily functions as an information sender
 *
 * @remarks
 * Don't need a formal state machine
 *
 * Just wait for get:NETID and redirect or send info
 * Sends and receives JSON
 */
export function listener(message: Object): Object {
	try {
		const parsedMessage = message;
		if (parsedMessage.status === "get") {
			const netIdToGet = parsedMessage.search; // or UIN
			if (getCurrentNetId() === netIdToGet) {
				// send it all
				return {
					status: "ok",
					contents: "info",
					info: {
						netId: netIdToGet, // just verified that this is === getCurrentNetId()
						key: getKeyInfo(),
						yellow: getYellowInfo(),
						red: getRedInfo(),
					},
				};
			} else {
				if (!redirecting) {
					lookupNetIDOrUIN(netIdToGet);
					redirecting = true;
				}
				return {
					status: "ok",
					contents: "redirect",
				};
			}
		} // else ignore
	} catch (e) {
		log.e(`Failed to receive message ${message}: ${e}`);
	}
}
