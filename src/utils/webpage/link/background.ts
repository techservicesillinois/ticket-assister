import { PIPELINE_TO_BACKGROUND_SCRIPT, sendMessage } from "./interface";

/**
 * Sends {@param message} to the background script
 * for processing
 */
export const sendMessageToBackground: (message: Object) => Promise<any> = async message => sendMessage(PIPELINE_TO_BACKGROUND_SCRIPT, message);