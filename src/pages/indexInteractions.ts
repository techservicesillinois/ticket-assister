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
