import type { TicketID } from "utils/tdx/types/ticket";

/**
 * Returns the TicketID of the current ticket being viewed
 * 
 * @remarks
 * This is based on the current page loaded where this function is called.
 * It uses the query parameter for the ticket.
 * It should only be called on Tickets/TicketDet, Tickets/Edit, and Tickets/TicketNewSuccess pages.
 * @returns the current TicketID
 * @throws an {@link Error} the ticket id is nonexistant or indeterminable
 */
export function getCurrentTicketNumber(): TicketID {
    const search = new URLSearchParams(window.location.search);
    const a = parseInt(search.get("TicketID") ?? search.get("ticketid") ?? '');
    if (Number.isNaN(Number(a))) { // query is blank or null
        throw new Error("Unable to get current ticket id");
    }
    return a;
}
