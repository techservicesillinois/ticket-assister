import { log } from "utils/logger";
import * as browser from "webextension-polyfill";

/**
 * Sends {@message message} to {@param to}
 * 
 * @returns the response in a {@link Promise}
 *
 * @internalRemarks
 * https://developer.chrome.com/docs/extensions/mv3/messaging/
 * Could use a middleman service worker.
 *
 * Could use postMessage
 * https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
 * but this would require opening a specific Cerebro window
 * 
 * @todo
 * refact this and other schemas to not use an Object but something better
 */
export async function sendMessage(to: string, message: Object): Promise<any> {
	return await browser.runtime.sendMessage({ to, message });
}

/**
 * Sets a callback function ({@param listener}) from sender {@param from}
 * 
 * {@param listener} can return a response
 */
export function receiveMessages(from: string, listener: (message: { to: string, message: Object }) => Object | void) {
	log.i(`Listening for messages to ${from}`);
	browser.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
		if (sender.tab) {
			log.d(`Recieved a message from content script ${sender.tab.url}: ${request}`);
		} else {
			log.d(`Recieved a message from the extension: ${request}`);
		}
		if (request.to === from) {
			// this is for us
			const sendBack = listener(request.message); // await if needed
			if (sendBack !== undefined) {
				log.d(`Sending response back to ${sender.tab ? "a tab" : "the extension"} ${sendBack}`);
				return (sendBack);
			}
		}
		//return true; // async
		//return false; // sync
	});
}

export const PIPELINE_CEREBRO_TO_TICKET = "ticket/view";
export const PIPELINE_TICKET_TO_CEREBRO = "cerebro";

/**
 * Returns the Object of JSON
 * @throws if invalid
 *
 * For avoiding the let try catch antipattern
 */
export function jsonOrThrow(json: string): Object {
	try {
		return JSON.parse(json);
	} catch {
		throw new Error("Failed to parse");
	}
}