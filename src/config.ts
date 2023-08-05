/**
 * The base URL of TDX to use for all TDX network requests
 *
 * @remarks
 * Does not include the common /TDNext/Apps/40 but only /TDNext
 *
 * Set explicitly on the help.uillinois.edu domain
 * 
 * @internalRemarks
 * Includes trailing /TDNext so that it can be switched to /SBTDNext for testing
 *
 * Could make a tdNextUrl() function to ensure preceding /
 * doesn't cause issues.
 * window.location.origin + "/TDNext"; //window.location.protocol + "//" + window.location.host0
 */
export const BASE_URL = "https://help.uillinois.edu/" + (process.env.NODE_ENV === "development" ? "SBTDNext" : "TDNext");

/**
 * The URL of Cerebro to use for all Cerebro network requests and redirects
 * 
 * @remarks
 * Includes a trailing slash,
 * for purposes of proper content script URL matching
 */
export const CEREBRO_URL = "https://cerebro.techservices.illinois.edu/";
