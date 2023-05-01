/**
 * @remarks
 * Almost always used with an appended /TDNext,
 * but some use cases may not need that.
 *
 * Could make a tdNextUrl() function to ensure preceding /
 * doesn't cause issues.
 *
 * @todo
 * Include /TDNext ?
 */
export const BASE_URL = window.location.origin; //window.location.protocol + "//" + window.location.host