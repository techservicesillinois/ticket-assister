import type { ToggleableFeature } from "utils/rules/types";
import { TICKETS_BASE_URL } from "utils/webpage/foreground/tdx/shared";
import { BASE_URL, CEREBRO_URL } from "config";

// note: can request specific site permissions with chrome.permissions.request({ origins }); if specified in optional_permissions
/**
 * The ticket URLs to match
 * 
 * Includes wildcard globs for queries
 */
const TICKET_URL = {
	NEW: `${TICKETS_BASE_URL}/New*`, // may have ?FormID=X or not
	NEW_CREATED: `${TICKETS_BASE_URL}/TicketNewSuccess?*`,
	// NOTE: TicketDet and TicketSearch optionally have an .aspx extension
	// so we are wildcard matching everything after that
	VIEW: `${TICKETS_BASE_URL}/TicketDet*`,
	EDIT: `${TICKETS_BASE_URL}/Edit?*`,
	UPDATE: `${TICKETS_BASE_URL}/Update?*`,
	ASSIGN: `${TICKETS_BASE_URL}/TicketReassign?*`,
};
// NOTE: ensure that host_permissions are granted for each of these paths.
const exportDefault: Array<ToggleableFeature> = [
	{
		name: "Cerebro/flagger/Alert/Red",
		description: "Provides a summary box at the top with any red flags about the account on the page.\nThese are things that are likely to cause an issue for the user based on their account types.",
		contentScripts: [
			{
				url: CEREBRO_URL,
				script: "cerebro/cs1.ts",
			},
		],
	},
	{
		name: "Cerebro/flagger/Highlight/Red",
		description: "Highlights any red flags about the account on the page.\nThese are things that are likely to cause an issue for the user based on their account types.",
		contentScripts: [
			{
				url: CEREBRO_URL,
				script: "cerebro/cs2.ts",
			},
		],
	},
	{
		name: "Cerebro/flagger/Highlight/Yellow",
		description: "Highlights any yellow flags about the account on the page.\nThese are things that may cause an issue for the user, but not necessarily.",
		contentScripts: [
			{
				url: CEREBRO_URL,
				script: "cerebro/cs3.ts",
			},
		],
	},
	{
		name: "Cerebro/flagger/Show count",
		description: "Shows a count of the number of red and yellow flags for the account on the page.",
		contentScripts: [
			{
				url: CEREBRO_URL,
				script: "cerebro/cs4.ts",
			},
		],
	},
	{
		name: "Cerebro/Show TkAst logo on Cerebro",
		description: "Displays the Ticket Assister (stylized TkAst) logo on Cerebro, indicating that Ticket Assister is running and assisting you.",
		contentScripts: [
			{
				url: CEREBRO_URL,
				script: "cerebro/cs5.ts",
			},
		],
	},

	{
		name: "TDX/Ticket/Show TkAst logo on tickets",
		description: "Displays the Ticket Assister (stylized TkAst) logo on tickets, indicating that Ticket Assister is running and assisting you.",
		contentScripts: [
			{
				url: `${TICKETS_BASE_URL}/*`,
				script: "tdx/ticket/cs6.ts",
			},
		],
	},

	{
		name: "TDX/Ticket/Create/Auto open ticket",
		description: "Automatically opens a new ticket once you create it, instead of showing the \"Created Successfully\" screen.",
		contentScripts: [
			{
				url: TICKET_URL.NEW_CREATED,
				script: "tdx/ticket/create/cs7.ts",
			},
		],
	},
	{
		name: "TDX/Ticket/Create/Auto take ticket",
		description: "Automatically takes a ticket (gives you Primary Responsibility) after creating a new ticket with responsibility of UIUC-TechSvc-Help Desk.\nWill not take primary responsibility if the ticket is created in another group.",
		contentScripts: [
			{
				url: TICKET_URL.NEW_CREATED,
				script: "tdx/ticket/create/cs8.ts",
			},
			{ // in case loaded too fast
				url: TICKET_URL.VIEW,
				script: "tdx/ticket/view/cs38.ts",
			},
		],
	},
	{
		name: "TDX/Ticket/Create/Ctrl+Enter to submit",
		description: "Allows you to press Ctrl+Enter to quickly create a ticket in on new ticket screen.",
		contentScripts: [
			{
				url: TICKET_URL.NEW,
				script: "tdx/ticket/create/cs9.ts",
			},
		],
	},
	{
		name: "TDX/Ticket/Create/Auto select Service Request form",
		description: "Automatically selects \"Tech Services - New Service Request\".",
		contentScripts: [
			{
				url: TICKET_URL.NEW,
				script: "tdx/ticket/create/cs10.ts",
			},
		],
	},
	{
		name: "TDX/Ticket/Create/Quick select Service Request, Incident, Classtech form",
		description: "Provides buttons to quickly select between \"Tech Services - New Service Request\", \"Tech Services - New Incident\", and \"Tech Services - Classtech Problem Report\".",
		contentScripts: [
			{
				url: TICKET_URL.NEW,
				script: "tdx/ticket/create/cs11.ts",
			},
		],
	},
	{
		name: "TDX/Ticket/Create/Auto select Phone as source",
		description: "Automatically sets Created Via to be Phone.",
		contentScripts: [
			{
				url: TICKET_URL.NEW,
				script: "tdx/ticket/create/cs34.ts",
			},
		],
	},
	{
		name: "TDX/Ticket/Create/Hide additional contacts",
		description: "Collapses the additional contacts field. Can be toggled back on.",
		contentScripts: [
			{
				url: TICKET_URL.NEW,
				script: "tdx/ticket/create/cs35.ts",
			},
		],
	},
	{
		name: "TDX/Ticket/Create/Don't notify requestor",
		description: "Automatically unchecks the notify requestor option. Can be toggled open.",
		contentScripts: [
			{
				url: TICKET_URL.NEW,
				script: "tdx/ticket/create/cs36.ts",
			},
		],
	},

	{
		name: "TDX/Ticket/View/Ctrl+Enter to submit comment",
		description: "Allows you to press Ctrl+Enter to quickly submit a comment when you are typing in the comment box.",
		contentScripts: [
			{
				url: TICKET_URL.VIEW,
				script: "tdx/ticket/view/cs13.ts",
			},
		],
	},
	{
		name: "TDX/Ticket/View/Make comments private by default",
		description: "Automatically makes sure that Make comments private is checked by default when creating a new comment.",
		contentScripts: [
			{
				url: TICKET_URL.VIEW,
				script: "tdx/ticket/view/cs14.ts",
			},
		],
	},
	{
		name: "TDX/Ticket/View/Don't warn if private comment is not notifying",
		description: "Removes TDX's warning about providing comments without selecting anyone to notify if comment is marked as private.",
		contentScripts: [
			{
				url: TICKET_URL.VIEW,
				script: "tdx/ticket/view/cs15.ts",
			},
		],
	},
	{
		name: "TDX/Ticket/View/Hotkeys",
		description: "Enables the following keyboard shortcuts when not typing in an input box:\n- E => open Edit page\n- U => open Update page\n- R => Refresh ticket page\n- C => jump to Comment box\n- A => open Assign box",
		contentScripts: [
			{
				url: TICKET_URL.VIEW,
				script: "tdx/ticket/view/cs16.ts",
			},
		],
	},
	{
		name: "TDX/Ticket/View/Additional Hotkeys",
		description: "Enables the following keyboard shortcuts when not typing in an input box:\n- T => Take primary responsibility (if unassigned and open)\n- F => toggle Flag\n- D => jump to latest feeD activity",
		contentScripts: [
			{
				url: TICKET_URL.VIEW,
				script: "tdx/ticket/view/cs17.ts",
			},
		],
	},
	{
		name: "TDX/Ticket/View/Gray out unused actions",
		description: "Grays out infrequently used actions, requiring a double-click to click them.\nThis is to avoid accidentally clicking a button incorrectly.",
		contentScripts: [
			{
				url: TICKET_URL.VIEW,
				script: "tdx/ticket/view/cs19.ts",
			},
		],
	},
	{
		name: "TDX/Ticket/View/Hide extra details",
		description: "Collapses details which are infrequently consulted into a dropdown box which can be toggled to open the details again.\nKeeps the most useful details still available (Responsibility, Request Area, Age).",
		contentScripts: [
			{
				url: TICKET_URL.VIEW,
				script: "tdx/ticket/view/cs20.ts",
			},
		],
	},
	{
		name: "TDX/Ticket/View/Button to copy NetID",
		description: "Adds a button next to the requestor's email to copy their NetID, if it is found.",
		contentScripts: [
			{
				url: TICKET_URL.VIEW,
				script: "tdx/ticket/view/cs21.ts",
			},
		],
	},
	{
		name: "TDX/Ticket/View/Buttons to open tools with client's account",
		description: "Adds button to open i-card with the user's account, if it is found.",
		contentScripts: [
			{
				url: TICKET_URL.VIEW,
				script: "tdx/ticket/view/cs22.ts",
			},
		],
	},
	{
		name: "TDX/Ticket/View/Show client's recent tickets",
		description: "Shows recent tickets from the client below the requestor profile (like in the ticket edit page), if there are any.",
		contentScripts: [
			{
				url: TICKET_URL.VIEW,
				script: "tdx/ticket/view/cs23.ts",
			},
		],
	},
	{
		name: "TDX/Ticket/View/Hide attachments if empty",
		description: "Collapses the attachment box if there are no attachments.\nThe box can be toggled to be expanded again (for you to add an attachment).",
		contentScripts: [
			{
				url: TICKET_URL.VIEW,
				script: "tdx/ticket/view/cs37.ts",
			},
		],
	},
	{
		name: "TDX/Ticket/View/Highlight misconfigured requestor field",
		description: "Draws a red box around the requestor field if it is not filled out and should be, i.e. if the address is an @illinois.edu address but the TDX account is not linked.\nThese tickets should be edited to be corrected.",
		contentScripts: [
			{
				url: TICKET_URL.VIEW,
				script: "tdx/ticket/view/cs42.ts",
			},
		],
	},

	{
		name: "TDX/Ticket/Edit/Go back on save",
		description: "Automatically returns to the ticket detail page after saving changes to an edit.",
		contentScripts: [
			{
				url: TICKET_URL.EDIT,
				script: "tdx/ticket/edit/cs24.ts",
			},
		],
	},
	{
		name: "TDX/Ticket/Edit/Ctrl+Enter to submit comment",
		description: "Allows you to press Ctrl+Enter to quickly submit edits.",
		contentScripts: [
			{
				url: TICKET_URL.EDIT,
				script: "tdx/ticket/edit/cs26.ts",
			},
		],
	},

	{
		name: "TDX/Ticket/Update/Ctrl+Enter to submit comment",
		description: "Allows you to press Ctrl+Enter to quickly submit an update email.",
		contentScripts: [
			{
				url: TICKET_URL.UPDATE,
				script: "tdx/ticket/update/cs28.ts",
			},
		],
	},
	{
		name: "TDX/Ticket/Update/Auto set Awaiting Customer Response",
		description: "Automatically changes the status to Awaiting Customer Response when updating a ticket that is New, Open, or Reopened.",
		contentScripts: [
			{
				url: TICKET_URL.UPDATE,
				script: "tdx/ticket/update/cs29.ts",
			},
		],
	},
	{
		name: "TDX/Ticket/Update/Prefill response",
		description: "Sets a default response when updating tickets according to a template.",
		contentScripts: [
			{
				url: TICKET_URL.UPDATE,
				script: "tdx/ticket/update/cs30.ts",
			},
		],
	},
	{
		name: "TDX/Ticket/View/Get Cerebro data",
		description: "Shows key info about a person from Cerebro.\nDisplays their types and relevant roles as well as a summary of any red and yellow flags detected on their account.",
		contentScripts: [
			{
				url: TICKET_URL.VIEW,
				script: "tdx/ticket/view/cs31.ts",
			},
			{
				url: CEREBRO_URL,
				script: "cerebro/cs32.ts",
			},
		],
	},
	{
		name: "TDX/Ticket/Search/Auto select all statuses",
		description: "Automatically selects all statuses by default in a search (instead of the default of 6 of 9).\nApplied to the fullscreen search but not other searches (e.g. the desktop search).",
		contentScripts: [
			{
				url: `${TICKETS_BASE_URL}/TicketSearch*`,
				script: "tdx/ticket/cs33.ts",
			},
		],
	},
	{
		name: "TDX/Themes/Dark",
		description: "Puts TDX in dark mode.",
		contentScripts: [
			{
				url: `${BASE_URL}/*`,
				css: "dark.css",
				script: undefined,
			},
		],
	},
	{
		name: "TDX/Ticket/Assign/Ctrl+Enter to submit",
		description: "Allows you to press Ctrl+Enter to quickly save the assignment of a ticket.",
		contentScripts: [
			{
				url: TICKET_URL.ASSIGN,
				script: "tdx/ticket/assign/cs40.ts",
			},
		],
	},
	{
		name: "TDX/Ticket/Assign/Auto focus",
		description: "Automatically focuses the New Responsibility input box once the assign screen is opened.",
		contentScripts: [
			{
				url: TICKET_URL.ASSIGN,
				script: "tdx/ticket/assign/cs41.ts",
			},
		],
	},
	{
		name: "TDX/Ticket/Assign/Warn if no SRA",
		description: "Displays a warning box if escalating a ticket which does not have the Service Request Area field filled out.",
		contentScripts: [
			{
				url: TICKET_URL.ASSIGN,
				script: "tdx/ticket/assign/cs43.ts",
			},
		],
	},
	{
		name: "TDX/Ticket/Close on close",
		description: "Closes the ticket window after closing a ticket via an edit or an update.",
		contentScripts: [
			{
				url: TICKET_URL.VIEW,
				script: "tdx/ticket/view/cs44.ts",
			},
			{
				url: TICKET_URL.UPDATE,
				script: "tdx/ticket/update/cs45.ts",
			},
			{
				url: TICKET_URL.EDIT,
				script: "tdx/ticket/edit/cs46.ts",
      },
		],
	},
];

export default exportDefault; // satisfies Array<ToggleableFeature>

/**
 * Returns a rule based on its name
 * or null if not found.
 * 
 * @param name the name of the rule
 * @returns the rule
 */
export function getRule(name: string): ToggleableFeature | null {
	return exportDefault.find(rule => rule.name === name) ?? null;
}