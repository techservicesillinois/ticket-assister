import * as browser from "webextension-polyfill";

import { log } from "../utils/logger";
import rules, { getRule } from "./rules";
import presets, { CUSTOM_PRESET, DEFAULT_PRESET } from "./presets";
import { customPresetRulePrefix, getAllCustomRuleStatuses, getCurrentPreset } from "utils/rules/storage";
import type { ToggleableFeature } from "utils/rules/types";
import { setCurrentPreset } from "utils/rules/storage";
import { changeExtension, stringBeginsWith } from "utils/stringParser";

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

/*browser.runtime.onUpdateAvailable(() => {
    // apply update
    browser.runtime.reload();
});*/ // wait for browser restart


/**
 * A {@link Map} of the {@link RegisteredContentScript}s
 * from the rule names ({@link string})
 *
 * Used to disable rules later by the rule name.
 * 
 * @internalRemarks
 * Could check `browser.scripting.getRegisteredContentScripts()`,
 * but that would not contain our rule names as keys and would be hard to transform
 */
const contentScriptRegistrationRecords = new Map();//<string, RegisteredContentScript>

//self.addEventListener("install", () => {
browser.runtime.onInstalled.addListener(async (_id, _previousVersion, _reason, _temporary) => {
	// (id: string?, previousVersion: string?, reason: runtime.OnInstalledReason, temporary: boolean)
	log.i("Service worker installed.");
	
	// we would deregister all content scripts here
	// but there shouldn't be any since this is a fresh install
	// and we wouldn't be able to find them in contentScriptRegistrationRecords anyways
	
	const presetName = await getCurrentPreset();
	log.d(`The current preset is ${presetName}.`);
	if (presetName === null) {
		// set to default
		log.w(`No current preset found in storage. Setting to the default (${DEFAULT_PRESET}).`);
		try {
			await setCurrentPreset(DEFAULT_PRESET);
		} catch {
			log.e(`Failed to set current preset to the default (${DEFAULT_PRESET}).`);
		}
	} else {
		try {
			await activateRulesForPreset(presetName);
			log.d(`Rules for preset ${presetName} activated.`);
		} catch (e) {
			log.crit(`Failed to activate rules for preset ${presetName}: ${e}`);
		}
	}
});

// Register and register content scripts as options are changed
// https://developer.chrome.com/docs/extensions/mv3/content_scripts/
browser.storage.onChanged.addListener(async (changes, areaName) => {
	if (areaName === "sync") { // && changes.options?.newValue
		log.d(`The storageArea was updated.`);
		for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
			log.d(`Processing change: ${key}: ${oldValue} -> ${newValue}`);
			if (oldValue !== newValue) {
				log.d(`Diff detected.`);
				// add & remove content scripts
				// todo send message to optionsInteractions.js and display that to the user (i.e. rollback if not successful)
				if (key === "currentPreset") {
					log.d(`Current preset was changed.`);
					// todo verify oldValue and newValue types before passing
					handlePresetChange(oldValue, newValue);
				} else if (stringBeginsWith(key, customPresetRulePrefix)) {
					log.d(`Custom preset rule was changed.`);
					// todo verify oldValue and newValue types before passing
					handleRuleChange(key, oldValue, newValue);
				}
			}
		}
	}
});
/**
 * Handles the change of a preset setting,
 * deactivating old rules and activating new rules
 * according to the different presets
 * 
 * @param oldPresetName The name of the preset for which rules should be deregistered
 * @param newPresetName The name of the preset for which rules should be registered
 * 
 * @remarks
 * Rules taken as specified in {@link presets}.
 * 
 * Logs out any errors and successes to {@link log}.
 */
async function handlePresetChange(oldPresetName: string, newPresetName: string) {
	// todo calculate the diff from new preset rules to old preset rules to make this more efficient

	// according to the new preset...
	// disable all old content scripts
	try {
		await deactivateRulesForPreset(oldPresetName);
		log.d(`Rules for preset ${oldPresetName} deactivated.`);
	} catch (e) {
		log.crit(`Failed to deactivate rules for preset ${oldPresetName}: ${e}`);
	}
	// enable all new content scripts
	// the function does custom preset handling as well
	try {
		await activateRulesForPreset(newPresetName);
		log.d(`Rules for preset ${newPresetName} activated.`);
	} catch (e) {
		log.crit(`Failed to activate rules for preset ${newPresetName}: ${e}`);
	}
	return;
}
/**
 * Handles the change of a rule setting,
 * deregistering it if its new value is false
 * and registering it if its new value is true
 * 
 * @param oldPresetName The name of the preset for which rules should be deregistered
 * @param newPresetName The name of the preset for which rules should be registered
 * 
 * @remarks
 * Rules taken as specified in {@link presets}.
 * 
 * Logs out any errors and successes to {@link log}.
 */
