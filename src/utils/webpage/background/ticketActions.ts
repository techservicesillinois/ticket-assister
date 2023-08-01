import { getCurrentTicketNumber } from "../parser/ticket";
import { verifyFetchSuccess, getDomFromText, FetchErrorMessage } from "utils/fetch";
import { log } from "utils/logger";
import type { ITDXPersonBasic, ITDXPerson } from "utils/tdx/types/person";
import type { TicketID, LimitedHTML, IAssignCommentOptions, ICommentOptions } from "utils/tdx/types/ticket";
import { CreateMethod, SRA, Status, boolToCheckboxValue, getAttributeFor } from "utils/tdx/formNames";
import { BASE_URL } from "config";
import { DEFAULT_ALLOWED_TAGS, conformsToHTMLTags, getSubstringBetween } from "utils/stringParser";
import { getTicketViewUrl } from "../foreground/tdx/pageLocator";
import { DomParseError } from "utils/errors";

/**
 * Assigns responsibility of the current ticket to the current user
 * Adds to "My Work" if {@param addToMyWork}
 * 
 * @throws if on a page which does not contain a ticket number (bubbled from {@link getCurrentTicketNumber()})
 * 
 * @param ticketID the id of the ticket to take
 * 
 * @remarks
 * Simulates pressing the "take" button.
 * @see {@link assignResponsibilityBg}
 * 
 * @todo refactor to reuse some code from {@link assignResponsibilityBg}
 */
