// todo
// see https://developer.chrome.com/docs/extensions/reference/storage/
import presets from "../rules/presets";
import { storageArea, updateCustomRuleStatus, updateCustomRuleStatusMultiple, getCustomRuleStatus, getCustomRuleStatusMultiple } from "utils/rules/storage";
import { log } from "utils/logger";
import rules from "../rules/rules";


// Presets
const presetsEl = document.querySelector("select#presets");
const optionsEl = document.querySelector("div#options-wrapper");
if (presetsEl === null || optionsEl === null || !(optionsEl instanceof HTMLElement)) {
	throw new Error("Page failed to load.");
}
const noticeEl = document.querySelector("#think-tank");
if (noticeEl === null || !(noticeEl instanceof HTMLElement)) {
	// sad
	log.e("Failed to get noticeEl: Updates will not be shown.");
}
let noticeFadeTimeout = null;
let noticeFadeTimeoutInner = null;
/**
 * Displays a message in the notice box,
 * fading after {@param fadeAfterMs} if specified
 * else staying put.
 *
 * Will be changed with the next call to setNotice.
 */
function setNotice(message: string, fadeAfterMs?: number) {
	log.i(`Setting notice to "${message}".`);
	if (noticeEl === null) {
		log.e(`Could not set noticeEl because it is null. Was going to set to "${message}".`);
	} else {
		if (noticeFadeTimeout !== null) {
			log.d(`Clearing old notice timeout`);
			clearTimeout(noticeFadeTimeout);
		}
		if (noticeFadeTimeoutInner !== null) {
			log.d(`Clearing old notice timeout inner`);
			clearTimeout(noticeFadeTimeout);
		}
		noticeEl.textContent = message;
		if (fadeAfterMs !== undefined) {
			log.d(`Setting fade timeout for noticeEl for ${fadeAfterMs}`);
			noticeFadeTimeout = setTimeout(() => {
				log.d(`Fading noticeEl`);
				noticeEl.classList.add("fade"); // 1000ms fade
				noticeFadeTimeoutInner = setTimeout(() => {
					noticeEl.textContent = "";
					noticeEl.classList.remove("fade");
				}, 1000);
			}, fadeAfterMs);
		}
	}
}

for (const presetName of Object.keys(presets)) {
	const option = document.createElement("option");
	option.textContent = presetName;
	presetsEl.appendChild(option);
}
presetsEl.addEventListener("input", async evt => {
	const presetName = evt.target?.value;
	if (presetName === null) {
		return;
	}
	// work with me
	// todo fix this
	const optionsToLoad: Record<string, boolean> | undefined = presets[presetName];
	if (optionsToLoad === undefined) {
		// something wrong with select
		log.e("Failed to update preset.");
		return;
	}
	// update preset values in storage
	setNotice("Updating...", 1000);
	await updateCustomRuleStatusMultiple(optionsToLoad);
	// update preset values on page
	Object.entries(optionsToLoad).forEach(([ruleName, isOn]) => {
		optionEls.get(ruleName).checked = isOn;
	});
	setNotice("Updated", 1000);
	
	// store this as the most recent preset
	setCurrentPreset(presetName);
	// storage listener in service worker will update the content scripts
});

// todo future option to save new presets

// Options
const optionEls = new Map<string, HTMLInputElement>();
const optionHeadingEls = new Map<string, HTMLElement>();
/**
 * Creates a checkbox option
 */
function createCheckboxOption(addToEl: HTMLElement, options: { label: string, initialValue?: boolean, details?: string, url?: string, callback?: (isChecked: boolean) => void }) {
	const wrapperEl = document.createElement("div");
	const labelEl = document.createElement("label");
	const inputEl = document.createElement("input");
	inputEl.type = "checkbox";
	inputEl.name = options.label;
	labelEl.setAttribute("name", options.label);
	inputEl.checked = options.initialValue ?? false;
	if (options.callback !== undefined) {
		inputEl.addEventListener("input", () => {
			// options.callback will be defined thank you very much
			// or could put `options.callback?.(inputEl.checked);`
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			options.callback!(inputEl.checked);
		});
	}
	const textEl = document.createTextNode(options.label);
	labelEl.appendChild(inputEl);
	labelEl.appendChild(textEl);

	wrapperEl.appendChild(labelEl);
	if (details !== undefined) {
		const detailsEl = document.createElement("p");
		detailsEl.textContent = details;
		detailsEl.classList.add("details");
		wrapperEl.appendChild(detailsEl);
	}
	if (url !== undefined) {
		const runsOnEl = document.createElement("p");
		runsOnEl.textContent = `Runs on ${url}`;
		runsOnEl.classList.add("runs-on");
		wrapperEl.appendChild(runsOnEl);
	}

	wrapperEl.classList.add("option-wrapper");
	// not null because it would have thrown
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	addToEl.appendChild(wrapperEl);
	optionEls.set(options.label, inputEl);
}
function createOptionTree(options: Array<string, boolean>) {
	options.forEach(([fullRuleName, value]) => {
		// create a nice option tree
		const segments = fullRuleName.split("/");
		let lastLevelEl = optionsEl;
		for (let i = 0; i < segments.length - 1; i++) {
			const currSegment = segments[i];
			let currLevelEl = optionHeadingEls.get(currSegment);
			if (currLevelEl === null) {
				currLevelEl = document.createElement("div");
				currLevelEl.textContent = currSegment;
				currLevelEl.classList.add("branch");
				// todo add uncheck all click listener
				lastLevelEl.appendChild(currLevelEl);
			}
			lastLevelEl = currLevelEl;
		}
		const ruleName = segments[segments.length - 1];
		// find details from rule and pass to createCheckboxOption
		const associatedRule = rules.find(rule => rule.name === fullRuleName);
		// todo next null checks
		createCheckboxOption(lastLevelEl, { label: ruleName, details: associatedRule.details, url: associatedRule.path, initialValue: value, callback: newValue => {
			// update in storage
			updateCustomRuleStatus(fullRuleName, newValue);
			// bubble errors
			
			// todo auto set to CUSTOM_PRESET preset on change options
			// and save the Custom preset to storage
		}});
	});
}
createOptionTree(Object.entries(presets["All Off"]));

/**
 * Loads the saved options onto the page,
 * visually updating the rule checkboxes and preset value
 */
async function loadAllSavedOptions() {
	throw new Error("Not implemented");
	// Object.keys(presets["All Off"]) should always exist and have everything listed
	const rules = await getAllRuleStatuses();
	for (const [key, value] of Object.entries(rules)) {
		const associatedOptionEl = optionEls.get(key);
		if (associatedOptionEl === null) {
			throw new Error(`No optionEl for option ${key}`);
		}
		if (value !== null) {
			associatedOptionEl.checked = value;
		} else {
			// default: use preset ?
			// todo
			//associatedOptionEl.checked = false;
		}
	}
	// if mismatch of more optionEls... oh well
}

document.addEventListener("DOMContentLoaded", loadAllSavedOptions);