async function handleRuleChange(ruleName: string, oldRuleValue: boolean, newRuleValue: boolean) {
	if (oldRuleValue === newRuleValue) {
		// no changes here
		return;
	}
	const currentPreset = await getCurrentPreset();
	if (currentPreset === CUSTOM_PRESET) {
		if (newRuleValue) {
			// => !oldRuleValue
			// register this specific rule
			try {
				await registerContentScriptByRuleName(ruleName);
			} catch (e) {
				// this is function-breaking
				log.crit(`Failed to register content script for rule "${ruleName}": ${e}`);
			}
		} else {
			// deregister this specific ruletry {
			try {
				await deregisterContentScriptByRuleName(ruleName);
			} catch (e) {
				log.e(`Failed to deregister content script for rule "${ruleName}": ${e}`);
			}
		}
	} // else do nothing. don't need to change.
}


/**
 * Activates the rules for a given {@param presetName}
 * 
 * Does custom handling if {@param presetName} is {@link CUSTOM_PRESET}
 */
async function activateRulesForPreset(presetName: string) {
	if (presetName === CUSTOM_PRESET) {
		await activateCustomPresetRules();
	} else {
		await activateNormalPresetRules(presetName);
	}
}
/**
 * Registers the rules for the custom preset
 * 
 * @remarks
 * According to the rules listed in {@link getAllCustomRuleStatuses}
 */
async function activateCustomPresetRules() {
	log.i("Activating custom preset rules...");
	return await registerContentScripts(await getAllCustomRuleStatuses());
}
/**
 * Registers the rules for the preset {@param presetName}
 * 
 * Assumes that this is a normal preset (i.e. not a custom preset)
 * 
 * @remarks
 * According to the rules listed in {@link presets}
 */
async function activateNormalPresetRules(presetName: string) {
	const presetRules: Record<string, boolean> | undefined = presets[presetName];
	if (presetRules === undefined) {
		// this means that nothing will change
		throw new Error(`Preset rules are not defined (preset is not valid).`);
	} else {
		log.i(`Activating preset "${presetName}" rules...`);
		await registerContentScripts(presetRules);
	}
}
/**
 * Registers content scripts if the rule is active in the passed {@param rules}.
 * 
 * {@link log}s on failure.
 * 
 * @param rules the rules to register
 */
async function registerContentScripts(rules: Record<string, boolean | null>): Promise<void[]> {
	/*for await (const [ruleName, isActive] of Object.entries(await getAllRuleStatuses())) {
		// ...
	}
	return;*/
	return await Promise.all(
		Object.entries(rules)
			// .map over .forEach to be async (https://stackoverflow.com/a/37576787/8804293)
			.map(async ([ruleName, isActive]) => {
				if (isActive) {
					try {
						await registerContentScriptByRuleName(ruleName);
						log.i(`Registered content script rule "${ruleName}"`);
					} catch (e) {
						throw new Error(`Failed to register content script for rule "${ruleName}": ${e}`);
					}
				} // else not active: don't register
			})
	);
}

/**
 * Deactivates the rules for a given {@param presetName}
 * 
 * Does custom handling if {@param presetName} is {@link CUSTOM_PRESET}
 */
async function deactivateRulesForPreset(presetName: string) {
	if (presetName === CUSTOM_PRESET) {
		await deactivateCustomPresetRules();
	} else {
		await deactivateNormalPresetRules(presetName);
	}
}
/**
 * Deregisters the rules for the custom preset
 * 
 * @remarks
 * According to the rules listed in {@link getAllCustomRuleStatuses}
 */
async function deactivateCustomPresetRules() {
	log.i("Deactivating custom preset rules...");
	return await deregisterContentScripts(await getAllCustomRuleStatuses());
}
/**
 * Deregisters the rules for the preset {@param presetName}
 * 
 * Assumes that this is a normal preset (i.e. not a custom preset)
 * 
 * @remarks
 * According to the rules listed in {@link presets}
 */
