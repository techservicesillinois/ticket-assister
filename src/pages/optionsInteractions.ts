// see https://developer.chrome.com/docs/extensions/reference/storage/
import presets, { CUSTOM_PRESET, DEFAULT_PRESET } from "../rules/presets";
import { updateCustomRuleStatus, getAllCustomRuleStatuses, getCurrentPreset, setCurrentPreset, getCustomRuleStatus, updateCustomRuleStatusMultiple, setCurrentPrefill } from "utils/rules/storage";
import { log } from "utils/logger";
import rules from "../rules/rules";
import { squishArray, escapeRegExp, escapeHtml } from "utils/stringParser";
import { downloadLogFileButton } from "./downloadLogFile";
import { getCustomPrefillOrDefault, PERMITTED_BRACE_VARIABLES } from "utils/rules/prefill";


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
const additionalOptionsEl = document.querySelector("#additional-options-wrapper");
if (additionalOptionsEl === null || !(additionalOptionsEl instanceof HTMLElement)) {
	log.e("Failed to get additionalOptionsEl: Additional options will not be shown.");
}
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

/**
 * Adds additional options,
 * which are non-rule options,
 * to its associated element
 */
function populateAdditionalOptionsEl() {
	additionalOptionsEl?.appendChild(generateCustomPrefillInput());
}
/**
 * Generates an element for updating the custom prefill
 */
