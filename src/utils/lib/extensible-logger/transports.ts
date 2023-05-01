import { LogLevel } from "./loggers";

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
// todo make TransportFile: chrome extension file log which can be read later
// todo make TransportBeacon: sends data to log collector slipstream
