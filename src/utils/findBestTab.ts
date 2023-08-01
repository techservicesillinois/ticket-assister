import type { Tabs } from "webextension-polyfill";

/**
 * Returns the tab that is the best to use in {@param tabs}
 * 
 * @remarks
 * favors:
 * 1. not incognito
 * 2. active
 * 3. pinned
 * 4. lowest index (is furthest to the left in browser)
 */
export function findBestTab(tabs: Array<Tabs.Tab>) {
    //return tabToUse = tabs.sort((tab1, tab2) => tab1.index - tab2.index)[0];
    return tabs.sort((tab1, tab2) => {
        // -1 => tab1 wins. 1 => tab2 wins
        if (tab1.incognito && !tab2.incognito) return 1;
        if (tab2.incognito && !tab1.incognito) return -1;
        if (tab1.active && !tab2.active) return -1;
        if (tab2.active && !tab1.active) return 1;
        if (tab1.pinned && !tab2.pinned) return -1;
        if (tab2.pinned && !tab1.pinned) return 1;
        return tab1.index - tab2.index;
    })[0];
}