function generateCustomPrefillInput() {
	const el = document.createElement("div");
	const label = document.createElement("p");
	const body = document.createElement("div");
	const textareaHighlights = document.createElement("div");
	textareaHighlights.classList.add("textarea-support");
	const textareaHighlightsChild = document.createElement("div");
	textareaHighlights.appendChild(textareaHighlightsChild);
	const info = document.createElement("p");
	const input = document.createElement("textarea");
	input.rows = 10;
	body.appendChild(info);
	body.appendChild(textareaHighlights);
	body.appendChild(input);
	
	label.textContent = "Custom Prefill Response";
	const infoP1 = document.createElement("p");
	infoP1.textContent = "When \"TDX/Ticket/Update/Prefill response\" is turned on, the response in the box below will be used as the default response to a ticket. It will automatically be populated when you open an Edit screen.";
	const infoP2 = document.createElement("p");
	infoP2.textContent = "A select set of brace-variables are permitted to be entered in the space below and will be replaced with the following associations:";
	const assocs = document.createElement("ul");
	// ok I'm done interfacing with vanilla JS DOM
	assocs.innerHTML = `
		<li><code>{client.name.first}</code>, <code>{client.name.last}</code>, <code>{client.name.full}</code> - The client's listed name</li>
		<li><code>{self.name.first}</code>, <code>{self.name.last}</code>, <code>{self.name.full}</code> - The logged in user's listed name, i.e., your name</li>
		<li><code>{ticket.number}</code> - The ticket number of the current ticket</li>
	`;
	const resetButton = document.createElement("button");
	resetButton.textContent = "Reset to default";
	resetButton.addEventListener("click", resetInput);
	body.appendChild(resetButton);
	const infoP3 = document.createElement("p");
	infoP3.textContent = "Note: Any non-recognized brace-variables will be preserved.";
	const infoP4 = document.createElement("p");
	infoP4.textContent = "Note: Formatting text is currently not supported.";
	info.appendChild(infoP1); info.appendChild(infoP2); info.appendChild(assocs); info.appendChild(infoP3); info.appendChild(infoP4); info.appendChild(resetButton);
	
	// set loading until we insertCurrentPrefillRaw
	input.value = "loading current prefill...";
	input.disabled = true;

	/**
	 * Highlights {@link textareaHighlightsChild}
	 * according to {@link input}'s current value,
	 * highlighting any string matches in the array PERMITTED_BRACE_VARIABLES
	 */
	function applyHighlights(PERMITTED_BRACE_VARIABLES: string[]) {
		// need to escape HTML because we are going to inject this into innerHTML
		// after some modifications
		const text = escapeHtml(input.value);
		let highlighedText = text
			//.replace(/\n$/g, "\n\n") // end of line shift
			;
		// go through ecah of the strings that we want to highlight
		for (const highlightString of PERMITTED_BRACE_VARIABLES) {
			// indicate that it should be highlighted in textareaHighlightsChild
			// so that the CSS can do its work
			highlighedText = highlighedText.replace(new RegExp(escapeRegExp(highlightString), "g"), "<mark>$&</mark>");
		}
		textareaHighlightsChild.innerHTML = highlighedText;
	}
	/**
	 * Matches the highlight el's scroll
	 * with {@link input}'s scroll.
	 *
	 * To be triggered on textarea scroll.
	 */
	function correctHelperScroll() {
		textareaHighlights.scrollTop = input.scrollTop;
		textareaHighlights.scrollLeft = input.scrollLeft;
	}
	input.style.border = "2px solid #000";
	/**
	 * Visually displays that the input was saved
	 */
	function visuallySetSaveDone() {
		input.style.borderColor = "#00cd92";
	}
	/**
	 * Visually displays that the input is not yet saved
	 */
	function visuallySetSaveStale() {
		input.style.borderColor = "#0099cd";
	}
	/**
	 * Visually displays that the input failed to saved
	 */
	function visuallySetSaveFail() {
		input.style.borderColor = "#cd0000";
	}

	insertCurrentPrefillRaw(input)
		.then(() => {
			log.d(`Current prefill data inserted.`);
			applyHighlights(PERMITTED_BRACE_VARIABLES);
			// add listeners for updates
			// note that these listeners are set *after* the initial population
			// so no extra calls will be hit
			let timeout: number | undefined = undefined;
			input.addEventListener("input", () => {
				visuallySetSaveStale();
				// update highlights to show what has been detected as a brace variable
				// Cannot directly highlight textarea (https://codersblock.com/blog/highlight-text-inside-a-textarea/)
				applyHighlights(PERMITTED_BRACE_VARIABLES);
				// save after 500ms delay to account for slow typers
				// explicitly say "window" to avoid TypeScript getting confused (https://stackoverflow.com/a/56239226/8804293)
				window.clearTimeout(timeout);
				timeout = window.setTimeout(saveInput, 500);
			});
			input.addEventListener("scroll", () => {
				correctHelperScroll();
			});
			window.addEventListener("beforeunload", saveInput);
		});
	
	/**
	 * Saves the current prefill input,
	 * escaping it along the way
	 */
	async function saveInput() {
		const textToSave = input.value;
		// 1. Strip all shenanigans
		const virtualDom = new DOMParser().parseFromString(textToSave, "text/html");
		const safeText = virtualDom.body.textContent || "";
		// 2. Convert \n to <br />
		const convertedText = safeText.replaceAll("\n", "<br />");
		// 3. Save
		try {
			await setCurrentPrefill(convertedText);
			// 4. Update visual status for user
			visuallySetSaveDone();
		} catch (e) {
			log.e(`Failed to save current prefill: ${e instanceof Error ? e.message : e}`);
			visuallySetSaveFail();
		}
	}
	/**
	 * Resets the input to the default value
	 *
	 * @remarks
	 * This sets the current input to the default value
	 * and then saves it.
	 *
	 * It does not unset the value in the cloud storage
	 * but rather sets it explicitly to the default value.
	 * This has the trade-off of "default users" no longer getting the latest updated prefill response
	 * but it makes this slightly easier as we don't need to write an API to unsetCurrentPrefill.
	 *
	 * It is to be debated whether the current prefill should be saved for every user
	 * (stability across versions-- e.g., one day your prefill doesn't suddenly have different wording)
	 * or unset unless explicitly set
	 * (potentially beneficial updates across versions-- e.g., one day your prefill has better formatting).
	 */
	async function resetInput() {
		//await setCurrentPrefill(DEFAULT_PREFILL);
		input.value = DEFAULT_PREFILL;
		visuallySetSaveStale();
		saveInput();
	}

	el.appendChild(label);
	el.appendChild(body);
	return el;
}

/**
 * Displays the current prefill in the textarea,
 * which is either stored in cloud storage
 * or is the default.
 */
async function insertCurrentPrefillRaw(inputEl: HTMLTextAreaElement) {
	const prefillHTML = await getCustomPrefillOrDefault();
	// replace linebreaks (<br /> -> \n)
	inputEl.value = prefillHTML.replace(/<br\s*\/?>/g, "\n");
	// ok now to modify
	inputEl.disabled = false;
}

document.addEventListener("DOMContentLoaded", loadAllSavedOptions);

populateAdditionalOptionsEl();

document.body.appendChild(downloadLogFileButton());

window.onerror = err => {
	if (err instanceof Error) {
		log.e(`Uncaught error: ${err.message}`);
	}
};