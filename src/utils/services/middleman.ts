import browser from "webextension-polyfill";
import { findBestTab } from "../findBestTab";
import { log } from "utils/logger";
import { stringBeginsWith } from "utils/stringParser";
import { BASE_URL } from "config";

export default function() {

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    log.d(`Message ${request} from ${sender.url}`);
    // sender.origin
    // todo check more specific (i.e. proper page)
    if (stringBeginsWith(sender.url, BASE_URL)) {
        log.d("Forwarded a message from TDX to Cerebro");
        messageUrl("https://cerebro.techservices.illinois.edu/", request)
            .then(response => {
                log.d(`Forwarding response back to ${sender.url} from Cerebro: ${response}`);
                sendResponse(response);
            })
            .catch(error => {
                log.e(`Failed to send message: ${error}`);
                // let them know that it failed to send
                // so that they can spawn a new Cerebro tab
                sendResponse({
                    status: "error",
                    message: "no signal",
                });
            });
    } else if (stringBeginsWith(sender.url, "https://cerebro.techservices.illinois.edu/")) {
        log.d("Forwarded a message from Cerebro to TDX");
        messageUrl("https://help.uillinois.edu/SBTDNext/Apps/40/Tickets/TicketDet*", request)
            .then(response => {
                log.d(`Forwarding response back to ${sender.url} from TDX: ${response}`);
                sendResponse(response);
            })
            .catch(error => {
                log.e(`Failed to send message: ${error}`);
                sendResponse({
                    status: "error",
                    message: "no signal",
                });
            });
    }
    return true; // async
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
    // filter tabs: 
    const tabToUse = findBestTab(tabs);
    if (tabToUse.id === undefined) {
        log.e("Tab to message does not have an id!");
        throw new Error("Tab to message does not have an id!");
    }
    return browser.tabs.sendMessage(tabToUse.id, message);
    // todo: if this fails,
    // try the next best tab
}

}