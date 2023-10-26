// <rule name="TDX/Ticket/View/Get Cerebro data">
// note that this script runs in Cerebro
import { listenForMessages } from "utils/webpage/foreground/cerebro";
import { log } from "utils/logger";


// todo: clean up the functions inside

try {
	listenForMessages();
} catch (e) {
	log.e(`Error when listening for messages: ${e instanceof Error ? e.message : e}`);
}
