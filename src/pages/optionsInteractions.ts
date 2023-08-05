// see https://developer.chrome.com/docs/extensions/reference/storage/
import presets, { CUSTOM_PRESET, DEFAULT_PRESET } from "../rules/presets";
import { updateCustomRuleStatus, getAllCustomRuleStatuses, getCurrentPreset, setCurrentPreset, getCustomRuleStatus, updateCustomRuleStatusMultiple } from "utils/rules/storage";
import { log } from "utils/logger";
import rules from "../rules/rules";
import { squishArray } from "utils/stringParser";
import { downloadLogFileButton } from "./downloadLogFile";


// Presets
// non null assertion is cleared below
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const presetsEl = <HTMLSelectElement>document.querySelector("select#presets")!;
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const optionsElMaybe = document.querySelector("div#options-wrapper")!;
if (presetsEl === null || optionsElMaybe === null || !(optionsElMaybe instanceof HTMLElement)) {
	throw new Error("Page failed to load.");
}
// WE LOVE YOU TYPESCRIPT
const optionsEl = <HTMLElement>optionsElMaybe;
// non null assertion is cleared below
// and so is forced cast
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const noticeEl = <HTMLElement>document.querySelector("#think-tank")!;
if (noticeEl === null || !(noticeEl instanceof HTMLElement)) {
	// sad
	log.e("Failed to get noticeEl: Updates will not be shown.");
}
let noticeFadeTimeout: NodeJS.Timeout | null = null;
let noticeFadeTimeoutInner: NodeJS.Timeout | null = null;
/**
 * Displays a message in the notice box,
 * fading after {@param fadeAfterMs} if specified
 * else staying put.
 *
 * Will be changed with the next call to setNotice.
 *
 * @todo improve animation
 * slide down old message and slide up new if overriding
 */
