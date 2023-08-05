import * as browser from "webextension-polyfill";

/**
 * Adds the TkAst logo to a page
 * as an ovelay in the bottom right corner.
 */
export function addTkAstLogoToPage() {
	const logo = document.createElement("img");
    logo.src = browser.runtime.getURL("img/icon.svg");
    logo.style.width = "70px";
    logo.style.position = "fixed";
    logo.style.right = "15px";
    logo.style.bottom = "10px";
    logo.style.pointerEvents = "none";
    logo.style.opacity = "0.6";
    document.body.appendChild(logo);
}