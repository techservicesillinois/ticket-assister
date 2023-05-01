import { getCurrentTicketNumber } from "../parser/ticket";
import { verifyFetchSuccess, getDomFromText, FetchErrorMessage } from "../../fetch";
import { log } from "../../logger";
import { ITDXPersonBasic, ITDXPerson } from "../../tdx/types/person";
import { TicketID, LimitedHTML, IAssignCommentOptions, ICommentOptions } from "../../tdx/types/ticket";
import { CreateMethod, SRA, Status, boolToCheckboxValue, getAttributeFor } from "../../tdx/formNames";
import { BASE_URL } from "../../../config";
import { DEFAULT_ALLOWED_TAGS, conformsToHTMLTags, getSubstringBetween } from "../../stringParser";
import { DOMParseError } from "../../errors";

/**
 * Assigns responsibility of the current ticket to the current user
 * 
 * @throws if on a page which does not contain a ticket number (bubbled from {@link getCurrentTicketNumber()})
 */
export async function takePrimRespBg() {
    return new Promise((res, rej) => {
        getCurrentPerson().then(currentPerson => {
            assignResponsibilityBg(getCurrentTicketNumber(), currentPerson)
                .then(
                    r => res(r),
                    e => rej(e),
                );
        })
            .catch(rej);
    });
}

/**
 * Gets the current user
 * 
 * @remarks
 * Is based off of the currently logged in person's cookies.
 * @returns a {@link Promise}:
 * - Resolve: the currently logged in user (the user signed in to TDX running this code)
 * - Reject: network errors
 *
 * @todo cache this person: it won't change
 */
export function getCurrentPerson(): Promise<ITDXPersonBasic> {
    return new Promise((res, rej) => {
        fetch(BASE_URL + "/TDNext/Home/Desktop/Default.aspx")
            .then(verifyFetchSuccess)
            .then(getDomFromText)
            .then(dom => {
                const valEl = dom.querySelector("ul.user-profile-menu.dropdown-menu.dropdown-menu-right.gutter-top-sm > li[role=\"menuitem\"] > a[href=\"#\"]");
                const nameEl = dom.querySelector("ul.user-profile-menu.dropdown-menu.dropdown-menu-right.gutter-top-sm > li.profile-image > div.profile-image");
                if (valEl === null || !valEl.hasAttribute("onclick") || nameEl === null || !nameEl.hasAttribute("title")) {
                    return rej(FetchErrorMessage.UNEXPECTED_RESPONSE);
                }
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const val = valEl.getAttribute("onclick")!; // bang (safe because just checked)
                const startChunk = "openWin('/TDNext/Apps/People/PersonDet.aspx?U="; // javascript:
                const endChunk = "'";
                const startIdx = val.indexOf(startChunk) + startChunk.length;
                /*res(new TDXPerson({
                  id: val.substring(startIdx, val.indexOf(endChunk, startIdx)),
                  name: nameEl.getAttribute("title")!,
                }));*/
                res({
                    id: val.substring(startIdx, val.indexOf(endChunk, startIdx)),
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    name: nameEl.getAttribute("title")!,
                });
            }, err => rej(err))
            .catch(err => rej(err));
    });
}

/**
 * Assigns responsibility of a ticket to a user in the background
 * @param ticketId - The ticket to assign reponsibility for
 * @param responsible - The person to assign responsibility to
 * @param comment? - Comments to include in the feed when assigning. Defaults to no note with notification on.
 * @returns a Promise, resolving if successful and rejecting otherwise
 */
