// <rule name="Cerebro/flagger/Highlight/Yellow">
import { getYellowInfo, highlightInfo } from "utils/webpage/foreground/cerebro";
import { log } from "utils/logger";


const yellowInfo = (() => {
	try {
		return getYellowInfo();
	} catch {
		return null;
	}
})();
if (yellowInfo !== null) {
	highlightInfo(yellowInfo, "#f8f5c7");
} else {
	log.i(`No user info found on screen. Not displaying yellow info.`);
}
