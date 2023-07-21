/**
 * Adds the TkAst logo to a page
 * as an ovelay in the bottom right corner.
 */
export function addTkAstLogoToPage() {
	const logo = document.createElement("img");
    logo.src = ""; // todo
    logo.style.width = "100px";
    logo.style.position = "fixed";
    logo.style.right = "25px";
    logo.style.bottom = "25px";
    logo.style.pointerEvents = "none";
    document.body.appendChild(logo);
}