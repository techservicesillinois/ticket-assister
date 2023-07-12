import { Logger, LogLevel } from "utils/lib/extensible-logger/loggers";
import { TransportConsole } from "utils/lib/extensible-logger/transports";

// Logger configuration
export const log = new Logger([new TransportConsole()]);
log.verbosityLevel = LogLevel.Debug;
// now, use log.i(), etc
