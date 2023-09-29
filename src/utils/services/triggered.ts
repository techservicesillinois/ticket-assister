import * as browser from "webextension-polyfill";

/**
 * 
 */
export interface CompletedRequest {
    status: "ok" | "error",
    message: string,
}

/**
 * For actions triggered to run in the background
 */
export async function handle(from: browser.Tabs.Tab, request: string, data: Object): Promise<CompletedRequest> {
    switch (request) {
        case "close":
            if (from.id === undefined) {
                return {
                    status: "error",
                    message: "unlocatable sender",
                };
            }
            try {
                await browser.tabs.remove(from.id);
                return {
                    status: "ok",
                    message: "done",
                };
            } catch {
                return {
                    status: "error",
                    message: "failed",
                };
            }
            // no break: all paths return
        default:
            return {
                status: "error",
                message: "unknown request",
            }
    }
}