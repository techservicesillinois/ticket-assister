// <rule name="Cerebro/flagger/Highlight/Red">
import { getRedInfo, highlightInfo } from "utils/webpage/foreground/cerebro";
import { log } from "utils/logger";


const redInfo = (() => {
	try {
		return getRedInfo();
	} catch {
		return null;
	}
})();
if (redInfo !== null) {
	highlightInfo(redInfo, "#f8c7c7");
} else {
	log.i(`No user info found on screen. Not displaying red info.`);
}
