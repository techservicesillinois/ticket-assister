// <rule name="TDX/Ticket/Create/Auto take ticket">
import { getCurrentTicketNumber } from "utils/webpage/parser/ticket";
import { takeResponsibilityBg, getTicketDatumFg, getTicketStatusBg, getCurrentPerson, assignResponsibilityBg } from "utils/webpage/background/ticketActions";
import { log } from "utils/logger";
import { TICKETS_BASE_URL } from "utils/webpage/foreground/tdx/shared";

// if chained with auto redirect, this may need to run instead of cs8.ts
const CREATED_BASE_URL = `${TICKETS_BASE_URL}/TicketNewSuccess`;
if (document.referrer.substring(0, CREATED_BASE_URL.length) === CREATED_BASE_URL) {
    const currTicketNumber = getCurrentTicketNumber();
    getCurrentPerson()
        .then(async (currentPerson) => {
            const responsibilityField = getTicketDatumFg(document, "Responsibility");
            if (responsibilityField === "UIUC-TechServices-Help Desk") {
                try {
                    const status = await getTicketStatusBg(currTicketNumber);
                    if (status === "Open") {
                        await takeResponsibilityBg(currTicketNumber)
                        log.d(`Took responsibility of tdx#${currTicketNumber}`);
                    } else {
                        await assignResponsibilityBg(currTicketNumber, currentPerson);
                        log.d(`Assigned responsibility of tdx#${currTicketNumber} to current person (${currentPerson.name})`);
                    }
                    // now, visually update
                    window.location.reload();
                } catch (e) {
                    log.e(`Failed to take responsibility for ticket ${currTicketNumber}: ${e.message}`);
                }
            } else {
                log.i(`Not taking newly created ticket because responsibility is ${responsibilityField}`);
            }
        });
}

