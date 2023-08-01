// <rule name="TDX/Ticket/Create/Quick select Service Request, Incident, Classtech form">
import { getFormBox, generateQuickSelect } from "utils/webpage/foreground/tdx/ticketCreate";

getFormBox().appendChild(generateQuickSelect());
