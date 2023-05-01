import { DOMParseError } from "../../errors";
import { TDXPerson } from "../../tdx/types/person";

/**
 * Updates the Person Requiring Service field in the update service request form
 * `window.location.href` must be like BASE_URL/TDNext/Apps/40/Tickets/Edit?TicketID=X and ready
 * @throws a {@link DOMParseError} if the document is invalid (if not on the proper page)
 * 
 * @remarks
 * Will throw if something on the page is not found as expected.
 * This is typically due to being called on the wrong page,
 * but could also be due to an update in the website.
 * 
 * @todo finish this (get it to work; not trusting our clicks)
 * and also verify on proper page
 * and ensure assertions (`!`s) are safe
 * (try-catch them with a nice error like FetchErrorMessage.UNEXPECTED_RESPONSE)
 */
export function setRequestorForm(requestor: TDXPerson) {
    /*
    // direct mod for form
    const hiddenInput = document.querySelector("input[name=\"attribute495\"]");
    hiddenInput.value = requestor.id;
    hiddenInput.className.add("valid");
    hiddenInput.setAttribute("aria-invalid", false);
    */
    // todo click in input form first
    const searchBox: HTMLInputElement | null = document.querySelector(".select2-search > label[for=\"s2id_autogen1_search\"] + input");
    if (searchBox === null) {
        throw new DOMParseError();
    }
    searchBox.value = "emock3@illinois.edu"; // todo
    const typed = new Event("input");
    searchBox.dispatchEvent(typed);

    setTimeout(() => { // todo make this on dom update
        const resultsBox = searchBox.parentElement?.parentElement?.querySelector(".select2-results"); // multiple of document.querySelector(".select2-search + .select2-result");
        if (!resultsBox) { // resultsBox == null || resultsBox === undefined
            throw new DOMParseError();
        }
        const clicked = new Event("mousedown");
        // > .select2-result > .select2-result-label > select2-result-subcaption
        // todo verify resultsBox.children[0].querySelector("select2-result-subcaption") == email;
        resultsBox.children[0].dispatchEvent(clicked);
        // todo: this isn't firing because it is not an isTrusted Event !
        // try running it in a chrome extension content script ?
        // or chrome.debugger, or chrome.scripting.executeScript()
        // test on https://googlechrome.github.io/samples/event-istrusted/
    }, 3000);
}
