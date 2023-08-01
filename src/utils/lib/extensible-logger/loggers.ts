import { Transport, TransportConsole } from "./transports";

/**
 * The level of logging
 * 
 * Implementations may have lower levels (e.g. Debug) include higher levels (e.g. Critical)
 * in their output.
 */
export enum LogLevel {
    Debug = 0,
    Info = 1,
    Warning = 2,
    Error = 3,
    Critical = 4, // app-crashing type error
}
/**
 * Returns a string representation of a {@link LogLevel}
 * 
 * Will be lowercase.
 */
export function readableLogLevel(logLevel: LogLevel): string {
    switch (logLevel) {
        case LogLevel.Debug:
            return "debug";
        case LogLevel.Info:
            return "info";
        case LogLevel.Warning:
            // shorter version fits nicer within tabs
            return "warn";
        case LogLevel.Error:
            return "error";
        case LogLevel.Critical:
            // shorter version fits nicer within tabs
            return "crit";
    }
}

// todo maybe pass current URL as well
// todo pass file (and function if possible) as well
export class Logger {
    #transports: Set<Transport> = new Set<Transport>();
    /**
     * The level of output to send log messages at
     * 
     * @remarks
     * All calls to send log messages (e.g. {@link Logger.i})
     * will only call {@link Transport.handleMessage}
     * on each of the {@link this.#transports} instances
     * if the log message is of equal to or higher severity than this value
     * 
     * @todo Refactor this somehow so that each transport has its own verbosityLevel.
     * Either store as a member variable of Transport or store the transports
     * as a Set<Pair<Transport, LogLevel>> instead.
     * Then, create methods to change the log level of each individual transport.
     */
    verbosityLevel: LogLevel = LogLevel.Info;
    /**
     * Creates a new Logger.
     * Stores an array of transports to send log messages to.
     * @param transport - A transport to deliver messages to
     * @param transports - An array of transport to deliver messages to
     * If neither `transport` nor `transports` are provided, a default {@link TransportConsole} will be used
     */
    constructor();
    constructor(transport: Transport);
    constructor(transports: Transport[]);
    constructor(arg?: Transport | Transport[]) {
        if (arg != null) {
            if (Array.isArray(arg)) {
                this.#transports = new Set<Transport>(arg);
            } else { //if (isTransport(arg)) // todo maybe user defined type guards        
                this.#transports.add(arg);
            }
        } else {
            this.#transports.add(new TransportConsole());
        }
        this.#transports.forEach(t => {
            if (t.validationError() !== null) {
                throw new Error("Not all transports are valid: " + t.validationError());
            }
        });
    }
    /**
     * Logs a message of severity {@link LogLevel.Debug} to all transports
     * @param message - The message to send
     */
    d(message: string) {
        if (this.verbosityLevel <= LogLevel.Debug)
            this.#transports.forEach(t => t.handleMessage(message, LogLevel.Debug));
    }
    /**
     * Logs a message of severity {@link LogLevel.Info} to all transports
     * @param message - The message to send
     */
    i(message: string) {
        if (this.verbosityLevel <= LogLevel.Info)
            this.#transports.forEach(t => t.handleMessage(message, LogLevel.Info));
    }
    /**
     * Logs a message of severity {@link LogLevel.Warning} to all transports
     * @param message - The message to send
     */
    w(message: string) {
        if (this.verbosityLevel <= LogLevel.Warning)
            this.#transports.forEach(t => t.handleMessage(message, LogLevel.Warning));
    }
    /**
     * Logs a message of severity {@link LogLevel.Error} to all transports
     * @param message - The message to send
     */
    e(message: string) {
        if (this.verbosityLevel <= LogLevel.Error)
            this.#transports.forEach(t => t.handleMessage(message, LogLevel.Error));
    }
    /**
     * Logs a message of severity {@link LogLevel.Critical} to all transports
     * @param message - The message to send
     */
    crit(message: string) {
        // this.verbosityLevel <= LogLevel.Crit is always true
        this.#transports.forEach(t => t.handleMessage(message, LogLevel.Critical));
    }
}