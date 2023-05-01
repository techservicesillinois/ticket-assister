/**
 * Verifies that a request was successfull
 * @param res - the response
 * @returns the text representation of res through `res.text()`
 * @throws explicitly if res is not ok
 * @throws implicitly if there was an error parsing into text
 */
export function verifyFetchSuccess(res: Response) {
    if (!res.ok) {
        throw new Error("Res not ok");
    }
    return res.text();
}

/**
 * @returns A Document DOM of the text respresentation
 */
export function getDomFromText(text: string): Document {
    return (new DOMParser()).parseFromString(text, "text/html");
}

/**
 * Common error messages
 * caused when using a {@link fetch} call
 */
export enum FetchErrorMessage {
    /**
     * Indicates a network error
     */
    NETWORK_ERROR,
    /**
     * Indicates a unexpected and unhandleable response from the server
     * Perhaps the server has been updated and is giving a different response.
     */
    UNEXPECTED_RESPONSE,
}