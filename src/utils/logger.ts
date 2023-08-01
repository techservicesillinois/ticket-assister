import { Logger, LogLevel } from "utils/lib/extensible-logger/loggers";
import { TransportConsole, TransportStorage } from "utils/lib/extensible-logger/transports";

// Logger configuration
const storageTransport = new TransportStorage();
// export the Storage transport's generateLogFileURI so we can download logs
export const generateLogFileURI = storageTransport.pubGenerateLogFileURI();
export const log = new Logger([new TransportConsole(), storageTransport]);
log.verbosityLevel = process.env.NODE_ENV === "development" ? LogLevel.Debug : LogLevel.Info;
// now, use log.i(), etc
