import { FetchErrorMessage, getDomFromText, verifyFetchSuccess } from "../../fetch";
import { DOMParseError } from "../../errors";
import { BASE_URL } from "../../../config";

/**
 * A basic TDX Person containsing an id and a name.
 * Does not contain an email.
 * @see {@link ITDXPerson}
 */
// todo maybe make `type`s for id, name, email, UIN, NetID
export interface ITDXPersonBasic {
    /**
     * A UUID of the person, as stored in TDX.
     * 
     * @remarks
     * Should be locatable at BASE_URL/TDNext/Apps/People/PersonDet.aspx?U={id}
     */
    id: string,
    /**
     * A readable full name of the person, as from their profile page.
     */
    name: string,
}
/**
 * A TDX Person containing all of {@link ITDXPersonBasic}'s properties as well as an `email` property.
 * @see {@link TDXPerson}, {@link ITDXPersonBasic}
 */
export interface ITDXPerson extends ITDXPersonBasic {
    /**
     * An email of the person, as from their profile page.
     *
     * @remarks
     * "Primary Email" in TDX
     */
    email: string,
    /**
     * The UIN of the person, as from their profile page.
     * Should match UIN in Central Registry.
     *
     * @remarks
     * "Organizational ID" in TDX
     */
    uin: number,
    /**
     * The NetID of the person, as from their profile page.
     * Should match NetID in Central Registry.
     *
     * @remarks
     * "Alternate ID" in TDX
     */
    netid: string,
}
/**
 * An interfaceable TDX Person containing all of {@link ITDXPersonBasic}'s properties
 * Can be constructed from a variety of data values using the static `fromX()` methods
 * 
 * @example
 * const person: TDXPerson = TDXPerson.fromNetID("emock3");
 * console.log(`${person.name}'s email is ${person.email}.`);
 * @see {@link TDXPerson}
 */
