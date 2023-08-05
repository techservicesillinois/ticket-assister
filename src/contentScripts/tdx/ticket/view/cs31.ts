// <rule name="TDX/Ticket/View/Get Cerebro data">
// note that this script runs in the TDX ticket
import { CEREBRO_URL } from "config";
import { log } from "utils/logger";
import { getClientNetID, addCerebroInfo, setCerebroInfoLoading, setCerebroInfoError, listenForMessages, setCerebroInfoIdle } from "utils/webpage/foreground/tdx/ticketView";
import { PIPELINE_CEREBRO_TO_TICKET, receiveMessages } from "utils/webpage/link/interface";
import { sendMessageToCerebro } from "utils/webpage/link/ticket";

// todo: clean up this slop

const netIdToGet = getClientNetID();
try {
	if (netIdToGet === null) {
		setCerebroInfoIdle();
	} else {
		setCerebroInfoLoading();
		// try to get stuff
		const TRIES_MAX = 10;
		const TRY_INTERVAL_MS = 1000;
		let tryTimeout = null;
		// for a total of TRIES_MAX*TRY_INTERVAL_MS ms of waiting
		const tryToGet = (() => {
			let tries = 0;
			return async function() {
				const response = await sendMessageToCerebro({
					status: "get",
					search: netIdToGet,
				});
				const tryAgain = () => {
					if (tries++ < TRIES_MAX) {
						// recurse
						tryTimeout = setTimeout(tryToGet, TRY_INTERVAL_MS);
					} else {
						log.e(`Timed out: Did not get a response from Cerebro in ${tries*TRY_INTERVAL_MS/1000}s`);
						setCerebroInfoError();
					}
				};
				//console.log("%cLook!%c A message 💌:", "color: #cccc00", "", response);
				if (response) {
					const doMore = onResponse(response);
					if (doMore) {
						tries = 0;
						tryAgain();
					} else {
						if (tryTimeout) {
							clearTimeout(tryTimeout);
						}
					}
				} else {
					tryAgain();
				}
			};
		})();
		// start recursive pinging
		tryToGet();

		//listenForMessages(onInfo);
		//receiveMessages(PIPELINE_CEREBRO_TO_TICKET, async message => onResponse(message));
	}
} catch (e) {
	log.e(`Cerebro connection error (ticket-side): ${e instanceof Error ? e.message : e}`);
}

let openingCerebro = false;

/**
 * Runs when a response is received from Cerebro
 * 
 * @returns true if more info is expected
 */
export function onResponse(response: Object): boolean {
	if (response === undefined) {
		return true;
	}
	if (response.status === "error") {
		if (response.message === "no signal") {
			// spawn tab
			if (!openingCerebro) {
				log.i("Opening a new Cerebro tab since there is no signal to a current one");
				window.open(CEREBRO_URL, "cerebro").blur();
				// try to bring focus back... but this probably won't work
				window.focus();
				openingCerebro = true;
			} else {
				// wait...
			}
			// then
			return true;
		} else {
			log.e(`Got an unexpected error: ${response.message}`);
		}
	} else if (response.status === "ok") {
		if (response.contents === "info") {
			return onInfo(response.info);
		} else if (response.contents === "redirect") {
			// add time
			log.d("Got response: Cerebro is redirecting");
			return true;
		} else if (response.contents === "notfound") {
			log.i(`NetID ${response.netid} reported not found from Cerebro`);
			setCerebroInfoError();
		} else {
			log.w(`Got an unexpected response (status ${response.status}): ${response}`);
		}
	} else {
		log.w(`Got an unexpected response (status ${response.status}): ${response}`);
	}
	return false;
}
/**
 * Runs when **info** is received from Cerebro
 * 
 * @returns true if more info is expected
 */
function onInfo(info: Object) {
	log.d(`Got info about NetID ${info.netId}`);
	if (info.netId === netIdToGet) {
		addCerebroInfo({ key: info.key, yellow: info.yellow, red: info.red });
		log.i(`Added Cerebro info`);
	} else {
		// try again?
		return true;
	}
	return false;
}
