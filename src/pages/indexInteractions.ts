import { log } from "utils/logger";
import { injectScript } from "utils/windowScript";
import * as browser from "webextension-polyfill";
const onScreenErrorsWrapper = document.querySelector("#onscreen-errors-wrapper");

function onScreenError(message: string) {
    const errorEl = document.createElement("p");
    errorEl.textContent = message;
    if (onScreenErrorsWrapper !== null) {
        onScreenErrorsWrapper.appendChild(errorEl);
    } else {
        // i should have just non-null asserted
        document.body.appendChild(errorEl);
    }
}

// Feedback
const feedbackEl = document.querySelector("#feedback");
const FEEDBACK_LINK = "https://forms.gle/LRpER2t69MrTVqtD8";
if (feedbackEl === null) {
	onScreenError(`Failed to find feedback button. You can submit feedback directly at ${FEEDBACK_LINK}`);
} else {
	feedbackEl.addEventListener("click", () => {
		window.open(FEEDBACK_LINK, "_blank");
	});
}

// Help
const helpEl = document.querySelector("#help");
if (helpEl === null) {
    onScreenError("Failed to find help button.");
} else {
    helpEl.addEventListener("click", () => {
        window.open(browser.runtime.getURL("pages/trouble.html"));
    });
}

// Options
const optionsEl = document.querySelector("#options");
if (optionsEl === null) {
    onScreenError("Failed to find options button. You may need to right click the extension to access the options page instead.");
} else {
    optionsEl.addEventListener("click", () => {
        if (browser.runtime.openOptionsPage) {
            browser.runtime.openOptionsPage();
		} else {
            window.open(browser.runtime.getURL("pages/options.html"));
		}
    });
}

/*// Macros
enum ARROW_STATE {
    UP = 0,
    DOWN = 1,
}
function getArrow(arrowState: ARROW_STATE): string {
    if (arrowState === ARROW_STATE.DOWN) {
        // ACK
        // all for the sake of not using innerHTML
        return "\u25BC";
    }
    return "\u25B2";
}
let arrowState = ARROW_STATE.DOWN;
const macrosEl = document.querySelector("#macros");
const macrosDropdownEl = document.querySelector("#macros-dropdown");
if (macrosEl === null) {
    onScreenError("Failed to find macros button. Macros will not work. Try toggling the extension again.");
} else {
    macrosEl.addEventListener("click", evt => {
        evt.stopPropagation();
        toggleDropdown();
    });
}
function toggleDropdown() {
    // every once in a while, you wonder if booleans would just be easier
    //arrowState = (arrowState + 1) % 2;
    arrowState = arrowState === ARROW_STATE.UP ? ARROW_STATE.DOWN : ARROW_STATE.UP;
    // because I don't want to use a framework
    if (macrosEl === null) {
        onScreenError("Failed to update macros button UI.");
    } else {
        macrosEl.textContent = `Macros ${getArrow(arrowState)}`;
    }

    if (arrowState === ARROW_STATE.UP) {
        // open up
        showMacrosDropdown();
    } else {
        // fold down
        hideMacrosDropdown();
    }
}
document.addEventListener("click", () => {
    if (arrowState === ARROW_STATE.UP) {
        // macros dropdown visible
        toggleDropdown();
    }
})

|**
 * Hides the macros dropdown el
 * 
 * Should only be called within the context of toggleDropdown to update all UI elements
 *|
function hideMacrosDropdown() {
    if (macrosDropdownEl === null) {
        onScreenError("Failed to hide macros dropdown.");
        return;
    }
    // bruh the downcasts
    const macrosDropdownElUseMe = macrosDropdownEl as HTMLElement;
    macrosDropdownElUseMe.style.display = "none";
    // todo animate fade out
|**
 * Shows the macros dropdown el
 * 
 * Should only be called within the context of toggleDropdown to update all UI elements
 *|
function showMacrosDropdown() {
    if (macrosDropdownEl === null) {
        onScreenError("Failed to show macros dropdown.");
        return;
    }
    // bruh the downcasts
    const macrosDropdownElUseMe = macrosDropdownEl as HTMLElement;
    macrosDropdownElUseMe.style.display = "block";
    // todo animate fade in
}

interface Macro {
    name: string,
	|**
	 * The relative path to the macro script
	 * from `src/static/macros`
	 *
	 * File extension should be the output file, so `.js`
	 *|
    path: string,
	|**
	 * The URLs which the script is allowed to run on.
	 *
	 * Supports the `*` wildcard
	 *
	 * @internalRemarks
	 * Going to let macros be runnable anywhere
	 * and they can handle the current page logic themselves
	url: Array<string>,*|
}
|**
 * A list of macros available to the user
 * in the dropdown menu
 *|
const macros: Array<Macro> = [
	{
		name: "New Ticket",
		path: "newTicket.js",
	},
	{
		name: "Get NetIDs of Employees",
		path: "getNetIdsOfEmployees.js",
	},
	{
		name: "Get Timeclock Data",
		path: "getTimeclockData.js",
	},
];
|**
 * Generates a macro element for a list of macros
 * 
 * Wraps in an IIFE
 * @param macro the macro element
 * @returns the HTML element
 *|
async function generateMacroEl(macro: Macro): Promise<HTMLElement> {
    const wrapper = document.createElement("div");
    wrapper.classList.add("macro");
    const element = document.createElement("button");
    element.textContent = macro.name;
	wrapper.addEventListener("click", async () => {
		try {
            const currentTab = (await browser.tabs.query({ active: true, currentWindow: true }))[0]; //await browser.tabs.getCurrent();
            if (currentTab.id === undefined) {
                throw new Error("currentTab id is undefined");
            }
			await browser.scripting.executeScript({ files: [`macros/${macro.path}`], target: { tabId: currentTab.id } });
		} catch (e) {
			log.e(`Failed to run macro ${macro.name}: ${e.message}`);
		}
	});

    wrapper.appendChild(element);
    return wrapper;
}
(async function initializeMacrosDopdown() {
    if (macrosDropdownEl === null) {
        onScreenError("Failed to show initialize macros dropdown.");
        return;
    }
    hideMacrosDropdown();

    const macroEls = await Promise.all(macros.map(async macro => await generateMacroEl(macro)));
    for (const macroEl of macroEls) {
        macrosDropdownEl.appendChild(macroEl);
    }
})();*/
