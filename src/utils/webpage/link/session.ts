/**
 * The key in {@link localStorage} to be used
 * for the close window on close ticket rule
 * 
 * @remarks
 * Must be used with localStorage to be cross-tab.
 * See https://stackoverflow.com/a/20325870/8804293 for details
 */
export const CLOSE_TICKET_KEY = "tkast_ticket-closed";

/**
 * The max delay to allow between sends
 */
export const MAX_REFRESH_TIME_MS = 1000;