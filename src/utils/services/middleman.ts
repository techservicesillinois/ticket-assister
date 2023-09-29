import * as browser from "webextension-polyfill";
import { findBestTab } from "../findBestTab";
import { log } from "utils/logger";
import { stringBeginsWith } from "utils/stringParser";
import { BASE_URL, CEREBRO_URL } from "config";
import { PIPELINE_TO_BACKGROUND_SCRIPT } from "utils/webpage/link/interface";
import { CompletedRequest, handle } from "./triggered";

export default function() {

browser.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    log.d(`Message from ${sender.url} to "${request.to}"`);
    // sender.origin
    // todo check more specific (i.e. proper page)
    if (request.to === PIPELINE_TO_BACKGROUND_SCRIPT) {
        // we need to handle
        if (!("request" in request.message)) {
            return {
                status: "error",
                message: "bad",
            } satisfies CompletedRequest;
        } else {
            // ok to handle. valid at this point.
            // request.message.data may be undefined; this is ok
            return await handle(sender.tab, request.message.request, request.message.data);
        }
    } else if (stringBeginsWith(sender.url, BASE_URL)) { // todo check destination as well (maybe sniff packets too)
        const senderReadable = <string>sender.url; // this is a string because it begins with a string (above)
        log.d(`Forwarding a message from ${senderReadable} to Cerebro`);
        try {
            const response = await messageUrl(CEREBRO_URL, request);
            try {
                return (response);
            } catch (error) {
                log.e(`Failed to send response from Cerebro to ${senderReadable}: ${error instanceof Error ? error.message : error}`)
            }
        } catch (error) {
            // probably no tab active
            log.i(`Failed to send message from ${senderReadable} to Cerebro: ${error}`);
            log.d(`Sending no signal response to ${senderReadable}`);
            // let them know that it failed to send
            // so that they can spawn a new Cerebro tab
            try {
                return ({
                    status: "error",
                    message: "no signal",
                });
            } catch {
                log.e(`Failed to send no signal response to ${senderReadable}`);
            }
        }
    } else if (stringBeginsWith(sender.url, CEREBRO_URL)) {
        const senderReadable = <string>sender.url; // this is a string because it begins with a string (above)
        log.d(`Forwarding a message from ${senderReadable} to TDX`);
        try {
            const response = await messageUrl(`${BASE_URL}/Apps/40/Tickets/TicketDet*`, request);
            try {
                return (response);
            } catch (error) {
                log.e(`Failed to send response from Cerebro to ${senderReadable}: ${error instanceof Error ? error.message : error}`)
            }
        } catch (error) {
            // probably bad
            // maybe the closed the tab
            log.e(`Failed to send message from ${senderReadable} to Cerebro: ${error}`);
            log.d(`Sending no signal response to ${senderReadable}`);
            try {
                return ({
                    status: "error",
                    message: "no signal",
                });
            } catch {
                log.e(`Failed to send no signal response to ${senderReadable}`);
            }
        }
    }
    //return true; // async
});

/**
 * Sends a message to an open tab with the specified {@param url}.
 * @returns the response sent back in a {@link Promise}
 * 
 * @remarks
 * The returned promise will reject
 * if the chosen tab is not currently receiving
 * 
 * {@param url} may use wildcards. Is passed in {@link browser.tabs.query}.
 */
async function messageUrl(url: string, message: Object): Promise<any> {
    // could try and query by windowId or openerTabId
    // or title :)
    const tabs = await browser.tabs.query({ url });
    if (tabs.length === 0) {
        throw new Error("No tabs with that URL to use");
    }
    // filter tabs: 
    const tabToUse = findBestTab(tabs);
    if (tabToUse === undefined || tabToUse.id === undefined) {
        //log.e("Tab to message does not have an id!"); // maybe it isn't opened. let the callee handle this.
        throw new Error("Tab to message does not have an id!");
    }
    return browser.tabs.sendMessage(tabToUse.id, message);
    // todo: if this fails,
    // try the next best tab
}

}