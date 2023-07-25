import { BASE_URL } from "config";
import type { ToggleableFeature } from "utils/rules/types";

// note: can request specific site permissions with chrome.permissions.request({ origins }); if specified in optional_permissions

// NOTE: ensure that host_permissions are granted for each of these paths.
const exportDefault: Array<ToggleableFeature> = [
	{
		name: "Cerebro/flagger/Alert/Red",
		description: "Provides a summary box at the top with any red flags about an account.\nThese are things that are likely to cause an issue for the user based on their account types.",
		path: "https://cerebro.techservices.illinois.edu",
		scriptPath: "cerebro/cs1.ts",
	},
	{
		name: "Cerebro/flagger/Highlight/Red",
		description: "Highlights any red flags about an account on the page.\nThese are things that are likely to cause an issue for the user based on their account types.",
		path: "https://cerebro.techservices.illinois.edu",
		scriptPath: "cerebro/cs2.ts",
	},
	{
		name: "Cerebro/flagger/Highlight/Yellow",
		description: "Highlights any yellow flags about an account on the page.\nThese are things that may cause an issue for the user, but not necessarily.",
		path: "https://cerebro.techservices.illinois.edu",
		scriptPath: "cerebro/cs3.ts",
	},
	{
		name: "Cerebro/flagger/Show count",
		description: "Shows a count of the number of red and yellow flags for a user's profile.",
		path: "https://cerebro.techservices.illinois.edu",
		scriptPath: "cerebro/cs4.ts",
	},
	{
		name: "Cerebro/Show TkAst logo on Cerebro",
		description: "Displays the Ticket Assister (stylized TkAst) logo on Cerebro, indicating that Ticket Assister is running and assisting you.",
		path: "https://cerebro.techservices.illinois.edu",
		scriptPath: "cerebro/cs5.ts",
	},

	{
		name: "TDX/Ticket/Show TkAst logo on tickets",
		description: "Displays the Ticket Assister (stylized TkAst) logo on tickets, indicating that Ticket Assister is running and assisting you.",
		path: `${BASE_URL}/Apps/40/Tickets/*`,
		scriptPath: "tdx/ticket/cs6.ts",
	},

	{
		name: "TDX/Ticket/Create/Auto open ticket",
		description: "Automatically opens a new ticket once you create it, instead of showing the \"Created Successfully\" screen.",
		path: `${BASE_URL}/Apps/40/Tickets/TicketNewSuccess`,
		scriptPath: "tdx/ticket/create/cs7.ts",
	},
	{
		name: "TDX/Ticket/Create/Auto take ticket",
		description: "Automatically takes a ticket (gives you Primary Responsibility) after creating a new ticket with responsibility of UIUC-TechSvc-Help Desk.",
		path: `${BASE_URL}/Apps/40/Tickets/TicketNewSuccess`,
		scriptPath: "tdx/ticket/create/cs8.ts",
	},
	{
		name: "TDX/Ticket/Create/Ctrl+Enter to submit",
		description: "Allows you to press Ctrl+Enter to quickly create a ticket in on new ticket screen.",
		path: `${BASE_URL}/Apps/40/Tickets/New`,
		scriptPath: "tdx/ticket/create/cs9.ts",
	},
	{
		name: "TDX/Ticket/Create/Auto select Service Request form",
		description: "Automatically selects \"Tech Services - New Service Request\" on the create ticket screen.",
		path: `${BASE_URL}/Apps/40/Tickets/New`,
		scriptPath: "tdx/ticket/create/cs10.ts",
	},
	{
		name: "TDX/Ticket/Create/Quick select Service Request, Incident, Classtech form",
		description: "Provides a dropdown to quickly select between \"Tech Services - New Service Request\", \"Tech Services - New Incident\", and \"Tech Services - Classtech Problem Report\" on the create ticket screen.",
		path: `${BASE_URL}/Apps/40/Tickets/New`,
		scriptPath: "tdx/ticket/create/cs11.ts",
	},
	{
		name: "TDX/Ticket/Create/Editor: Add link with Ctrl+K",
		description: "Adds a shortcut (Ctrl+K) to add a link when typing in the view WYSIWYG editor",
		path: `${BASE_URL}/Apps/40/Tickets/New`,
		scriptPath: "tdx/ticket/create/cs12.ts",
	},

	{
		name: "TDX/Ticket/View/Ctrl+Enter to submit comment",
		description: "Allows you to press Ctrl+Enter to quickly submit a comment when you are typing in the comment box.",
		path: `${BASE_URL}/Apps/40/Tickets/TicketDet.aspx`,
		scriptPath: "tdx/ticket/view/cs13.ts",
	},
	{
		name: "TDX/Ticket/View/Make comments private by default",
		description: "Automatically makes sure that Make comments private is checked by default when created a new comment",
		path: `${BASE_URL}/Apps/40/Tickets/TicketDet.aspx`,
		scriptPath: "tdx/ticket/view/cs14.ts",
	},
	{
		name: "TDX/Ticket/View/Don't warn if private comment is not notifying",
		description: "Remove's TDX's warning about providing comments without selecting anyone to notify if comment is marked as private",
		path: `${BASE_URL}/Apps/40/Tickets/TicketDet.aspx`,
		scriptPath: "tdx/ticket/view/cs15.ts",
	},
	{
		name: "TDX/Ticket/View/Hotkeys",
		description: "Enables the following keyboard shortcuts when not typing in an input box:\n- E => open Edit page\n- U => open Update page\n- T => Take primary responsibility (if unassigned)\n- R => Refresh ticket page\n- C => jump to Comment box",
		path: `${BASE_URL}/Apps/40/Tickets/TicketDet.aspx`,
		scriptPath: "tdx/ticket/view/cs16.ts",
	},
	{
		name: "TDX/Ticket/View/Additional Hotkeys",
		description: "Enables the following keyboard shortcuts when not typing in an input box:\n- F => jump to latest Feed activity",
		path: `${BASE_URL}/Apps/40/Tickets/TicketDet.aspx`,
		scriptPath: "tdx/ticket/view/cs17.ts",
	},
	{
		name: "TDX/Ticket/View/Add link with Ctrl+K",
		description: "Adds a shortcut (Ctrl+K) to add a link when typing in the view WYSIWYG editor",
		path: `${BASE_URL}/Apps/40/Tickets/TicketDet.aspx`,
		scriptPath: "tdx/ticket/view/cs18.ts",
	},
	{
		name: "TDX/Ticket/View/Gray out unused actions",
		description: "Grays out infrequently used actions, requiring a double-click to click them.\nThis is to avoid accidentally clicking a different button",
		path: `${BASE_URL}/Apps/40/Tickets/TicketDet.aspx`,
		scriptPath: "tdx/ticket/view/cs19.ts",
	},
	{
		name: "TDX/Ticket/View/Hide extra details",
		description: "Collapses details which are infrequently consulted into a dropdown box which can be toggled to open the details again.\nKeeps the most useful details still available (Responsibility, Request Area, Age).",
		path: `${BASE_URL}/Apps/40/Tickets/TicketDet.aspx`,
		scriptPath: "tdx/ticket/view/cs20.ts",
	},
	{
		name: "TDX/Ticket/View/Button to copy NetID",
		description: "Adds a button next to the requestor's email to copy their NetID if found.",
		path: `${BASE_URL}/Apps/40/Tickets/TicketDet.aspx`,
		scriptPath: "tdx/ticket/view/cs21.ts",
	},
	{
		name: "TDX/Ticket/View/Buttons to open tools with client's account",
		description: "Adds button to open i-card with the user's account.",
		path: `${BASE_URL}/Apps/40/Tickets/TicketDet.aspx`,
		scriptPath: "tdx/ticket/view/cs22.ts",
	},
	{
		name: "TDX/Ticket/View/Show client's recent tickets",
		description: "Shows recent tickets from the client below the requestor profile (like in the ticket edit page) if there are any.",
		path: `${BASE_URL}/Apps/40/Tickets/TicketDet.aspx`,
		scriptPath: "tdx/ticket/view/cs23.ts",
	},

	{
		name: "TDX/Ticket/Edit/Go back on save",
		description: "Automatically returns to the ticket detail page after saving changes to an edit.",
		path: `${BASE_URL}/Apps/40/Tickets/Edit`,
		scriptPath: "tdx/ticket/edit/cs24.ts",
	},
	{
		name: "TDX/Ticket/Edit/Add link with Ctrl+K",
		description: "Adds a shortcut (Ctrl+K) to add a link when typing in the view WYSIWYG editor",
		path: `${BASE_URL}/Apps/40/Tickets/Edit`,
		scriptPath: "tdx/ticket/edit/cs25.ts",
	},
	{
		name: "TDX/Ticket/Edit/Ctrl+Enter to submit comment",
		description: "Allows you to press Ctrl+Enter to quickly submit edits.",
		path: `${BASE_URL}/Apps/40/Tickets/Edit`,
		scriptPath: "tdx/ticket/edit/cs26.ts",
	},

	{
		name: "TDX/Ticket/Update/Add link with Ctrl+K",
		description: "Adds a shortcut (Ctrl+K) to add a link when typing in the view WYSIWYG editor",
		path: `${BASE_URL}/Apps/40/Tickets/Update`,
		scriptPath: "tdx/ticket/update/cs27.ts",
	},
	{
		name: "TDX/Ticket/Update/Ctrl+Enter to submit comment",
		description: "Allows you to press Ctrl+Enter to quickly submit an update email.",
		path: `${BASE_URL}/Apps/40/Tickets/Update`,
		scriptPath: "tdx/ticket/update/cs28.ts",
	},
	{
		name: "TDX/Ticket/Update/Auto set Awaiting Customer Response",
		description: "Automatically changes the status to Awaiting Customer Response when updating a ticket that is New, Open, or Reopened.",
		path: `${BASE_URL}/Apps/40/Tickets/Update`,
		scriptPath: "tdx/ticket/update/cs29.ts",
	},
	{
		name: "TDX/Ticket/Update/Prefill response",
		description: "Sets a default response when updating tickets according to a template.",
		path: `${BASE_URL}/Apps/40/Tickets/Update`,
		scriptPath: "tdx/ticket/update/cs30.ts",
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