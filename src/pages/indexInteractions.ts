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

// Macros
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

/**
 * Hides the macros dropdown el
 * 
 * Should only be called within the context of toggleDropdown to update all UI elements
 */
function hideMacrosDropdown() {
    if (macrosDropdownEl === null) {
        onScreenError("Failed to hide macros dropdown.");
        return;
    }
    // bruh the downcasts
    const macrosDropdownElUseMe = macrosDropdownEl as HTMLElement;
    macrosDropdownElUseMe.style.display = "none";
    // todo animate fade out
}
/**
 * Shows the macros dropdown el
 * 
 * Should only be called within the context of toggleDropdown to update all UI elements
 */
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
	/**
	 * The relative path to the macro script
	 */
    path: string,
}
/**
 * Generates a macro element for a list of macros
 * 
 * Wraps in an IIFE
 * @param macro the macro element
 * @returns the HTML element
 * 
 * @todo
 * ~~verify that Content Security Policy doesn't get angry~~
 * Import these (else filter) based on Options
 * Use file imports-- don't inject JS as text 🤡
 *
 * Make sure accessing proper `window` (might need to inject)
 */
function generateMacroEl(macro: Macro): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.classList.add("macro");
    const element = document.createElement("button");
    element.textContent = macro.name;
	// todo
	//import script from `${macro.path};
	//element.addEventListener("click", script);
    wrapper.appendChild(element);
    return wrapper;
}
(function initializeMacrosDopdown() {
    if (macrosDropdownEl === null) {
        onScreenError("Failed to show initialize macros dropdown.");
        return;
    }
    hideMacrosDropdown();

	// todo
    const macros: Array<Macro> = [
        {
            name: "Test",
            path: "../macros.ts",
        },
    ];

    const macroEls = macros.map(macro => generateMacroEl(macro));
    for (const macroEl of macroEls) {
        macrosDropdownEl.appendChild(macroEl);
    }
})();
