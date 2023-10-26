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
		let tryTimeout: NodeJS.Timeout | null = null;
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
					const nextStep = onResponse(response);
					switch (nextStep) {
						case RESPONSE_ACTION.STOP:
							if (tryTimeout) {
								clearTimeout(tryTimeout);
							}
							break;
						case RESPONSE_ACTION.CONTINUE:
							tryAgain();
							break;
						case RESPONSE_ACTION.RESET:
							tries = 0;
							tryAgain();
							break;
					}
				} else {
					tryAgain(); // in vain hope
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
 * What the Cerebro connection listener should do next
 */
enum RESPONSE_ACTION {
	/**
	 * Stop listening
	 */
	STOP,
	/**
	 * Reset listening count to full
	 * i.e. start over
	 * 
	 * @remarks
	 * Should be used when there is an indication of Cerebro loading
	 */
	RESET,
	/**
	 * Continue ticking down the count
	 */
	CONTINUE,
}

/**
 * Stores whether we have received a reported redirection
 * or not
 */
let redirectionStarted = false;

/**
 * Runs when a response is received from Cerebro
 * 
 * @returns true if more info is expected
 */
export function onResponse(response: Object): RESPONSE_ACTION {
	if (response === undefined) {
		return RESPONSE_ACTION.CONTINUE;
	}
	if (response.status === "error") {
		if (response.message === "no signal") {
			// spawn tab
			if (!openingCerebro) {
				log.i("Opening a new Cerebro tab since there is no signal to a current one");
				window.open(CEREBRO_URL, "cerebro")?.blur();
				// try to bring focus back... but this probably won't work
				window.focus();
				openingCerebro = true;
				// full health back (add time... there is now another load)
				return RESPONSE_ACTION.RESET;
			} else {
				// wait...
				return RESPONSE_ACTION.CONTINUE;
			}
		} else {
			log.e(`Got an unexpected error: ${response.message}`);
			return RESPONSE_ACTION.CONTINUE;
		}
	} else if (response.status === "ok") {
		if (response.contents === "info") {
			return onInfo(response.info);
		} else if (response.contents === "redirect") {
			if (!redirectionStarted) {
				log.d("Got response: Cerebro started redirecting");
				redirectionStarted = true;
				return RESPONSE_ACTION.RESET;
			} else {
				// keep ticking
				return RESPONSE_ACTION.CONTINUE;
			}
		} else if (response.contents === "notfound") {
			log.i(`NetID ${response.netid} reported not found from Cerebro`);
			setCerebroInfoError();
			return RESPONSE_ACTION.STOP;
		} else {
			log.w(`Got an unexpected response (status ${response.status}): ${response}`);
			return RESPONSE_ACTION.CONTINUE;
		}
	} else {
		log.w(`Got an unexpected response (status ${response.status}): ${response}`);
	}
	// keep hoping
	return RESPONSE_ACTION.CONTINUE;
}
/**
 * Runs when **info** is received from Cerebro
 * 
 * @returns the desired {@link RESPONSE_ACTION}
 */
function onInfo(info: Object): RESPONSE_ACTION {
	log.d(`Got info about NetID ${info.netId}`);
	if (info.netId === netIdToGet) {
		addCerebroInfo({ key: info.key, yellow: info.yellow, red: info.red });
		log.i(`Added Cerebro info`);
		return RESPONSE_ACTION.STOP;
	} else {
		// try again... I guess?
		return RESPONSE_ACTION.CONTINUE;
	}
}
