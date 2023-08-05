// <rule name="TDX/Ticket/View/Hide attachments if empty">
import { getAttachmentCount, getAttachmentsEl } from "utils/webpage/foreground/tdx/ticketView";
import { collapseEl } from "utils/webpage/foreground/tdx/shared";
import { log } from "utils/logger";


(async () => {
    try {
        const attachmentCount = await getAttachmentCount();
        const singular = attachmentCount === 1;
        log.d(`There ${singular ? "is" : "are"} ${attachmentCount} attachment${singular ? "" : "s"}`);
        if (attachmentCount === 0) {
            collapseEl(await getAttachmentsEl(), "attachments", true);
        }
    } catch (e) {
        log.e(`Failed to check attachments: ${e.message}`);
    }
})();
