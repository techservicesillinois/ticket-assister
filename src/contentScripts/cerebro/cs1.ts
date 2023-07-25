// <rule name="Cerebro/flagger/Alert/Red">
import { DomParseError } from "utils/errors";
import { getRedInfo } from "utils/webpage/foreground/cerebro";

(() => {
	const redInfo = getRedInfo();
	if (redInfo.length === 0) {
		return; // and everyone is happy
	}
	const alertBox = document.createElement("ul");
	alertBox.style.border = "4px double #bf0000";
	alertBox.style.backgroundColor = "#ffc7c7";
	alertBox.style.color = "#bf0000";
	redInfo.forEach(datum => {
		const alertBullet = document.createElement("li");
		alertBullet.textContent = `${datum.note} - ${datum.location}`;
		alertBox.appendChild(alertBullet);
	});

	const insertBeforeEl = document.querySelector("#groupsettings");
	if (insertBeforeEl === null || insertBeforeEl.parentElement === null) {
		throw new DomParseError();
	}
	insertBeforeEl?.parentElement?.insertBefore(alertBox, insertBeforeEl);
})();