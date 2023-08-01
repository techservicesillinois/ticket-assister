// todo fix import to be absolute
import { generateLogFileURI } from "../utils/logger";

/**
 * Generates a button which will download a log file on click.
 */
export function downloadLogFileButton() {
    const downloadButton = document.createElement("button");
    downloadButton.textContent = "Generate log file";
    downloadButton.classList.add("download-logs");
    downloadButton.addEventListener("click", async () => {
        const tmpButton = document.createElement("a");
        tmpButton.setAttribute("href", await generateLogFileURI());
        tmpButton.setAttribute("download", `tkast_${new Date().toISOString()}.log`);
        tmpButton.click();
        /*tmpButton.style.display = "none";
        document.body.appendChild(tmpButton);
        tmpButton.addEventListener("click", () => {
            document.body.removeChild(tmpButton);
        })*/
    });

    return downloadButton;
}