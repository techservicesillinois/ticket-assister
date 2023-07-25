// <rule name="TDX/Ticket/View/Show client's recent tickets">
import * as ticketView from "utils/webpage/foreground/tdx/ticketView";

(() => {
    ticketView.addRecentRequestorTickets();
})();