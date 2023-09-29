import { log } from "./logger";
import { sendMessageToBackground } from "./webpage/link/background";

/**
 * Closes the window of the current tab
 */
export function closeWindow() {
    //window.close(); // cannot call per https://developer.mozilla.org/en-US/docs/Web/API/Window/close
    sendMessageToBackground({
        request: "close",
    })
        .catch(e => log.e(`Failed to send message requesting to be closed: ${e instanceof Error ? e.message : e}`));
}