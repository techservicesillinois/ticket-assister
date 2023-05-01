import { Logger, LogLevel } from "./lib/extensible-logger/loggers";
import { TransportConsole } from "./lib/extensible-logger/transports";

// Logger configuration
export const log = new Logger([new TransportConsole()]);
log.verbosityLevel = LogLevel.Debug;
// now, use log.i(), etc
