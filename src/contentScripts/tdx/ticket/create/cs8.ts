// <rule name="TDX/Ticket/Create/Auto take ticket">
import { getCurrentTicketNumber } from "utils/webpage/parser/ticket";
import { takeResponsibilityBg, getTicketDatumBg, getTicketStatusBg, getCurrentPerson, assignResponsibilityBg } from "utils/webpage/background/ticketActions";
import { log } from "utils/logger";


const currTicketNumber = getCurrentTicketNumber();
Promise.all([getCurrentPerson(), getTicketDatumBg(currTicketNumber, "Responsibility")])
	.then(async ([currentPerson, responsibilityField]) => {
		if (responsibilityField === "UIUC-TechServices-Help Desk") {
			try {
				const status = await getTicketStatusBg(currTicketNumber);
				if (status === "Open") {
					await takeResponsibilityBg(currTicketNumber)
					log.d(`Took responsibility of tdx#${currTicketNumber}`);
				} else {
					// todo test
					await assignResponsibilityBg(currTicketNumber, currentPerson);
					log.d(`Assigned responsibility of tdx#${currTicketNumber} to current person (${currentPerson.name})`);
				}
				return;
			} catch (e) {
				log.e(`Failed to take responsibility for ticket ${currTicketNumber}: ${e.message}`);
			}
		} else {
			log.i(`Not taking newly created ticket because responsibility is ${responsibilityField}`);
		}
	});
