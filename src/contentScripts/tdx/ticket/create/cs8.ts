// <rule name="TDX/Ticket/Create/Auto take ticket">
import { getCurrentTicketNumber } from "utils/webpage/parser/ticket";
import { assignResponsibilityBg, getCurrentPerson, getTicketDatumBg } from "utils/webpage/background/ticketActions";
import { log } from "utils/logger";

(() => {
	// todo: async/await this?
	Promise.all([getCurrentPerson(), getTicketDatumBg(getCurrentTicketNumber(), "Responsibility")]).then(([currentPerson, responsibilityField]) => {
		if (responsibilityField === "UIUC-TechServices-Help Desk") {
			assignResponsibilityBg(getCurrentTicketNumber(), currentPerson)
				.then(
					r => (r),
					() => log.e("Failed to take responsibility for ticket"),
				);
		} else {
			log.i(`Not taking newly created ticket because responsibility is ${responsibilityField}`);
		}
	});
})();