function setNotice(message: string, fadeAfterMs?: number, isError = false) {
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
			clearTimeout(noticeFadeTimeoutInner);
		}
		if (isError) {
			noticeEl.style.color = "#a90000";
		} else {
			noticeEl.style.color = "#000";
		}
		noticeEl.textContent = message;
		if (fadeAfterMs !== undefined) {
			log.d(`Setting fade timeout for noticeEl for ${fadeAfterMs}`);
			noticeFadeTimeout = setTimeout(() => {
				log.d(`Fading noticeEl`);
				noticeEl.classList.add("fade"); // 1000ms fade
				noticeFadeTimeoutInner = setTimeout(() => {
					// hold position: don't clear out textContent
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
	if (evt.currentTarget === null) {
		// this is false
		return;
	}
	// evt.currentTarget is presetsEl anyways
	const presetName = presetsEl.value;
	if (presetName === null) {
		return;
	}
	
	// store this as the most recent preset
	// and do want to set the options
	await setPresetTo(presetName, true);

	setNotice("Updated preset", 1000);
});

/**
 * Sets the current preset to {@param presetName}
 * both visually in the foreground
 * and actually in the background (storageArea)
 * 
 * Will update the options list visually
 * if {@param updateOptions} === true
 * 
 * @remarks
 * storage listener in service worker will update the content scripts
 */
async function setPresetTo(presetName: string, updateOptions = true) {
	await setCurrentPreset(presetName);
	// now that it is done:
	presetsEl.value = presetName;

	if (updateOptions) {
		// load rule settings
		await refreshOptionValues(presetName);
	}
}
/**
 * Visually updates the option values
 * to be the stored preset values
 */
async function refreshOptionValues(presetName: string) {
	if (presetName !== CUSTOM_PRESET) {
		log.d(`Refreshing the options to match the new preset "${presetName}"`);
		setOptionValues(presets[presetName]);
	} else {
		log.d(`Refreshing the options to match the new custom preset`);
		// show custom preset options
		setOptionValues(await getAllCustomRuleStatuses());
	}
}

// todo future option to save new presets

// Options
const optionEls = new Map<string, HTMLInputElement>();
const optionHeadingEls = new Map<string, HTMLElement>();
/**
 * Creates a checkbox option
 * 
 * Labels it with the innermost past
 * (part after the final /)
 */
function createCheckboxOption(addToEl: HTMLElement, options: { fullName: string, initialValue?: boolean, details?: string, url?: string, callback: (isChecked: boolean) => Promise<void> }) {
	const label = options.fullName.substring(options.fullName.lastIndexOf("/") + 1); // even works if index === -1 !
	const wrapperEl = document.createElement("div");
	const labelEl = document.createElement("label");
	const inputEl = document.createElement("input");
	inputEl.type = "checkbox";
	inputEl.name = label;
	labelEl.setAttribute("name", label);
	inputEl.checked = options.initialValue ?? false;
	if (options.callback !== undefined) {
		inputEl.addEventListener("input", async () => {
			await options.callback(inputEl.checked);
		});
	}
	const textEl = document.createTextNode(label);
	labelEl.appendChild(inputEl);
	labelEl.appendChild(textEl);

	wrapperEl.appendChild(labelEl);
	if (options.details !== undefined) {
		const detailsEl = document.createElement("p");
		detailsEl.textContent = options.details;
		//detailsEl.innerHTML = options.details.replace(/\n/g, "<br />");
		detailsEl.classList.add("details");
		wrapperEl.appendChild(detailsEl);
	}
	if (options.url !== undefined) {
		const runsOnEl = document.createElement("p");
		runsOnEl.textContent = `Runs on ${options.url}`;
		runsOnEl.classList.add("runs-on");
		wrapperEl.appendChild(runsOnEl);
	}

	wrapperEl.classList.add("option-wrapper");
	// not null because it would have thrown
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	addToEl.appendChild(wrapperEl);
	optionEls.set(options.fullName, inputEl);
}
/**
 * Creates an option tree
 * from an array of tuples
 * 
 * Meant to be created based on a preset's entries
 */
function createOptionTree(options: Array<[string, boolean]>) {
	options.forEach(([fullRuleName, value]) => {
		const associatedRule = rules.find(rule => rule.name === fullRuleName);
		if (associatedRule === undefined) {
			throw new Error(`Tried to create rule ${fullRuleName} which does not exist! Canceling!`);
		}
		// create a nice option tree
		const segments = fullRuleName.split("/");
		let lastLevelEl = optionsEl;
		for (let i = 0; i < segments.length - 1; i++) {
			const currSegment = segments[i];
			let currLevelEl = optionHeadingEls.get(currSegment);
			if (currLevelEl === undefined) {
				currLevelEl = document.createElement("div");
				const sectionEl = document.createElement("div");
				sectionEl.textContent = currSegment;
				sectionEl.classList.add("section-title");
				currLevelEl.appendChild(sectionEl);
				currLevelEl.classList.add("branch");
				currLevelEl.classList.add(`lvl-${i}`);
				if (i > 4) {
					log.w("Tree is more than 4 levels deep, so we don't have perfect styling for it.");
				}

				// todo add uncheck all click listener
				lastLevelEl.appendChild(currLevelEl);
				optionHeadingEls.set(currSegment, currLevelEl);
			}
			lastLevelEl = currLevelEl;
		}
		// find details from rule and pass to createCheckboxOption
		createCheckboxOption(lastLevelEl, { fullName: fullRuleName, details: associatedRule.description, url: squishArray(associatedRule.contentScripts.map(cs => cs.url)), initialValue: value, callback: async newValue => {
			log.d(`Rule ${fullRuleName} was updated to ${newValue}`);
			// update in storage
			try {
				// the preset currently displayed on screen
				const previousPreset = await getCurrentPreset() ?? DEFAULT_PRESET;
				if (previousPreset === CUSTOM_PRESET) { // or could visually check on screen
					await updateCustomRuleStatus(fullRuleName, newValue);
					setNotice("Saved option", 1000);
				} else {
					// do not visually update... we are about to save
					// could instead visually update (`await setPresetTo(CUSTOM_PRESET, true);`)
					// after saving all custom option values
					await setPresetTo(CUSTOM_PRESET, false);
					// note: an alternative (and maybe better way) to do this
					// would be to pull all the current data on screen
					// and use that.
					// This would also help against race conditions
					// (e.g. clicking two boxes quickly before the save finishes)
					const optionsToSave = presets[previousPreset];
					optionsToSave[fullRuleName] = newValue; // should be the opposite
					updateCustomRuleStatusMultiple(optionsToSave);
					setNotice("Switched preset & saved option", 1000);
				}
				// else should be up to date: don't need to update
			} catch (e) {
				log.crit(`Failed to update option: ${e instanceof Error ? e.message : "(unknown)"}`);
				setNotice("Failed to save option", 3000, true);
				// todo revert their click (set el back to its previous state)
				// and make the log an `e` instead
			}
		}});
	});
}
// "All Off" should have all the options to tree from
createOptionTree(Object.entries(presets["All Off"]));

/**
 * Loads the saved options onto the page,
 * visually updating the rule checkboxes and preset value
 */
async function loadAllSavedOptions() {
	// load preset setting
	const currentPreset = await getCurrentPreset() ?? DEFAULT_PRESET;
	await refreshOptionValues(currentPreset);
	log.d(`Setting preset el value to the current preset ${currentPreset}`);
	presetsEl.value = currentPreset;
}

function setOptionValues(rules: Record<string, boolean | null>) {
	for (const [key, value] of Object.entries(rules)) {
		const associatedOptionEl = optionEls.get(key);
		if (associatedOptionEl === undefined) {
			throw new Error(`No optionEl for option ${key}`);
		}
		if (value !== null) {
			associatedOptionEl.checked = value;
		} else {
			// this should only happend on a custom preset with a bad pull
			// default: set to false
			log.w(`Could not find an value for the key ${key} when trying to visually set the option values. Defaulting to false`);
			//associatedOptionEl.checked = false; // default is already false
		}
	}
	// if mismatch of more optionEls than listed... oh well
}

document.addEventListener("DOMContentLoaded", loadAllSavedOptions);

document.body.appendChild(downloadLogFileButton());

window.onerror = err => {
	if (err instanceof Error) {
		log.e(`Uncaught error: ${err.message}`);
	}
};