async function deactivateNormalPresetRules(presetName: string) {
	const presetRules: Record<string, boolean> | undefined = presets[presetName];
	if (presetRules === undefined) {
		// this means that nothing will change
		log.w(`Preset to deactivate "${presetName}" was not found (not valid)... unable to deregister content scripts (rules) properly.`);
		log.w(`Deregistering any and all content scripts found instead...`);
		// maybe should do this by default when changing presets
		await deregisterAllRuleContentScripts();
	} else {
		log.i(`Activating preset "${presetName}" rules...`);
		await deregisterContentScripts(presetRules);
	}
}



/**
 * Deregisters content scripts if the rule is active in the passed {@param rules}.
 * 
 * {@link log}s on failure.
 * 
 * @param rules the rules to register
 */
async function deregisterContentScripts(rules: Record<string, boolean | null>): Promise<void[]> {
	/*for await (const [ruleName, isActive] of Object.entries(await getAllRuleStatuses())) {
		// ...
	}
	return;*/
	return await Promise.all(
		Object.entries(rules)
			// .map over .forEach to be async (https://stackoverflow.com/a/37576787/8804293)
			.map(async ([ruleName, isActive]) => {
				// if was set to be active
				if (!isActive) {
					// there is something to deregister
					try {
						await deregisterContentScriptByRuleName(ruleName);
					} catch (e) {
						log.e(`Failed to deregister content script for rule "${ruleName}": ${e}`);
					}
				}
			})
	);
}

/**
 * Registers a content script based on the passed {@param ruleName}
 * 
 * @throws an {@link Error} if the rule does not exist
 */
async function registerContentScriptByRuleName(ruleName: string) {
	const rule = getRule(ruleName);
	if (rule === null) {
		throw new Error("Rule does not exist.");
	} else {
		return await registerContentScript(rule);
	}
}
/**
 * Registers the content script for a rule
 * according to its rules properties
 *
 * Automatically registers the content script in {@link contentScriptRegistrationRecords}
 */
async function registerContentScript(rule: ToggleableFeature) { //: Promise<RegisteredContentScript>
	try {
		const registration = await browser.scripting.registerContentScripts([{
			id: getRuleContentScriptId(rule.name),
			//allFrames: true,
			//css: { file: "/path", code: "body{color:blue;}"},
			matches: [rule.path],
			js: [`scripts/contentScripts/${changeExtension(rule.scriptPath, "js")}`],
			runAt: "document_end",
			//world: "MAIN",
		}]);
		// registration.unregister()
		contentScriptRegistrationRecords.set(rule.name, registration);
		//log.i(`Successfully registered content script "${rule.name}".`);
		return registration;
	} catch (e) {
		//log.crit(`Failed to register content script "${rule.name}": ${e}`);
		throw new Error(e.toString());
	}
}
/**
 * Returns the predicted ID of the content script
 * for the associated rule.
 * 
 * @remarks
 * For consistent naming in registration/deregistration.
 * Registerd rule names are not guarenteed.
 */
function getRuleContentScriptId(ruleName: string) {
	return `rule-${ruleName}`;
}

/**
 * Deregisters (deactivates) a content script
 *
 * @remarks
 * Typically used to remove a rule content script, but requires an {@param ruleId}
 * instead of a rule name.
 */
async function deregisterContentScript(ruleId: string): Promise<void> {
	return await browser.scripting.unregisterContentScripts({ ids: [ruleId] });
}
/**
 * Deregisters (deactivates) a content scripts
 * based on its {@param ruleName}
 * 
 * @throws an {@link Error} if not found
 */
async function deregisterContentScriptByRuleName(ruleName: string): Promise<void> {
	const registration = contentScriptRegistrationRecords.get(ruleName);
	if (registration === null) {
		// try deregistering with getRuleContentScriptId?
		throw new Error("Content Script registration not found.");
	}
	return await registration.unregister();
}
/**
 * Deregisters (deactivates) all recorded content scripts
 * for rules
 * 
 * @remarks
 * Based on the record of {@link contentScriptRegistrationRecords}.
 */
async function deregisterAllRuleContentScripts() {
	await Promise.all(
		Object.entries(contentScriptRegistrationRecords).map(async registration => {
			await registration.unregister();
		})
	);
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
