// <rule name="TDX/Ticket/Update/Auto set Awaiting Customer Response">
import { Status } from "utils/tdx/formNames";
import { getNewStatus, setNewStatus } from "utils/webpage/foreground/tdx/ticketUpdate";


const currentStatus = getNewStatus();
if (currentStatus !== undefined) {
    //if (["New", "Open", "Reopened"].includes(currentStatus)) {
    if (new Set([Status["New"], Status["Open"], Status["Reopened"]]).has(currentStatus)) {
        setNewStatus(Status["Awaiting Customer Response"]);
    }
}
