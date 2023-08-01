// <rule name="Cerebro/flagger/Show count">
import { generateFlagSummaryEl, getRedInfo, getYellowInfo } from "utils/webpage/foreground/cerebro";
import { log } from "utils/logger";


const redInfo = (() => {
	try {
		return getRedInfo();
	} catch {
		return null;
	}
})();
const yellowInfo = (() => {
	try {
		return getYellowInfo();
	} catch {
		return null;
	}
})();
const flagSummaryEl = generateFlagSummaryEl(redInfo, yellowInfo);
const insertBefore = document.querySelector("#userinformation");
if (insertBefore !== null && insertBefore.parentElement !== null) {
	flagSummaryEl.style.float = "right";
	insertBefore.parentElement.insertBefore(flagSummaryEl, insertBefore);
} else {
	// fallback
	log.w("Failed to find the insert before el. Using fallback.");
	flagSummaryEl.style.position = "absolute";
	flagSummaryEl.style.top = "2em";
	flagSummaryEl.style.right = "2em";
	document.body.appendChild(flagSummaryEl);
}
