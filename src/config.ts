/**
 * The base URL of TDX to use for all TDX network requests
 *
 * @remarks
 * Does not include the common /TDNext/Apps/40 but only /TDNext
 *
 * @internalRemarks
 * Includes trailing /TDNext so that it can be switched to /SBTDNext for testing
 *
 * Could make a tdNextUrl() function to ensure preceding /
 * doesn't cause issues.
 */
export const BASE_URL = window.location.origin + "/TDNext"; //window.location.protocol + "//" + window.location.host