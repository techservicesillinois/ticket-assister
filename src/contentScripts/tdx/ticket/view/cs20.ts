// <rule name="TDX/Ticket/View/Hide extra details">
import * as ticketView from "utils/webpage/foreground/tdx/ticketView";

(() => {
    ticketView.collapseDetailsExceptFor(["divResponsibility", "divAttribute2523", "divAge"]);
})();