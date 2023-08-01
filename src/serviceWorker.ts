import { log } from "utils/logger";

import a from "utils/services/updateContentScripts";
try {
    a();
} catch (e) {
    log.crit(`SW component utils/services/updateContentScripts crashed: ${e.message}`);
}
import b from "utils/services/middleman";
try {
    b();
} catch (e) {
    log.crit(`SW component utils/services/updateContentScripts crashed: ${e.message}`);
}
