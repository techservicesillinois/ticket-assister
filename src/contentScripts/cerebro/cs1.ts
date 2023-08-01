// <rule name="Cerebro/flagger/Alert/Red">
import { DomParseError } from "utils/errors";
import { log } from "utils/logger";
import { getRedInfo, genListInfoEl } from "utils/webpage/foreground/cerebro";


const redInfo = (() => {
	try {
		return getRedInfo();
	} catch {
		log.i(`No user info found on screen. Not displaying red info.`);
		return [];
	}
})();

if (redInfo.length !== 0) {
	const alertBox = genListInfoEl(redInfo);
	alertBox.style.border = "4px double #bf0000";
	alertBox.style.backgroundColor = "#ffc7c7";
	alertBox.style.color = "#bf0000";

	const insertBeforeEl = document.querySelector("#groupsettings");
	if (insertBeforeEl === null || insertBeforeEl.parentElement === null) {
		throw new DomParseError();
	}
	insertBeforeEl?.parentElement?.insertBefore(alertBox, insertBeforeEl);
}
