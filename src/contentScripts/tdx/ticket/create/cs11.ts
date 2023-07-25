// <rule name="TDX/Ticket/Create/Quick select Service Request, Incident, Classtech form">
import * as ticketCreate from "utils/webpage/foreground/tdx/ticketCreate";

(() => {
	ticketCreate.getFormBox().appendChild(ticketCreate.generateQuickSelect());
})();