/**
 * Adds a tooltip with {@@param message}
 * when hovering over {@param toElement}
 */
export function addTooltip(toElement: HTMLElement, message: string) {
    const tooltip = document.createElement("div");
    tooltip.textContent = message;

    // todo just import a css class
    // stored in the extension
    tooltip.style.position = "fixed";
    tooltip.style.padding = "5px";
    tooltip.style.backgroundColor = "#444";
    tooltip.style.border = "1px solid #222";
    tooltip.style.boxShadow = "-2px 2px 5px rgb(0 0 0 / 50%)";
    tooltip.style.color = "white";
    tooltip.style.borderRadius = "5px";

    tooltip.style.transition = "opacity 0.4s, visibility 0.4s";
    const show = () => {
        tooltip.style.opacity = "1";
        tooltip.style.visibility = "visible";
    };
    const hide = () => {
        tooltip.style.opacity = "0";
        tooltip.style.visibility = "hidden";
    };

    toElement.addEventListener("mouseover", show);
    toElement.addEventListener("mouseout", hide);
    //tooltip.addEventListener("mouseover", show); // in case of overlapping
    tooltip.style.pointerEvents = "none";
    toElement.addEventListener("mousemove", (evt) => {
        tooltip.style.left = `${evt.clientX + 12}px`;
        tooltip.style.top = `${evt.clientY - 8}px`;
    });

    toElement.style.cursor = "help";

    //toElement.after(tooltip);
    document.body.appendChild(tooltip);
}