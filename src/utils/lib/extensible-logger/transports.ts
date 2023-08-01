import { LogLevel, readableLogLevel } from "./loggers";
import * as browser from "webextension-polyfill";
import { getAllCustomRuleStatuses, getCurrentPreset } from "utils/rules/storage";
import { CUSTOM_PRESET } from "../../../rules/presets";

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
        console.log(`[${readableLogLevel(b)}] ${a}`);
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
    /**
     * Gets the data stored in the log file
     * 
     * @throws an {@link Error}
     * 
     * @internalRemarks
     * This must be public in order for this.generateLogFileURI to be publicably usable
     */
    async #getData(): Promise<Array<string>> {
        const rawData = await this.#STORAGE_AREA.get(this.#STORAGE_NAME);
        const parsedData = rawData[this.#STORAGE_NAME];
        if (parsedData instanceof Array) { //Array<string>
            return parsedData;
        }
        throw new Error("Invalid data stored");
    }
    async handleMessage(a: string, b: LogLevel): Promise<void> {
        // array of lines of logs
        /*let logData: Array<string>;
        try {
            logData = await this.#getData();
        } catch {
            logData = new Array<string>();
        }*/
        const logData: Array<string> = await (async () => {
            try {
                return await this.#getData();
            } catch {
                //log.w(`Failed to get log data properly... Overwriting log.`); // I hope that this isn't recursive...
                return new Array<string>();
            }
        })();
        const formattedDate = new Date().toLocaleDateString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, day: "2-digit", month: "2-digit", year: "2-digit" });
        logData.push(`${formattedDate} [${readableLogLevel(b)}]\t${a}`);
        if (logData.length > this.#STORAGE_LINES) {
            logData.shift();
        }
        this.#STORAGE_AREA.set({ [this.#STORAGE_NAME]: logData });
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
     */
    async generateLogFileURI() {
        // add last-minute data
        try {
            const cp = await getCurrentPreset();
            this.handleMessage(`Current preset is ${cp}`, LogLevel.Debug);
            if (cp === CUSTOM_PRESET) {
                this.handleMessage(`Custom preset statuses are ${await getAllCustomRuleStatuses()}`, LogLevel.Debug);
            }
        } catch {
            console.error("Failed to add current preset data to log file.");
        }
        const logData: Array<string> = await (async () => {
            try {
                return await this.#getData();
            } catch (e) {
                return new Array<string>(`Failed to get log data: ${e}`);
            }
        })();
        const stringRepresentation = logData.reduce((prev, curr) => prev += `${curr}\n`, "");
        return `data:text/plain;charset=utf-8,${encodeURIComponent(stringRepresentation)}`;
    }
    /**
     * A publically callable version of {@link generateLogFileURI}
     * available in different contexts.
     */
    pubGenerateLogFileURI() {
        return this.generateLogFileURI.bind(this);
    }
}
// todo make TransportBeacon: sends data to log collector slipstream
