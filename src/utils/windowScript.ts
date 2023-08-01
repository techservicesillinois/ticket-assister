import * as browser from "webextension-polyfill";
import { log } from "./logger";

/**
 * injects an internal script,
 * giving it access to the document's `window`
 *
 * @param relativePath Local path of the internal script
 * 
 * **Must be registered in web_accessible_resources for the current page.**
 */
export function injectScript(relativePath: string) {
    const script = document.createElement("script");
    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", browser.runtime.getURL(`windowScripts/${relativePath}`));
    document.body.appendChild(script);
    log.d(`Injected script ${relativePath}`);
}
