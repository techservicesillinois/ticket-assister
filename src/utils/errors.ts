/**
 * Used when there is an error in parsing the DOM,
 * due to an unexpected DOM structure.
 * 
 * This is typically due to being on the incorrect page while a foreground script is ran,
 * or due to an unexpected change in a webpage's structure.
 * 
 * @remarks
 * Used to make safe type guards.
 */
export class DOMParseError extends Error {}