export function assignResponsibilityBg(ticketId: TicketID, responsible: ITDXPersonBasic, comment: IAssignCommentOptions = { text: "", notify: false }): Promise<void> {
    return new Promise((res, rej) => {
        fetch(BASE_URL + "/TDNext/Apps/40/Tickets/TicketReassign?TicketID=" + ticketId)
            .then(verifyFetchSuccess)
            .then(getDomFromText)
            .then(dom => {
                const wrappers = dom.querySelectorAll('body > form[action="./TicketReassign?TicketID=' + ticketId + '"] > div.aspNetHidden');
                const metaData = new Map();
                if (wrappers.length < 2) {
                    // couldn't find required components to assign responsibility
                    rej(FetchErrorMessage.UNEXPECTED_RESPONSE);
                }
                for (const wrapper of wrappers) {
                    wrapper.querySelectorAll('input[type="hidden"]').forEach(input => {
                        // input.name should be even with input.id
                        if (!input.hasAttribute("name") || !input.hasAttribute("value")) {
                            return; // skip it
                        }
                        metaData.set(input.getAttribute("name"), input.getAttribute("value"));
                    });
                }
                const formData = new FormData();
                formData.set("ScriptManager1", "upAdd|btnAdd"); // probably not needed
                formData.set("__EVENTTARGET", "btnAdd"); // overwritten incorrectly: clicking button should set to btnAdd
                formData.set("__EVENTARGUMENT", ""); // overwritten
                //formData.set("__VIEWSTATE", "..."); // overwritten
                formData.set("__VIEWSTATEGENERATOR", "8F90E7C6"); // overwritten, but usually the same
                //formData.set("__EVENTVALIDATION", "..."); // overwritten
                formData.set("taluResponsible$txttaluResponsible", responsible.name);
                formData.set("taluResponsible$hdntaluResponsible", responsible.id + ",");
                formData.set("taluResponsible$hdnTextValuestaluResponsible", responsible.name);
                formData.set("hdnRespType", "true");
                formData.set("chkNotify", boolToCheckboxValue(comment.notify));
                formData.set("txtComments", comment.text);
                formData.set("__ASYNCPOST", "true"); // probably not needed
                // overwrite and add __VIEWSTATE, __VIEWSTATEGENERATOR, __EVENTVALIDATION
                // also (probably not needed) __EVENTTARGET, __EVENTARGUMENT
                metaData.forEach((v, k) => {
                    if (["__VIEWSTATE", "__VIEWSTATEGENERATOR", "__EVENTVALIDATION", "__EVENTARGUMENT"].includes(k)) {
                        log.d(`Adding ${v} => ${k}`);
                        formData.set(k, v);
                    }
                });
                if (!(formData.has("__EVENTVALIDATION") || formData.has("__VIEWSTATE"))) {
                    log.w("Don't have all the form data necessary: Request will fail!"); // just a w for now. will e upon net req
                }

                // cookies, including __RequestVerificationToken_L1RETmV4dA2 and __AntiXsrfToken, should be included
                fetch(BASE_URL + "/TDNext/Apps/40/Tickets/TicketReassign?TicketID=" + ticketId, {
                    method: "POST",
                    body: formData,
                })
                    .then(verifyFetchSuccess)
                    .then(text => {
                        if (text.substring(1, 4) !== "|#||" || text.toLowerCase().indexOf("|scriptBlock|ScriptContentNoTags|if (window.opener && !window.opener.closed) {   if(window.opener.refresh) {window.opener.refresh();}  else {window.opener.location.href = window.opener.location.href;}} window.close();|") !== -1) {
                            return rej(FetchErrorMessage.UNEXPECTED_RESPONSE);
                        }
                        res();
                    });
            },
                () => rej(FetchErrorMessage.NETWORK_ERROR));
    });
}

