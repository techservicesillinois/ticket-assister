import * as browser from "webextension-polyfill";

import { log } from "utils/logger";
import { getRule } from "../../rules/rules";
import presets, { CUSTOM_PRESET, DEFAULT_PRESET } from "../../rules/presets";
import { customPresetRulePrefix, getAllCustomRuleStatuses, getCurrentPreset } from "utils/rules/storage";
import type { ToggleableFeature } from "utils/rules/types";
import { setCurrentPreset } from "utils/rules/storage";
import { changeExtension, stringBeginsWith } from "utils/stringParser";
import { BASE_URL } from "config";


export default function () {

/*browser.runtime.onUpdateAvailable(() => {
    // apply update
    browser.runtime.reload();
});*/ // wait for browser restart


//self.addEventListener("install", () => {
browser.runtime.onInstalled.addListener(async () => { // async (id, previousVersion, reason, temporary)
	// (id: string?, previousVersion: string?, reason: runtime.OnInstalledReason, temporary: boolean)
	log.i("Service worker installed.");
	log.d(`We are working with BASE_URL ${BASE_URL}`);
	
	// we would deregister all content scripts here
	// but there shouldn't be any since this is a fresh install
	//if (browser.scripting.getRegisteredContentScripts().length > 0) await browser.scripting.unregisterContentScripts();
	
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
		log.d(`The sync storageArea was updated.`);
		for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
			log.d(`Processing change: ${key}: ${oldValue} -> ${newValue}`);
			if (oldValue !== newValue) {
				log.d(`storageArea: diff detected`);
				// add & remove content scripts
				// todo send message to optionsInteractions.js and display that to the user (i.e. rollback if not successful)
				if (key === "currentPreset") {
					log.d(`> Current preset was changed.`);
					// todo verify oldValue and newValue types before passing
					handlePresetChange(oldValue, newValue);
				} else if (stringBeginsWith(key, customPresetRulePrefix)) {
					log.d(`> Custom preset rule was changed.`);
					// todo verify oldValue and newValue types before passing
					handleRuleChange(key.substring(customPresetRulePrefix.length), newValue);
				} else {
					log.d(`> Unknown key was changed (no-op): ${key}`);
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
 * 
 * Assumes that oldRuleValue !== newRuleValue
 * because that would be inefficient
 */
async function handleRuleChange(ruleName: string, newRuleValue: boolean) {
	const currentPreset = await getCurrentPreset();
	if (currentPreset === CUSTOM_PRESET) {
		if (newRuleValue) {
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
	} else {
		// do nothing. don't need to change.
		log.d(`Not changing content script registry as the current preset is not the custom preset.`);
	}
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
						//throw new Error(`Failed to register content script for rule "${ruleName}": ${e}`);
						// throwing here would cause the remaining promises to fail
						log.crit(`Failed to register content script for rule "${ruleName}": ${e}`);
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
		log.i(`Deactivating preset "${presetName}" rules...`);
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
				if (isActive) {
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
 */
async function registerContentScript(rule: ToggleableFeature) { //: Promise<RegisteredContentScript>
	//try {
		const getContentScriptRegistration = (matchesUrl: string, scriptPath: string) => ({
			id: getRuleContentScriptId(rule.name, scriptPath),
			//allFrames: true,
			//css: { file: "/path", code: "body{color:blue;}"},
			matches: [matchesUrl],
			js: [`scripts/contentScripts/${changeExtension(scriptPath, "js")}`],
			runAt: <browser.ExtensionTypes.RunAt>"document_end",
			//world: "MAIN",
		});
		const contentScriptRegistrations = [];
		for (const contentScript of rule.contentScripts) {
			contentScriptRegistrations.push(getContentScriptRegistration(contentScript.url, contentScript.script));
		}
		await browser.scripting.registerContentScripts(contentScriptRegistrations);
		log.i(`Registered ${contentScriptRegistrations.length} content script${contentScriptRegistrations.length === 1 ? "" : "s"} for rule ${rule.name}`);
	//} catch (e) {
		//log.crit(`Failed to register content script "${rule.name}": ${e}`);
		//throw; // throw it
	//}
}
/**
 * Returns the predicted ID of the content script
 * for the associated rule.
 * 
 * @remarks
 * For consistent naming in registration/deregistration.
 * Registerd rule names are not guarenteed.
 */
function getRuleContentScriptId(ruleName: string, contentScriptPath: string) {
	return `rule-${ruleName}-${contentScriptPath}`;
}

/**
 * Deregisters (deactivates) a content scripts
 * based on its {@param ruleName}
 * 
 * @throws an {@link Error} if not found
 */
async function deregisterContentScriptByRuleName(ruleName: string): Promise<void> {
	const rule = getRule(ruleName);
	if (rule === null) {
		throw new Error("Rule not found");
	}
	const ids: Array<string> = [];
	for (const contentScript of rule.contentScripts) {
		ids.push(getRuleContentScriptId(rule.name, contentScript.script));
	}
	await browser.scripting.unregisterContentScripts({ ids });
	log.i(`Unregistered ${ids.length} content script${ids.length === 1 ? "" : "s"} for rule ${rule.name}`);
}
/**
 * Deregisters (deactivates) all recorded content scripts
 * for rules
 * 
 * @remarks
 * Includes all dynamically registered content scripts,
 * which may include more than just rules.
 */
async function deregisterAllRuleContentScripts() {
	return await browser.scripting.unregisterContentScripts();
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

}