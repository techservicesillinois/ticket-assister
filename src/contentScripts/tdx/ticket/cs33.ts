// <rule name="TDX/Ticket/Search/Auto select all statuses">
import { log } from "utils/logger";
import { DomParseError } from "utils/errors";


const selectEl = <HTMLSelectElement>document.querySelector("select[name=\"lbStatus\"]");
if (selectEl === null) {
    //throw new DomParseError()
    log.e("Failed to locate select el");
} else {
    let alreadyAllSelected = true;
    for (const child of selectEl.children) {
        // mark selected
        if (child instanceof HTMLOptionElement && child.selected !== true) {
            child.selected = true;
            child.setAttribute("selected", "selected"); // for visuals
            alreadyAllSelected = false;
        }
    }
    if (!alreadyAllSelected) {
        try {
            selectEl.parentElement!.querySelector(".ms-parent button")!.children[0]!.textContent = "All selected";
        } catch {
            throw new DomParseError();
        }
        const applyBtn = document.querySelector("#btnApply");
        if (applyBtn !== null && applyBtn instanceof HTMLElement) {
            applyBtn.click();
        } else {
            // this is just what the onclick is
            //window.__doPostBack('btnApply', ''); // don't have access to this `window`
            log.e("Failed to apply changes to All selected statuses: could not locate apply button");
        }
    }
}