export class TDXPerson implements ITDXPerson {
    readonly id: string;
    readonly name: string;
    readonly email: string;
    readonly uin: number;
    readonly netid: string;
    static #NETID_DOMAINS = ["illinois.edu", "uillinois.edu", "mx.uillinois.edu", "uic.edu", "uis.edu"]; //private static
    /**
     * Gets this person's NetID, if possible
     * @returns the NetID
     * @throws an {@link Error} if the NetID does not exist
     */
    get netId(): string {
        const splitIdx = this.email.indexOf("@");
        const domain = this.email.substring(splitIdx + 1);
        if (!TDXPerson.#NETID_DOMAINS.includes(domain)) {
            throw new Error("No NetID for this person.");
        }
        return this.email.substring(0, splitIdx);
    }
    /**
     * Creates a new TDXPerson.
     * Trust that all of its data members are valid
     * (as in, the data members are an accurate picture of what is on the TDX server)
     * 
     * Typically, a TDXPerson will be constructed from {@link TDXPerson.fromId()} or a related method.
     * @param person - The data values to instantiate the TDXPerson with
     * @see {@link TDXPerson.fromId()}, {@link TDXPerson.fromEmail()}, {@link TDXPerson.fromName()}, {@link TDXPerson.fromNetId()}
     */
    constructor(person: ITDXPerson) {
        ({ id: this.id, name: this.name, email: this.email, uin: this.uin, netid: this.netid } = person);
    }
    /**
     * Gets a TDXPerson from the person's TDX Id
     * 
     * @remarks
     * Makes a network request to fill out the other data values.
     * Returns an {@link TDXPerson} from its constructor, passing in the values for an {@link ITDXPerson}
     * @param id - the TDX ID of a person
     * @returns a promise
     * - Resolves to the {@link TDXPerson} if possible
     * - Rejects if no match or network error with an {@link Error}
     */
    static async fromId(id: string): Promise<TDXPerson> {
        return new Promise((res, rej) => {
            /*fetch(BASE_URL + "/TDNext/Apps/People/PersonDet.aspx?U="+id)
              .then(verifyFetchSuccess)
              .then(getDomFromText)
              .then(dom => {
                if (window.location.href === BASE_URL + "/TDNext/Apps/Shared/ItemNotFound.aspx?ItemType=User") {
                  // redirected
                  rej("Not found"); // or could return null
                }
                try {
                  res(new TDXPerson({
                    id: id, // inherently
                    name: dom.querySelector("h1")!.textContent!.trim(),
                    // or could look at the visible <span>s preceding these fields
                    email: dom.querySelector("div#ctl00_cphMain_divContactInfo div#ctl00_cphMain_divPrimaryEmail > div span#ctl00_cphMain_lblPrimaryEmail")!.textContent!.trim(),
                    uin: parseInt(dom.querySelector("div#ctl00_cphMain_divOrganizationalID > div")!.textContent!.trim()),
                    netid: dom.querySelector("div#ctl00_cphMain_divAlternateID > div")!.textContent!.trim(),
                  }));
                } catch {
                  // probably a DOM error
                  rej(FetchErrorMessage.UNEXPECTED_RESPONSE);
                }
              }, err => rej(FetchErrorMessage.NETWORK_ERROR));*/
            fetch(BASE_URL + "/TDNext/Apps/40/Tickets/Requestor?requestorUid=" + id + "&FormId=107")
                .then(res => {
                    if (!res.ok) {
                        throw new Error("res not ok");
                    }
                    return res.json();
                })
                .then(res => res.json())
                .then(async json => {
                    // also gets json.requestor.jsondata { email, phone, accountname }
                    return await TDXPerson.fromBasic({
                        id: json.requestor.jsondata.id,
                        name: json.requestor.jsondata.name,
                    })
                        .catch(e => rej(e));
                }, () => rej(FetchErrorMessage.NETWORK_ERROR));
        });
    }
    /**
     * Gets a TDXPerson from the a search: the person's TDX primary email, name, uin, or netid
     * 
     * @remarks
     * Makes a network request to fill out the other data values.
     * Returns an {@link TDXPerson} using the `TDXPerson` constructor,
     * passing in the values for an {@link ITDXPerson} which were obtained from the network request.
     * @param search - the TDX primary email of a person
     * @returns a promise
     * - Resolves to the {@link TDXPerson} if possible
     * - Rejects if no match, multiple matches, or network error with an {@link Error}
     *
     * @privateRemarks
     * This can be easily converted to return a ITDXPersonBasic
     * while eliminating another network request
     * (won't need to call TDXPerson.fromBasic which calls TDXPerson.fromID which `fetch`es).
     *
     * Instead, could POST to BASE_URL/TDNext/Apps/40/Shared/UserLookupMulti.aspx?AllowCurrentUser=1&IncludeAllServiceAccounts=1&IncludeAllUsers=1&NameField=lu_text_1&IDField=filter_value_1&Selected=undefined
     * to get comparable data
     */
    private static async search(query: string): Promise<TDXPerson> {
        return new Promise((res, rej) => {
            const formData = new FormData();
            formData.set("searchText", query);
            formData.set("accoundIDs", "");
            formData.set("primaryGroupIDs", "");
            formData.set("phoneNumber", "");
            formData.set("isActiveStatus", "");
            formData.set("userTypeFilters", "27"); // all people types (User, Customer)
            fetch(BASE_URL + "/TDNext/Apps/People/PeopleSearch?page=",
                {
                    method: "POST",
                    body: formData,
                })
                .then(verifyFetchSuccess)
                .then(getDomFromText)
                .then(async dom => {
                    // todo assert this table follows the anticipated structure (check thead labels)
                    try {
                        const resultsCollection = dom.querySelector("main div.grdItems-container > table > tbody")?.children;
                        if (resultsCollection === undefined) {
                            throw new DOMParseError();
                        }
                        if (resultsCollection.length !== 1) {
                            // ambiguous
                            return rej("Multiple results");
                        }
                        // id is also embedded in resultsCollection[0]!.children[0]!.getAttribute("onclick")
                        const href = resultsCollection[0]?.children[0]?.getAttribute("href");
                        if (href === null) {
                            throw new DOMParseError();
                        }
                        const id = href.substring(href.indexOf("?") + 1);
                        //const email = resultsCollection[0]!.children[1]!.textContent!.trim();
                        const name = resultsCollection[0]?.children[0]?.textContent?.trim();
                        if (name === undefined) {
                            throw new DOMParseError();
                        }
                        // no UIN or NetID here. Need to get a full TDXPerson
                        return await TDXPerson.fromBasic({ id, name }).catch(e => rej(e));
                    } catch {
                        // assume DOM error
                        rej(FetchErrorMessage.UNEXPECTED_RESPONSE);
                    }
                }, () => rej(FetchErrorMessage.NETWORK_ERROR));
        });
    }
    /**
     * Gets a TDXPerson from the person's TDX primary email
     * Only resolves if there is an exact match.
     * 
     * @remarks
     * Makes a network request to fill out the other data values.
     * Returns an {@link TDXPerson} using the `TDXPerson` constructor,
     * passing in the values for an {@link ITDXPerson} which were obtained from the network request.
     * @param email - the TDX primary email of a person
     * @returns a promise
     * - Resolves to the {@link TDXPerson} if possible
     * - Rejects if no match, multiple matches, inexact match, or network error
     * with an {@link Error}
     *
     * @privateRemarks
     * Uses {@link TDXPerson.search}, checking that the returned `TDXPerson` has the same email.
     */
    static async fromEmail(email: string): Promise<TDXPerson> {
        return new Promise((res, rej) => {
            this.search(email).then(personFound => {
                if (personFound.email !== email) {
                    // bad match
                    rej("No match");
                } else {
                    // good match
                    res(personFound);
                }
            })
                .catch(rej);
        });
    }
    /**
     * Gets a TDXPerson from the person's TDX name
     * Only resolves if there is an exact match.
     * 
     * @remarks
     * Makes a network request to fill out the other data values.
     * Returns an {@link TDXPerson} using the `TDXPerson` constructor,
     * passing in the values for an {@link ITDXPerson} which were obtained from the network request.
     * @param name - the name of a person, as listed in TDX
     * @returns a promise
     * - Resolves to the {@link TDXPerson} if possible
     * - Rejects if no match, multiple matches, inexact match, or network error
     * with an {@link Error}
     *
     * @privateRemarks
     * Uses {@link TDXPerson.search}, checking that the returned `TDXPerson` has the same name.
     */
    static async fromName(name: string): Promise<TDXPerson> {
        return new Promise((res, rej) => {
            this.search(name).then(personFound => {
                if (personFound.name !== name) {
                    // bad match
                    rej("No match");
                } else {
                    // good match
                    res(personFound);
                }
            })
                .catch(rej);
        });
    }
    /**
     * Gets a TDXPerson from the person's TDX UIN
     * Only resolves if there is an exact match.
     * 
     * @remarks
     * Makes a network request to fill out the other data values.
     * Returns an {@link TDXPerson} using the `TDXPerson` constructor,
     * passing in the values for an {@link ITDXPerson} which were obtained from the network request.
     * @param uin - the UIN of a person, as listed in TDX
     * @returns a promise
     * - Resolves to the {@link TDXPerson} if possible
     * - Rejects if no match, multiple matches, inexact match, or network error
     * with an {@link Error}
     *
     * @privateRemarks
     * Uses {@link TDXPerson.search}, checking that the returned `TDXPerson` has the same UIN.
     */
    static async fromUIN(uin: number): Promise<TDXPerson> {
        return new Promise((res, rej) => {
            this.search(uin.toString()).then(personFound => {
                if (personFound.uin !== uin) {
                    // bad match
                    rej("No match");
                } else {
                    // good match
                    res(personFound);
                }
            })
                .catch(rej);
        });
    }
    /**
     * Gets a TDXPerson from the person's NetID
     * 
     * @remarks
     * Tries to find a person by combining the NetID with different domains to form an email, including \@illinois.edu and \@uillinois.edu
     * Makes a network request to fill out the other data values.
     * Returns an {@link TDXPerson} from its constructor, passing in the values for an {@link ITDXPerson}
     * @param netid - the NetID of a person
     * @returns a promise
     * - Resolves to the {@link TDXPerson} if possible
     * - Rejects if no match or network error with an {@link Error}
     */
    static async fromNetID(netid: string): Promise<TDXPerson> {
        // todo check all TDXPerson.#NETID_DOMAINS, not just @illinois.edu
        return this.fromEmail(netid + "@illinois.edu");
    }
    /**
     * Generates a {@link TDXPerson} from a {@link ITDXPersonBasic}
     * 
     * @remarks
     * Makes a network request to fill out the other data values.
     * Uses the ID from the passed `person` to fill this out
     * @internalRemarks
     * Uses {@link TDXPerson.fromId()} to generate the person.
     * @param person - the TDX person. Only the `id` property is used
     * @returns a promise
     * - Resolves to the {@link TDXPerson} if possible
     * - Rejects if no match or network error with an {@link Error}
     */
    static async fromBasic(person: ITDXPersonBasic): Promise<TDXPerson> {
        // just overwrite name
        return this.fromId(person.id);
    }
}