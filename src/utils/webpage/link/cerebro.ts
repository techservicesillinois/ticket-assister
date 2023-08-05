import { sendMessage, jsonOrThrow, PIPELINE_CEREBRO_TO_TICKET } from "./interface";
import { getCurrentNetId, getNetIdInput } from "../parser/cerebro";
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
 * A basic schema form which the TDX Ticket and Cerebro
 * should use to communicate
 */
interface TdxCerebroSchema {
	response: string,
	contents: string,
	info?: Object, // suck it
}

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
export function listener(message: Object): TdxCerebroSchema {
	try {
		if (message.status === "get") {
			const netIdToGet = message.search; // or UIN
			const currentNetId = getCurrentNetId();
			log.d(`Requested NetID is ${netIdToGet} and current NetID is ${currentNetId}`);
			if (!currentNetId) {
				// netid not found or not loaded
				if (getNetIdInput() === netIdToGet) {
					// the requested user DNE
					log.d("Sending notfound to TDX");
					return {
						status: "ok",
						contents: "notfound",
					};
				} else {
					// no netid is loaded or an old not found netid is loaded
					loadNetID(netIdToGet);
					log.d("Sending redirect to TDX");
					return {
						status: "ok",
						contents: "redirect",
					};
				}
			} else if (currentNetId === netIdToGet) {
				// send it all
				log.d("Sending info to TDX");
				return {
					status: "ok",
					contents: "info",
					info: {
						netId: netIdToGet, // just verified that this is === getCurrentNetId()
						key: getKeyInfo(), // these should not throw since currentNetId !== null
						yellow: getYellowInfo(),
						red: getRedInfo(),
					},
				};
			} else {
				// a different netid is loaded
				// i.e. stale
				loadNetID(netIdToGet);
				log.d("Sending redirect to TDX");
				return {
					status: "ok",
					contents: "redirect",
				};
			}
		} else {
			// unknown response.
			log.w(`Received an unexpected response of status ${message.status}`);
			return {
				status: "error",
				contents: "unexpected",
			};
		}
	} catch (e) {
		log.e(`Failed to receive message: ${e}`);
	}
	log.e(`Reply was not sent; sending error uncaught`);
	console.log(message); // todo log
	// should have responded by now
	return {
		status: "error",
		contents: "uncaught",
	};
}

/**
 * Loads a netid
 * if one is not already loading
 * 
 * @remarks
 * Also will load a UIN
 */
function loadNetID(netid: string) {
	if (!redirecting) {
		lookupNetIDOrUIN(netid);
		redirecting = true;
	}
}
