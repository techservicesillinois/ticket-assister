/**
 * Listens for DOM changes on an element or its children
 * Runs the callback whenever a change is detected.
 *
 * @param watchEl the element to watch for DOM changes on
 * @param callback the callback to be ran on DOM change
 *
 * @remarks
 * Adapted from https://stackoverflow.com/a/14570614
 */
export const watchDOMChanges = (function(){
	const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

	return function(watchEl: Element, callback: () => void) {
		if (MutationObserver){
			const mutationObserver = new MutationObserver(callback);
			mutationObserver.observe(watchEl, { childList: true, subtree: true });
			return mutationObserver
		} else if (window.addEventListener) { // browser support fallback
			watchEl.addEventListener("DOMNodeInserted", callback, false);
			watchEl.addEventListener("DOMNodeRemoved", callback, false);
		}
	}
})();
