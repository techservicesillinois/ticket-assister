// <rule name="TDX/Ticket/View/Make comments private by default">
import { getCommentMakePrivateButton } from "utils/webpage/foreground/tdx/ticketView";


getCommentMakePrivateButton().checked = true;
