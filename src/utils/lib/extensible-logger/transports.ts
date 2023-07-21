import { LogLevel } from "./loggers";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const browser = require("webextension-polyfill");

/**
 * A method of delivering data to the user
 * Example instances include console logging and file writing
 */
export interface Transport {
    /**
     * Writes a message to the transport output stream
     * @param message - The message to send
     * @param lvl - The severity of the log message, to be conveyed arbitrarily
     */
    handleMessage(message: string, lvl: LogLevel): void;
    /**
     * Verifies that the transport is ready to use
     * e.g. files are opened and writable
     * @returns null if valid; an error if the transport is not valid
     */
    validationError(): Error | null;
}

/**
 * A transport interface using `window.console`
 */
export class TransportConsole implements Transport {
    handleMessage(a: string, b: LogLevel): void {
        console.log(`[${b}] ${a}`);
    }
    validationError() {
        // console always works
        return null;
    }
}
/**
 * A transport interface which writes out to localStorage
 * for later retrieval
 * 
 * Stores the last {@link TransportStorage.#STORAGE_QUOTA} lines,
 * which is 100 by default.
 * 
 * @remarks
 * "The quota limitation is approximately 10 MB"
 * 
 * Using storage.local over storage.session
 * because it is not exposed by default for content scripts
 * @todo
 */
export class TransportStorage implements Transport {
    #STORAGE_LINES = 100;
    #STORAGE_NAME = "logs";
    #STORAGE_AREA = browser.storage.local;
    handleMessage(a: string, b: LogLevel): void {
        // array of lines of logs
        const logData: Array<string> = this.#STORAGE_AREA.get(this.#STORAGE_NAME);
        const formattedDate = new Date().toLocaleDateString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, day: "2-digit", month: "2-digit", year: "2-digit" });
        logData.push(`${formattedDate} [${b}] ${a}`);
        if (logData.length > this.#STORAGE_LINES) {
            logData.shift();
        }
        this.#STORAGE_AREA.set(this.#STORAGE_NAME, logData);
    }
    validationError() {
        if (browser.storage.local === undefined) {
            // should not happen based on our manifest.json
            return new Error("No storage.local access.");
        }
        // set up
        return null;
    }
    /**
     * Generates a log file
     * 
     * @throws if there is an error parsing the log data
     * @todo
     */
    generateLogFileURI() {
        const logData: Array<string> = JSON.parse(this.#STORAGE_AREA.get(this.#STORAGE_NAME));
        const stringRepresentation = logData.reduce((prev, curr) => prev += `${curr}\n`, "");
        return `data:text/plain;charset=utf-8,${encodeURIComponent(stringRepresentation)}`;
    }
}
// todo make TransportBeacon: sends data to log collector slipstream
