// <rule name="TDX/Ticket/Create/Ctrl+Enter to submit">
import { formChangeListen, getSaveButton } from "utils/webpage/foreground/tdx/ticketCreate";
import { getWysiwygBody, submitOnCtrlEnter } from "utils/webpage/foreground/tdx/shared";


submitOnCtrlEnter(document.body, getSaveButton());
formChangeListen(async () => { submitOnCtrlEnter(await getWysiwygBody(), getSaveButton()); });
