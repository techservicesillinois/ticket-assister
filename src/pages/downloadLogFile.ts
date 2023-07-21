// todo fix import to be absolute
import { generateLogFileURI } from "../utils/logger";

/**
 * Generates a button which will download a log file on click.
 */
export function downloadLogFileButton() {
    const downloadButton = document.createElement("button");
    downloadButton.textContent = "Generate log file";
    downloadButton.classList.add("download-logs");
    downloadButton.addEventListener("click", () => {
        const tmpButton = document.createElement("a");
        tmpButton.setAttribute("href", generateLogFileURI());
        tmpButton.setAttribute("download", `tkast_log_${new Date().toISOString()}.txt`);
        tmpButton.click();
        /*tmpButton.style.display = "none";
        document.body.appendChild(tmpButton);
        tmpButton.addEventListener("click", () => {
            document.body.removeChild(tmpButton);
        })*/
    });

    return downloadButton;
}