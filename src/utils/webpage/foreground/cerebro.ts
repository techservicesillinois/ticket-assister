import { DOMParseError } from "../../errors";
import { noResults, emailDeliveryTypo, valueFor, hasAtLeastOne, inboxExists } from "../parser/cerebro";

/*
function redirectPost(path: string, params: FormData) {
  const form = document.createElement('form');
  form.method = "POST";
  form.action = path;

  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      const hiddenField = document.createElement('input');
      hiddenField.type = 'hidden';
      hiddenField.name = key;
      hiddenField.value = params[key];

      form.appendChild(hiddenField);
    }
  }

  document.body.appendChild(form);
  form.submit();
}

export function openPageWithUINOrNetID(uinOrNetID: string) {
  const formData = new FormData();
  formData.append("uin_or_netid", uinOrNetID);
  formData.append("submit", "Get User Information");
  formData.append("csrfmiddlewaretoken", "todo");
  // it was then that I realized
  // the user would have to first be on cerebro.techservices.illinois.edu
  // in order to pull this token
  redirectPost("cerebro.techservices.illinois.edu", formData);
}
*/

/**
 * Looks up a NetID or UIN
 * when on the Cerebro page
 * @throws a {@link DOMParseError} if the page is malformatted (typically not on the proper page)
 *
 * @remarks
 * MUST be on the proper page or will throw and nothing will happen.
 *
 * Submits the NetID or UIN form on the page
 * to redirect and get the data.
 */
export function lookupNetIDOrUIN(uinOrNetID: string) {
    if (!(window.location.host === "cerebro.techservices.illinois.edu" && window.location.pathname === "/")) {
        throw new Error("Not at the correct URL.");
    }
    const form = document.querySelector("form");
    if (form === null) {
        throw new DOMParseError();
    }
    const searchInput: HTMLFormElement | null = form.querySelector('input[name="uin_or_netid"]');
    const submitInput: HTMLFormElement | null = form.querySelector('input[type="submit"]');
    if (searchInput === null || submitInput === null) {
        throw new DOMParseError();
    }
    searchInput.value = uinOrNetID;
    submitInput.click();
}

/**
 * 
 */
interface CerebroDatum {
    /**
     * location of the informatio
     * Denoted by box/entry
     */
    location: string,
    /*l**
     * value of the information
     * Supplied in string representation.
     *l
    value: string,*/
    /**
     * Note regarding the value contents of the datum
     * May be a warning or an error message, depending on how the Datum is passed
     */
    note: string,
}

/**
 * Gets key info about a user.
 *
 * Assumes on the proper Cerebro page.
 *
 * @remarks
 * Returns the user's types (minus person and phone)
 * and relavent roles.
 */
export function getWhiteInfo() {
    if (noResults()) {
        throw new Error("NetID or UIN not found");
    }
    // todo
}
/**
 * Gets yellow flag info about a user.
 * These are things that may cause an issue for the user, but not necessarily.
 *
 * Assumes on the proper Cerebro page.
 *
 * @remarks
 * Returns the following information:
 * if create date < 1wk, most recent claim date < 1d,
 * if Box diabled, if Google Apps disabled,
 * if claim eligible,
 * if an inbox rule starts with "{'redirectTo':"
 */
export function getYellowInfo() {
    if (noResults()) {
        throw new Error("NetID or UIN not found");
    }
    // todo
}
/**
 * Gets red flag info about a user.
 * These are things that are likely to cause an issue for the user based on their account types.
 *
 * Assumes on the proper Cerebro page.
 *
 * @remarks
 * Returns the following information:
 * if student/staff/retired/allied and AD disabled,
 * if student/staff/retired and inbox not found or EDE blank,
 * if AD account locked out,
 * if Password Last Set never or <15 min ago,
 * if EDE email delivery is close to @g.illinois.edu or @mx.uillinois.edu but is spelled wrong
 */
export function getRedInfo(): Array<CerebroDatum> {
    if (noResults()) {
        // white-hot flag
        throw new Error("NetID or UIN not found");
    }
    const redInfo: Array<CerebroDatum> = [];
    if (emailDeliveryTypo(valueFor("Central Registry", "Illinois Email Delivery"))) {
        redInfo.push({
            location: "Central Registry/Illinois Email Delivery",
            note: "Typo detected",
        });
    }
    if (valueFor("Active Directory (AD)", "Account Status") !== "enabled") {
        redInfo.push({
            location: "Active Directory (AD)/Account Status",
            note: "Account is not enabled",
        });
    }
    const accountTypes = valueFor("Central Registry", "Type").split(" ").map(actType => actType.trim()).filter(actType => actType !== '');
    const shouldBeEnabled = ["student", "staff", "retired", "allied"];
    if (hasAtLeastOne(accountTypes, shouldBeEnabled)) {
        if (valueFor("Active Directory (AD)", "AD Account Lockout") !== "No") {
            redInfo.push({
                location: "Active Directory (AD)/AD Account Lockout",
                note: "Account is locked out",
            });
        }
    }
    const shouldHaveEmail = ["student", "staff", "retired"];
    if (hasAtLeastOne(accountTypes, shouldHaveEmail)) {
        if (valueFor("Central Registry", "Illinois Email Delivery	") === "") { // todo: says "None" ?
            redInfo.push({
                location: "Active Directory (AD)/Account Status",
                note: "Delivery is blank",
            });
        }
        if (!inboxExists()) {
            redInfo.push({
                location: "Exchange Online (Office 365)/Inbox Rules",
                note: "Inbox does not exist",
            });
        }
    }

    if (valueFor("Active Directory (AD)", "Password Last Set") === "Never") {
        redInfo.push({
            location: "Active Directory (AD)/Password Last Set",
            note: "Password is not set",
        });
    } else {
        const pwSetOn = new Date(valueFor("Active Directory (AD)", "Password Last Set"));
        const FIFTEEN_MINUTES = 15 * 60 * 1000; // ms
        if (Date.now() - pwSetOn.getTime() < FIFTEEN_MINUTES) {
            redInfo.push({
                location: "Active Directory (AD)/Password Last Set",
                note: "Password was last set <15 min ago",
            });
        }
    }
    try {
        if (valueFor("Enterprise ID Assignments", "UIUC (Urbana) NetID") === "No NetID found") {
            // also will have bad "Illinois (Urbana) NetID" field
            redInfo.push({
                location: "Enterprise ID Assignments/UIUC (Urbana) NetID",
                note: "No UIUC NetID. Probably a mismatch",
            });
        }
    } catch {
        // good. should not find that field
    }

    return redInfo;
}
