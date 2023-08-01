/**
 * A feature that runs on a page
 * and can be turned on and off in the settings menu
 */
export interface ToggleableFeature {
    /**
     * Name of the feature
     * to be presented in the settings menu
     *
     * Separate with slashes (`/`) to make a submenu,
     * or to organize similar settings together
     *
     * @remarks
     * The settings menu will build a tree based on the slashes in the name,
     * displaying each subtree heading as it is written before the next slash.
     *
     * The final string after the last slash is the setting name displayed.
     */
    name: string,
    /**
     * Description of the feature
     * to be presented in the settings menu
     */
    description: string,
    /**
     * An array of the content scripts to be ran
     * when the feature is active
     */
    contentScripts: Array<{
        /**
         * URL path for which the feature is to be run on
         *
         * Supports the `*` wildcard
         */
        url: string,
        /**
         * The filesystem path to the content script file
         * Relative from `contentScripts/`
         *
         * Should include the file extension.
         *
         * To be ran in the foreground
         * whenever `url` is navigated to
         * and the feature is enabled
         *
         * @remarks
         * The associated script should have the first line like
         * // <rule name="rule.name">
         */
        script: string,
    }>,
}