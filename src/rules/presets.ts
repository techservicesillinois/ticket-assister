// todo set preset rule defaults
// for the type annotations

/**
 * A list of the presets and the rules that they determine
 * 
 * @internalRemarks
 * Not exported default directly for type annotation
 * and for `keyof typeof` usage in {@link DEFAULT_PRESET}
 * 
 * Could be a `Map<string, Map<string, boolean>>`,
 * but this is easier to write out and see inline
 * 
 * @todo restrict the inner Record to have only keys
 * which are names of `rules`
 * using Typescript.
 */
const presetsList: Record<string, Record<string, boolean>> = {
	"All Off": {
		"Cerebro/flagger/Alert/Red": false,
		"Cerebro/flagger/Highlight/Red": false,
		"Cerebro/flagger/Highlight/Yellow": false,
		"Cerebro/flagger/Show count": false,
		"Cerebro/Show TkAst logo on Cerebro": false,
		"TDX/Ticket/Show TkAst logo on tickets": false,
		"TDX/Ticket/Create/Auto open ticket": false,
		"TDX/Ticket/Create/Auto take ticket": false,
		"TDX/Ticket/Create/Ctrl+Enter to submit": false,
		"TDX/Ticket/Create/Auto select Service Request form": false,
		"TDX/Ticket/Create/Quick select Service Request, Incident, Classtech form": false,
		"TDX/Ticket/Create/Editor: Add link with Ctrl+K": false,
		"TDX/Ticket/View/Ctrl+Enter to submit comment": false,
		"TDX/Ticket/View/Make comments private by default": false,
		"TDX/Ticket/View/Don't warn if private comment is not notifying": false,
		"TDX/Ticket/View/Hotkeys": false,
		"TDX/Ticket/View/Additional Hotkeys": false,
		"TDX/Ticket/View/Add link with Ctrl+K": false,
		"TDX/Ticket/View/Gray out unused actions": false,
		"TDX/Ticket/View/Hide extra details": false,
		"TDX/Ticket/View/Button to copy NetID": false,
		"TDX/Ticket/View/Buttons to open tools with client's account": false,
		"TDX/Ticket/View/Show client's recent tickets": false,
		"TDX/Ticket/Edit/Go back on save": false,
		"TDX/Ticket/Edit/Add link with Ctrl+K": false,
		"TDX/Ticket/Edit/Ctrl+Enter to submit comment": false,
		"TDX/Ticket/Update/Add link with Ctrl+K": false,
		"TDX/Ticket/Update/Ctrl+Enter to submit comment": false,
		"TDX/Ticket/Update/Auto set Awaiting Customer Response": false,
		"TDX/Ticket/Update/Prefill response": false,
	},
	"Default": {
		// todo
		"TDX/Ticket/Show TkAst logo on tickets": true,
	},
	"Recommended": {
		// todo
	},
	"All On": {
		// todo: all true
	},
	"Custom": {},
};
export default presetsList;

/**
 * The name of the default preset to be chosen
 * if none is currently set
 * 
 * Must be a key of {@link presetsList}
 */
export const DEFAULT_PRESET: keyof typeof presetsList = "Default";
/**
 * The name of the custom preset
 * which will not have an associated Record
 * but instead should have the rules stored in
 * {@link getAllRuleStatuses} honored
 * 
 * Should be a key of {@link presetsList}
 */
export const CUSTOM_PRESET: keyof typeof presetsList = "Custom";
