// <rule name="">
import * as ticketUpdate from "utils/webpage/foreground/tdx/ticketUpdate";

(() => {
    // todo make configurable template
    // with {client.name.first}, {self.name.last}, {ticket.number}, etc
    // todo pull this from saved settings
    const updatePrefill = `Hello {client.name.first},<br /><br />{cursor}<br /><br />Best,<br />{self.name.first}<br />Technology Services`;

    ticketUpdate.setPrefill(updatePrefill);
})();