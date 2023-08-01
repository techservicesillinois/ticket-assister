import { ITDXPerson } from "./person";

/**
 * A string of HTML, contrained with limited tags and attributes.
 * 
 * Used in TDX WYSIWYG input fields.
 */
export type LimitedHTML = string;

/**
 * A TDX Ticket ID number, as used on {@link} BASE_URL}
 */
export type TicketID = number;
// todo maybe class Ticket with data members pulled from GETting the ticket

/**
 * Options to be set when assigning to a new group,
 * detailing the message to be sent and if the assigned party should be notified
 * These comments are recorded in the ticket feed.
 */
export interface IAssignCommentOptions {
    text: string,
    notify: boolean,
}


/**
 * Things included in a new TDX comment
 */
export interface ICommentOptions {
    isPrivate: boolean,
    /**
     * Array of people to notify
     * This should only be contacts on the ticket
     * (e.g. Responsible, Responsible Group, Requestor, Creator, Contact)
     * 
     * @internalRemarks
     * from select[multiple="multiple] > option
     */
    notify: Array<ITDXPerson>,
    /**
     * HTML data of comment
     * Do not wrap in outer <p> or <div>
     */
    comments: LimitedHTML,
}
