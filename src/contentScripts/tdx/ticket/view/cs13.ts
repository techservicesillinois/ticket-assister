// <rule name="TDX/Ticket/View/Ctrl+Enter to submit comment">
import{ getCommentSaveButton } from "utils/webpage/foreground/tdx/ticketView";
import { getWysiwygBody, onWysiwygLoad, submitOnCtrlEnter } from "utils/webpage/foreground/tdx/shared";
import { log } from "utils/logger";

const addListener = async () => {
    log.d(`Adding Ctrl+Enter listener on WYSIWYG`);
    submitOnCtrlEnter(await getWysiwygBody(), getCommentSaveButton());
};
// add the listener now
addListener();
// and add it every time there was a refresh change (every time submitted or cancelled)
// note that this is via ctrl+enter OR button press
onWysiwygLoad(addListener);