/**
* Adds a comment to a ticket in the background
* @param ticketId - The ticket to assign reponsibility for
* @param comment? - Optional comments to include in the feed when assigning
* @returns a Promise, resolving if successful and rejecting otherwise
* @todo test
*/
function commentBg(ticketId: TicketID, comment: ICommentOptions): Promise<void> {
    return new Promise((res, rej) => {
        return rej("Not tested");
        fetch(BASE_URL + "/TDNext/Apps/40/Tickets/TicketDet?TicketID=" + ticketId)
            .then(verifyFetchSuccess)
            .then(getDomFromText)
            .then(dom => {
                // should find [[__EVENTTARGET, __EVENTARGUMENT, __VIEWSTATE], [__VIEWSTATEGENERATOR, __EVENTVALIDATION]]
                const wrappers = dom.querySelectorAll('body > form[action="./TicketDet?TicketID=' + ticketId + '"] > div.aspNetHidden');
                const metaData = new Map();
                if (wrappers.length < 2) {
                    // couldn't find required components to assign responsibility
                    rej(FetchErrorMessage.UNEXPECTED_RESPONSE);
                }
                for (const wrapper of wrappers) {
                    wrapper.querySelectorAll('input[type="hidden"]').forEach(input => {
                        // input.name should be even with input.id
                        if (!input.hasAttribute("name") || !input.hasAttribute("value")) {
                            return; // skip it
                        }
                        metaData.set(input.getAttribute("name"), input.getAttribute("value"));
                    });
                }
                const formData = new FormData();
                formData.set("ScriptManager1", "ScriptManager1|btnSaveComment");
                formData.set("__EVENTTARGET", "btnAdd"); // overwritten incorrectly: clicking button should set to btnAdd
                formData.set("__EVENTARGUMENT", ""); // overwritten
                //formData.set("__VIEWSTATE", "..."); // overwritten
                formData.set("__VIEWSTATEGENERATOR", "CCFBE090"); // overwritten, but usually the same
                //formData.set("__EVENTVALIDATION", "..."); // overwritten

                formData.set("hdnTicketTaskID", "");
                formData.set("hdnWorkflowStepID", "0");
                formData.set("hdnIsInMyWork", "-1");
                formData.set("itTags$hdnTags", "");
                formData.set("chkMarkCommentsPrivate", boolToCheckboxValue(comment.isPrivate));
                for (const person of comment.notify) {
                    // supposed to duplicate for successive notifies
                    formData.append("lstNotification", `{(${person.name}),(${person.email})}`);
                }
                formData.set("txtComments$txtEditor$txtBody", comment.comments);
                formData.set("txtActionComments", "");
                formData.set("hdnStepID", "");
                formData.set("hdnActionID", "");
                formData.set("taluWorkspace$txttaluWorkspace", "");
                formData.set("taluWorkspace$hdntaluWorkspace", "");
                formData.set("taluWorkspace$hdnTextValuestaluWorkspace", "");
                formData.set("__ASYNCPOST", "true"); // probably not needed
                formData.set("btnSaveComment", "Save");

                // overwrite and add __VIEWSTATE, __VIEWSTATEGENERATOR, __EVENTVALIDATION
                // also (probably not needed) __EVENTTARGET, __EVENTARGUMENT
                metaData.forEach((v, k) => {
                    if (["__VIEWSTATE", "__VIEWSTATEGENERATOR", "__EVENTVALIDATION", "__EVENTARGUMENT"].includes(k)) {
                        log.d(`Adding ${v} => ${k}`);
                        formData.set(k, v);
                    }
                });
                if (!(formData.has("__EVENTVALIDATION") || formData.has("__VIEWSTATE"))) {
                    log.w("Don't have all the form data necessary: Request will fail!"); // just a w for now. will e upon net req
                }

                // cookies, including __RequestVerificationToken_L1RETmV4dA2 and __AntiXsrfToken, should be included
                fetch(BASE_URL + "/TDNext/Apps/40/Tickets/TicketDet?TicketID=" + ticketId, {
                    method: "POST",
                    body: formData,
                })
                    .then(verifyFetchSuccess)
                    .then(text => {
                        // todo extract this: same in other update-like requests
                        if (text.substring(1, 4) !== "|#||" || text.toLowerCase().indexOf("|scriptBlock|ScriptContentNoTags|if (window.opener && !window.opener.closed) {   if(window.opener.refresh) {window.opener.refresh();}  else {window.opener.location.href = window.opener.location.href;}} window.close();|") !== -1) {
                            return rej(FetchErrorMessage.UNEXPECTED_RESPONSE);
                        }
                        res();
                    });
            },
                () => rej(FetchErrorMessage.NETWORK_ERROR));
    });
}
/**
 * Updates a ticket in the background
 * Adds a message to the ticket feed and optionally notifies users.
 * @param ticketId - The ticket to assign reponsibility for
 * @param params: {
 *   status? - Optional new status to set the ticket to
 *     @todo goes off hold date?
 *   message - HTML message of ticket
 *   notify - Array of ITDXPersons to update via email
 *   extraNotify? - Optional Array of other email addressed to notify
 * }
 * @returns a Promise, resolving if successful and rejecting otherwise
 * @todo implement
 * @todo test
 * @todo refactor params to its own interface, probably
 * @internalRemarks
 * could make params of type Partial<UpdateValues> to make everything optional
 * use ICommentOptions instead?
 */