export async function takeResponsibilityBg(ticketID: TicketID, addToMyWork = false): Promise<void> {
    /*return new Promise((res, rej) => {
        getCurrentPerson().then(currentPerson => {
            assignResponsibilityBg(getCurrentTicketNumber(), currentPerson)
                .then(
                    r => res(r),
                    e => rej(e),
                );
        })
            .catch(rej);
    });*/
    return new Promise((res, rej) => {
        fetch(BASE_URL + "/Apps/40/Tickets/TicketDet?TicketID=" + ticketID)
            .then(verifyFetchSuccess)
            .then(getDomFromText)
            .then(dom => {
                const wrappers = dom.querySelectorAll('body > form[action="./TicketDet?TicketID=' + ticketID + '"] > div.aspNetHidden');
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
                formData.set("ScriptManager1", "upTicketAssignment|btnTakeTicket");
                formData.set("__EVENTTARGET", "btnTakeTicket"); // overwritten incorrectly: clicking button should set to btnAdd
                formData.set("__EVENTARGUMENT", ""); // overwritten, but not necessary
                //formData.set("__VIEWSTATE", "..."); // overwritten
                formData.set("__VIEWSTATEGENERATOR", "64491348"); // overwritten, but usually the same
                //formData.set("__EVENTVALIDATION", "..."); // overwritten
                formData.set("hdnTicketTaskID", "");
                formData.set("hdnWorkflowStepID", "0");
                formData.set("hdnIsInMyWork", addToMyWork ? "1" : "0");
                formData.set("itTags$hdnTags", "");
                formData.set("txtComments$txtEditor$txtBody", "");
                formData.set("txtActionComments", "");
                formData.set("hdnStepID", "");
                formData.set("hdnActionID", "");
                formData.set("taluWorkspace$txttaluWorkspace", "");
                formData.set("taluWorkspace$hdntaluWorkspace", "");
                formData.set("taluWorkspace$hdnTextValuestaluWorkspace", "");
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
                fetch(BASE_URL + "/Apps/40/Tickets/TicketDet?TicketID=" + ticketID, {
                    method: "POST",
                    body: formData,
                })
                    .then(verifyFetchSuccess)
                    .then(text => {
                        // should have like #upResponsibility > a.textContent === Group Name / User Name also...
                        if (text.substring(1, 5) !== "|#||" || text.indexOf("TeamDynamix.Feeds.refreshFeed('ticketFeed')") === -1 || (text.match(/Take [a-zA-z]+/)?.length ?? 0) !== 0) {
                            log.d(`Network request to take responsibility was successful, but the response indicated that the operation failed.`);
                            return rej(FetchErrorMessage.UNEXPECTED_RESPONSE);
                        }
                        res();
                    });
            },
                () => rej(FetchErrorMessage.NETWORK_ERROR));
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
        fetch(BASE_URL + "/Home/Desktop/Default.aspx")
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
                const absoluteBase = BASE_URL.substring(BASE_URL.indexOf("/", 8)); // /TDNext or /SBTDNext
                const startChunk = `openWin('${absoluteBase}/Apps/People/PersonDet.aspx?U=`; // javascript:
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
 * @param ticketID - The ticket to assign reponsibility for
 * @param responsible - The person to assign responsibility to
 * @param comment? - Comments to include in the feed when assigning. Defaults to no note with notification on.
 * @returns a Promise, resolving if successful and rejecting otherwise
 * 
 * @see {@link takeResponsibilityBg} if {@param response} is the current user.
 */
export function assignResponsibilityBg(ticketID: TicketID, responsible: ITDXPersonBasic, comment: IAssignCommentOptions = { text: "", notify: false }): Promise<void> {
    return new Promise((res, rej) => {
        fetch(BASE_URL + "/Apps/40/Tickets/TicketReassign?TicketID=" + ticketID)
            .then(verifyFetchSuccess)
            .then(getDomFromText)
            .then(dom => {
                const wrappers = dom.querySelectorAll('body > form[action="./TicketReassign?TicketID=' + ticketID + '"] > div.aspNetHidden');
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
                fetch(BASE_URL + "/Apps/40/Tickets/TicketReassign?TicketID=" + ticketID, {
                    method: "POST",
                    body: formData,
                })
                    .then(verifyFetchSuccess)
                    .then(text => {
                        if (text.substring(1, 5) !== "|#||" || text.indexOf("|scriptBlock|ScriptContentNoTags|if (window.opener && !window.opener.closed) {   if(window.opener.refresh) {window.opener.refresh();}  else {window.opener.location.href = window.opener.location.href;}} window.close();|") === -1) {
                            log.d(`Network request to assign responsibility was successful, but the response indicated that the operation failed.`);
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
* @param ticketID - The ticket to assign reponsibility for
* @param comment? - Optional comments to include in the feed when assigning
* @returns a Promise, resolving if successful and rejecting otherwise
* @todo test
*/
function commentBg(ticketID: TicketID, comment: ICommentOptions): Promise<void> {
    return new Promise((res, rej) => {
        return rej("Not tested");
        fetch(BASE_URL + "/Apps/40/Tickets/TicketDet.aspx?TicketID=" + ticketID)
            .then(verifyFetchSuccess)
            .then(getDomFromText)
            .then(dom => {
                // should find [[__EVENTTARGET, __EVENTARGUMENT, __VIEWSTATE], [__VIEWSTATEGENERATOR, __EVENTVALIDATION]]
                const wrappers = dom.querySelectorAll('body > form[action="./TicketDet.aspx?TicketID=' + ticketID + '"] > div.aspNetHidden');
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
                fetch(BASE_URL + "/Apps/40/Tickets/TicketDet.aspx?TicketID=" + ticketID, {
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
 * @param ticketID - The ticket to assign reponsibility for
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
function updateBg(ticketID: TicketID, params: { status?: Status, message: LimitedHTML, notify?: Array<ITDXPerson>, extraNotify?: Array<string>, requestArea?: SRA }): Promise<void> {
    return new Promise((res, rej) => {
        rej("Not implemented");
        /*fetch(BASE_URL + "/todo?TicketID="+ticketID)
			.then(verifyFetchSuccess)
			.then(getDomFromText)
			.then(dom => {
			},
			err => rej(FetchErrorMessage.NETWORK_ERROR));*/
		/* todo adapt this reference:
		import { getTicketUpdateUrl, getTicketViewUrl } from "../../tdx/pageLocator";

		let requestVerificationToken = null;

		async function closeBoxTicket(ticketID) {
			return new Promise((res, rej) => {
				const formData = new FormData();
				formData.append("__RequestVerificationToken", requestVerificationToken);
				formData.append("RevealedFieldJson", "");
				formData.append("NewStatusId", "121");
				formData.append("NewGoesOffHoldDate", "");
				formData.append("CommentsIsPrivate", "true");
				formData.append("CommentsIsPrivate", "false");
				formData.append("Comments.Content", "per past t#290021");
				formData.append("Comments.EditorKey", "8edf5929-afb5-4f4e-8cb1-e06f348504a2"); // idk... this changes, but doesn't seem to matter
				formData.append("OtherPeopleIds", "");
				formData.append("OtherPeopleJson", "[]");
				formData.append("OtherEmailAddresses", "");
				formData.append("AttachmentIds", "");
				formData.append("KnowledgeBaseArticleOption", "0");
				formData.append("ArticleShortcutCompositeID", "");
				formData.append("attribute2523", "2414"); // UIUC-TechSvc-TDX Request Areas
				fetch(getTicketUpdateUrl(ticketID),
					{
						method: "POST",
						body: formData
					})
					.then(res => res.text())
					.then(
						text => {
							if (text.indexOf("The service request was successfully updated.") !== -1) {
								res();
							} else {
								rej("fail");
							}
						},
						err => rej(err)
					);
			});
		}
		async function updateRequetVerificationToken(ticketID) {
			// I think we can reuse this across tickets...
			return new Promise((res, rej) => {
				fetch(getTicketUpdateUrl(ticketID))
					.then(res => res.text())
					.then(text => {
						const dom = new DOMParser().parseFromString(text, "text/html");
						try {
							// <input name="__RequestVerificationToken" type="hidden" value="..." />
							requestVerificationToken = dom.querySelector("input[name=\"__RequestVerificationToken\"]").value;
							if (requestVerificationToken != null) {
								res(true); // OK!
							}
						} catch (err) {
							// probably an invalid DOM el
							res(false);
						}
					},
					err => log.e("error checking")
					);
			});
		}

		// fn must be async
		function applyToTickets(ticketArray, fn) {
			// could return a promise when all are resolved (Promise.resolveAll() or whatever)
			// todo GET to verify is %like%
			updateRequetVerificationToken(ticketArray[0])
				.then(res => {
					if (res == false) {
						log.e("failed to get request verification token");
					}
					ticketArray.forEach(ticketID => {
						checkRequestorNameBg(ticketID, "U of I Box (Alias)")
							.then(requestIsOk => {
								if (requestIsOk) {
									if (requestVerificationToken == null) {
										log.e(`Didn't update t#${ticketID} because requestVerificationToken is null!`);
									} else {
										fn(ticketID)
											.then(()=>log.i(`${ticketID} successfully modified.`))
											.catch(err=>log.e(ticketID+":", err));
									}
								} else {
									log.w(`Didn't update t#${ticketID} since the requestor couldn't be verified.`);
								}
							}, err => log.e("couldn't verify requestor", err));
					});
				});
		}
		applyToTickets([], closeBoxTicket);
		*/
    });
}
/**
 * Edits a ticket in the background
 * @param ticketID - The ticket to assign reponsibility for
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
function editBg(ticketID: TicketID, params: { requestor?: ITDXPerson, status?: Status, createdVia?: CreateMethod, requestArea?: SRA, responsible?: ITDXPerson, title?: string, description?: LimitedHTML }): Promise<void> {
    return new Promise((res, rej) => {
        // return rej("Not fully implemented");
        fetch(BASE_URL + "/Apps/40/Tickets/Edit?TicketID=" + ticketID)
            .then(verifyFetchSuccess)
            .then(getDomFromText)
            .then(dom => {
                /*// find __RequestVerificationToken
                const rvt = dom.querySelectorAll('body > form[action="/TDNext/Apps/40/Tickets/Edit?ticketID='+ticketID+'"] > input[name="__RequestVerificationToken"]');
                if (rvt === null || rvt.value === null) {
                  log.w("Don't have all the form data necessary: Request will fail!"); // just a w for now. will e upon net req
                }*/

                if (params.description !== undefined) {
                    let allowedTags = DEFAULT_ALLOWED_TAGS;
                    try {
                        const wsiwygScriptEl = dom.querySelector("#attribute138-grp > script:nth-child(8)");
                        if (wsiwygScriptEl === null) {
                            throw new DomParseError();
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

                // todo clean this up
                const typescriptIsAnnoyingSometimes: Record<string, string> = {};
                const existingData: Record<string, string> = Array.from(dom.querySelectorAll("input[name]")).reduce((data, input) => {
                    const inputValue = input.getAttribute("value");
                    if (inputValue !== null) {
                        // input has an attribute for name based on querySelectorAll
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        data[input.getAttribute("name")!] = inputValue;
                    }
                    return data;
                }, typescriptIsAnnoyingSometimes);



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
                fetch(BASE_URL + "/Apps/40/Tickets/Edit?TicketID=" + ticketID, {
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


/**
 * Verifies the requestor name of a ticket
 *
 * **Do not use this function.** It is very janky.
 * Refactor it to check the requestor's name or email instead.
 */
export async function checkRequestorNameBg(ticketID: TicketID, requestorName: string) {
	return new Promise((res, rej) => {
		fetch(getTicketViewUrl(ticketID))
			.then(verifyFetchSuccess)
			.then(getDomFromText)
			.then(dom => {
					try {
						res(dom.querySelector("div.panel-person-card")?.innerHTML.indexOf(requestorName) !== -1);
					} catch (err) {
						// probably an invalid DOM el
						res(false);
					}
				},
				() => rej(FetchErrorMessage.NETWORK_ERROR)
			);
	});
}

/**
 * Returns a value from the details of a ticket, or returns undefined.
 * Must be in the "Details" section of a ticket.
 * Case-sensitive.
 *
 * @remarks
 * Will get ticket values in the Details section only.
 * Will return the value as a string.
 * Also can return the Description entry.
 * Will **not** return Tags.
 * May include internal `\n`s, which can be stripped with a utility
 *
 * @todo refactor this to return all data about a ticket
 * 
 * @see {@link getTicketStatusBg}
 */
export async function getTicketDatumBg(ticketID: TicketID, fieldValue: string): Promise<string | undefined> {
	return new Promise((res, rej) => {
		fetch(getTicketViewUrl(ticketID))
			.then(verifyFetchSuccess)
			.then(getDomFromText)
			.then(dom => {
				//const sectionToSearchIn = dom.querySelector("#divDetails");
				const sectionToSearchIn = dom.querySelector("#divContent")?.children[0]?.children[0];
				if (!sectionToSearchIn || !(sectionToSearchIn instanceof HTMLElement)) {
					return rej(new DomParseError());
				}
				const dets = getTicketDatumsRecursively(sectionToSearchIn);
				res(dets[fieldValue]);
			},
			() => rej(FetchErrorMessage.NETWORK_ERROR)
		);
	});
}
/**
 * Gets the current status of the ticket
 */
export async function getTicketStatusBg(ticketID: TicketID): Promise<string | undefined> {
	return new Promise((res, rej) => {
		fetch(getTicketViewUrl(ticketID))
			.then(verifyFetchSuccess)
			.then(getDomFromText)
			.then(dom => {
                // shouldn't need trimming, but just in case
                //res(dom.querySelector(".status")?.textContent?.trim());
                res(dom.querySelector("#thTicket_lblStatus")?.textContent?.trim());
			},
			() => rej(FetchErrorMessage.NETWORK_ERROR)
		);
	});
}

/**
 * Returns the ticket datums, given the Details element
 * by searching recursively
 *
 * Will return the glob of text following the headings,
 * which may include line feeds
 *
 * @internalRemarks
 * Looks for the structure div > (span.control-label + div)
 *
 * Yes, I know it's "data."
 */
export function getTicketDatumsRecursively(node: HTMLElement): Record<string, string> {
	let results: Record<string, string> = {};

	for (const child of node.children) {
		const child0 = child.children[0];
		const child1 = child.children[1];
        if ((child instanceof HTMLElement && child0 instanceof HTMLElement)) { // should always be true
            if (
                child0 !== undefined && child0.nodeName === "SPAN" && child0.className === "control-label"
                && child1 !== undefined && child1.nodeName === "DIV"
            ) {
                if (child0.textContent !== null) {
                    results[child0.textContent.trim()] = child1.textContent?.trim() ?? "";
                }
                // else: empty datum key. do not insert
            } else {
                results = { ...results, ...getTicketDatumsRecursively(child) };
            }
        }
	}

	return results;
}
