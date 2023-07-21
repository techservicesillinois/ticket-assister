//import * as browser from "webextension-polyfill";
// this is annoying.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const browser = require("webextension-polyfill");
import { log } from "../utils/logger";
import rules from "./rules";
import presets from "./presets";
import { customPresetRulePrefix } from "../utils/rules/storage";

/**
 * Utility function to match paths with wildcards
 * @todo Ignores queries, slashes, and hashes.
 * 
 * @param path - The current page path
 * @param featurePath - The path to match
 * @returns true if the path matches the featurePath, false otherwise
 */
function pathMatches(path: string, featurePath: string): boolean {
    // Convert * wildcard to .* regex
    const regexPath = featurePath.replace("*", ".*");
    // test if the path matches
    return new RegExp(`^${regexPath}$`).test(path);
}
/*(function setUpRules() {
    // listen for page navigation
    browser.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
        if (changeInfo.status === "complete" && tab.url !== undefined) {
            const url = new URL(tab.url);
            const path = url.pathname;

            // check if the path matches any of the defined rules
            rules.forEach((rule) => {
                if (pathMatches(path, rule.feature.path)) {
                    const ruleName = rule.feature.name;
                    log.d(`Navigation to path ${path} matched rule ${ruleName}.`);
                    // todo: verify that this option is enabled from settings
                    if (true) {
                        log.d(`Action ${ruleName} is enabled. Proceeding...`);
                        // run the action callback
                        try {
                            //rule.action();
                            browser.runtime.sendMessage({ type: "executeRule", rule: rule });
                            log.d(`Action ${ruleName} ran`);
                        } catch (e) {
                            log.e(`Action ${ruleName} had an error: ${e}`);
                        }
                    }
                }
            });
        }
    });
    log.i(`Page listener SW initialized.`);
})();*/

self.addEventListener("install", () => {
    log.d("Service worker installed.");
});
self.addEventListener("activate", () => {
    log.d("Service worker activated.");
});

browser.runtime.onInstalled.addListener(() => {
    log.d("Service worker installed 2.");
});
browser.runtime.onStartup.addListener(() => {
    log.d("Service worker started.");
});

/*browser.runtime.onUpdateAvailable(() => {
    // apply update
    browser.runtime.reload();
});*/ // wait for browser restart


/**
 * A {@link Map} of the content script registration records
 * from the rule names
 *
 * Used to disable rules later by the rule name.
 */
const contentScriptRegistrationRecords = Map<string, RegisteredContentScript>();

browser.runtime.onInstalled.addListener((id: string?, previousVersion: string?, reason: runtime.OnInstalledReason, temporary: boolean) => {
	// todo load default storage from presets
	// and registerContentScript
});

// Register and register content scripts as options are changed
// https://developer.chrome.com/docs/extensions/mv3/content_scripts/
browser.storage.onChanged.addListener((changes, areaName) => {
	if (areaName === "sync") { // && changes.options?.newValue
		for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
			if (oldValue !== newValue) {
				// add & remove content scripts
				// todo send message to optionsInteractions.js and display that to the user (i.e. rollback if not successful)
				if (key === "currentPreset") {
					if (newValue) {
						// disable all old content scripts and enable all new content scripts
						// according to the preset
						// todo
					} else {
						// disable all content scripts
						// todo
					}
				} else if (await getCurrentPreset() === "Custom" && stringBeginsWith(currentPreset, customPresetRulePrefix)) {
					if (newValue) {
						// enable this specific preset
						// todo
					} else {
						// disable this specific preset
						// todo
					}
				}
			}
		}
	}
});

/**
 * Registers the content script for a rule
 * according to its rules properties
 *
 * Automatically registers the content script in {@link contentScriptRegistrationRecords}
 */
function registerContentScript(rule: ToggleableFeature): Promise<RegisteredContentScript> {
	// todo
	try {
		//browser.scripting.registerContentScripts()
		const registration = await browser.contentScripts.register({
			id: "rule-name", // not sure if this will work
			//allFrames: true,
			//css: { file: "/path", code: "body{color:blue;}"},
			matches: ["*://example.com"],
			js: {
				code: () => console.log("hi"),
			},
			runAt: "document_end",
		});
		// registration.unregister()
		contentScriptRegistrationRecords.set(rule.name, registration);
		log.i(`Successfully registered content script "${"rule-name"}".`);
		return registration;
	} catch {
		log.e(`Failed to register content script "${"rule-name"}".`);
		throw;
	}
}
/**
 * Deregisters (deactivates) a content script
 *
 * @remarks
 * Typically used to remove a rule content script, but requires an {@param ruleId}
 * instead of a rule name.
 */
function deregisterContentScript(ruleId: string): Promise<void> {
	return browser.scripting.unregisterContentScripts({ ids: [ruleId] });
}
/**
 * Deregisters (deactivates) multiple content script
 *
 * @remarks
 * Typically used to remove a rule content script, but requires an {@param ruleId}
 * instead of a rule name.
 */
function deregisterContentScript(ruleIds: Array<string>): Promise<void> {
	return browser.scripting.unregisterContentScripts({ ids: ruleIds });
}


/*
// alternate solution:
//browser.action.onClicked.addListener((tab) => {
//browser.tabs.onUpdated((tabId, changeInfo, tab) => {
browser.webNavigation.onDOMContentLoaded.addListener(details => { // .onCompleted.addListener
    for (const rule of rules) {
        if (pathMatches(details.url, rule.path)) {
            browser.scripting.executeScript({
                target: {tabId : details.tabId},
                //files: rule.scriptFilePath,
				func: rule.script,
                //args: [],
            });
        }
    }
});
*/