function updateBg(ticketId: TicketID, params: { status?: Status, message: LimitedHTML, notify?: Array<ITDXPerson>, extraNotify?: Array<string>, requestArea?: SRA }): Promise<void> {
    return new Promise((res, rej) => {
        rej("Not implemented");
        /*fetch(BASE_URL + "/todo?TicketID="+ticketId)
          .then(verifyFetchSuccess)
          .then(getDomFromText)
          .then(dom => {
          },
          err => rej(FetchErrorMessage.NETWORK_ERROR));*/
    });
}
/**
 * Edits a ticket in the background
 * @param ticketId - The ticket to assign reponsibility for
 * @param params: {
 *   requestor - the requestor field
 *   status - the status
 *   createdVia - the Created Via value
 *   requestArea - the Request Area
 *   responsible - the responsible person or group
 *   title - the Summary field
 *   description - HTML description
 * }
 * @returns a Promise, resolving if successful and rejecting otherwise
 * @todo implement - use params
 * @todo test
 * @todo refactor params to its own interface, probably
 * @remarks
 * Changing form types is not supported.
 * The current form type is preserved.
 * 
 * Also, cannot change Priority or Department at the moment.
 * Defaults are preserved.
 */
function editBg(ticketId: TicketID, params: { requestor?: ITDXPerson, status?: Status, createdVia?: CreateMethod, requestArea?: SRA, responsible?: ITDXPerson, title?: string, description?: LimitedHTML }): Promise<void> {
    return new Promise((res, rej) => {
        //todo here return rej("Not fully implemented");
        fetch(BASE_URL + "/TDNext/Apps/40/Tickets/Edit?TicketID=" + ticketId)
            .then(verifyFetchSuccess)
            .then(getDomFromText)
            .then(dom => {
                /*// find __RequestVerificationToken
                const rvt = dom.querySelectorAll('body > form[action="/TDNext/Apps/40/Tickets/Edit?ticketId='+ticketId+'"] > input[name="__RequestVerificationToken"]');
                if (rvt === null || rvt.value === null) {
                  log.w("Don't have all the form data necessary: Request will fail!"); // just a w for now. will e upon net req
                }*/

                if (params.description !== undefined) {
                    let allowedTags = DEFAULT_ALLOWED_TAGS;
                    try {
                        const wsiwygScriptEl = dom.querySelector("#attribute138-grp > script:nth-child(8)");
                        if (wsiwygScriptEl === null) {
                            throw new DOMParseError();
                        }
                        const jsonRaw = getSubstringBetween(wsiwygScriptEl.innerHTML, "var config = JSON.parse('", "');");
                        const json = JSON.parse(jsonRaw);
                        // assert(json.title === "Description");
                        //json.disallowedContent
                        // json { filebrowserImageUploadUrl, uploadUrl }

                        const extractTags = (input: string): string[] => {
                            // todo try and simplify this regex
                            // i was lazy and had cgpt write it.
                            // it works
                            const regex = /[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?![^[{]*[\]}])/gi;
                            const tags = input.match(regex);
                            return tags as Array<string>;
                        }

                        //allowedTags = json.allowedContent.split(" ");
                        allowedTags = extractTags(json.allowedContent);
                        // also could check the attributes allowed, but eh
                    } catch (e) {
                        // eh probably fine
                        log.w("Couldn't find the allowed tags for the comment. Using fallback.");
                    }

                    if (!conformsToHTMLTags(params.description, allowedTags)) {
                        log.w("Submitted description contains disallowed HTML tags, request will fail!");
                    }
                }

                const existingData: Record<string, string> = Array.from(dom.querySelectorAll("input[name]")).reduce((data, input) => {
                    // todo fix this
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    data[input.getAttribute("name")!] = input.getAttribute("value");
                    return data;
                }, {});



                const formData = new FormData();

                const expectDefaults = ["Item.GoesOffHoldDate_ForEdit", "Item.NotifyResponsible", "Item.ShouldCloseRemainingTasks", "PrevFormID", "RevealedFieldJson", "attribute37", "attribute138.EditorKey", "attribute495", "attribute1279", "attribute3385", "__RequestVerificationToken"];
                if (!expectDefaults.every(k => k in existingData)) {
                    log.w("Don't have all the form data necessary: Request will fail!"); // just a w for now. will e upon net req
                }
                for (const [k, v] of Object.entries(existingData)) {
                    formData.set(k, v);
                }
                // Item.ShouldCloseRemainingTasks default is the input with checked="checked" ("True"/"False" value)

                // defaults
                for (const key of expectDefaults) {
                    // we know existingData has key `key` or has issued a warning from above
                    formData.set(key, existingData[key] ?? "");
                }
                formData.set("FormID", "350"); // todo default (select) // todo: map to Incident etc
                formData.set(getAttributeFor("Status"), "121"); // attribute40 // todo default (select) // todo: map to "Closed" etc
                formData.set(getAttributeFor("Department"), "341"); // attribute38 // todo default // don't need a map for this really
                formData.set(getAttributeFor("Created Via"), "7"); // attribute371 // todo default (select) // todo: map to "Walk In" etc
                formData.set(getAttributeFor("Request Area"), "2427"); // attribute2523 // todo default // todo: map to "2FA.Bypass Code" etc
                formData.set(getAttributeFor("Priority"), "20"); // attribute41 // todo default (select) selected="selected"

                //formData.set("Item.NotifyResponsible", "true"); // this can be checked always (default)
                //formData.set("Item.ShouldCloseRemainingTasks", "False"); // not going to deal with ticket tasks

                // overrides
                /*for (const [key, value] of params) {
                    if (params[key] === undefined) {
                        return;
                    }
                    formData.set(getAttributeFor(key), value);
                }*/
                if (params.title !== undefined) formData.set(getAttributeFor("Summary"), params.title);
                if (params.description !== undefined) formData.set(getAttributeFor("Description of Issue"), params.description as string);
                if (params.requestor !== undefined) formData.set(getAttributeFor("Person Requiring Service"), params.requestor.id);
                if (params.responsible !== undefined) formData.set(getAttributeFor("Responsible"), params.responsible.id);
                if (params.status !== undefined) formData.set(getAttributeFor("Status"), params.status);
                if (params.createdVia !== undefined) formData.set(getAttributeFor("Created Via"), params.createdVia);
                if (params.requestArea !== undefined) formData.set(getAttributeFor("Request Area"), params.requestArea);

                // cookies, including __RequestVerificationToken_L1RETmV4dA2 and __AntiXsrfToken, should be included
                fetch(BASE_URL + "/TDNext/Apps/40/Tickets/Edit?TicketID=" + ticketId, {
                    method: "POST",
                    body: formData,
                })
                    .then(verifyFetchSuccess)
                    .then(getDomFromText)
                    .then(dom => {
                        const alertNotice = dom.querySelector("body > main > div.alert.alert-success")?.childNodes[2]?.textContent;
                        if (!alertNotice || alertNotice.trim() !== "Changes saved.") {
                            // probably bad
                            return rej(FetchErrorMessage.UNEXPECTED_RESPONSE);
                        }
                        res();
                    });
            },
                () => rej(FetchErrorMessage.NETWORK_ERROR));
    });
}
