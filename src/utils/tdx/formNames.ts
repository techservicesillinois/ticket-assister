/*
class TwoWayMap<K, V> {
	#map: Map<K,V>;
	#reverseMap: Map<V,K>;
	constructor() {
		this.#map = new Map();
		this.#reverseMap = new Map();
		
		this.#map.forEach((v, k) => {
			this.#reverseMap.set(v, k);
		});
	}
	has(key: K): boolean {
		return this.#map.has(key);
	}
	get(key: K): V | undefined {
		return this.#map.get(key);
	}
	set(key: K, value: V) {
		this.#map.set(key, value);
		this.#reverseMap.set(value, key);
	}
	revHas(value: V): boolean {
		return this.#reverseMap.has(value);
	}
	revGet(value: V): K | undefined {
		// Object.entries(this.map) is slower
		return this.#reverseMap.get(value);
	}
}

const nameToAttributeMap = new TwoWayMap<string, string>(); // ex: Title => attribute37
nameToAttributeMap.set("Title", "attribute37");

// todo find a better TS way to do this so it makes a compiler error
function getAttributeFor(name: string): string {
	if (!nameToAttributeMap.has(name)) {
		throw new Error("That name does not have an associated attribute");
	}
	return nameToAttributeMap.get(name)!;
}
*/

// maybe this should  be an enum or something
const nameToAttributeMap = {
	"Person Requiring Service": "attribute495",
	"Status": "attribute40",
	"Created Via": "attribute371",
	"Request Area": "attribute2523",
	"Responsible": "attribute1279",
	"Summary": "attribute37", // Title
	"Description of Issue": "attribute138.Content", // also attribute138.EditorKey
	"Department": "attribute38",
	"Priority": "attribute41",
	//"Service Offering", "attribute3385", // not in use
};
export function getAttributeFor<T extends keyof typeof nameToAttributeMap>(name: T): typeof nameToAttributeMap[T] {
	return nameToAttributeMap[name];
}
/**
 * The Status of a ticket, listed in TDX
 *
 * Usage: Status["value"]
 *
 * The string representation of the enum is the TDX value
 * for {@link getAttributeFor}("Status")
 *
 * @see {@link getStatusFromFormValue} for a reverse mapping
 *
 * @todo: pull this stuff live
 * from the first ticket in a session
 * instead of hardcoding it
 */
export enum Status {
	"New" = "117",
	"Open" = "118",
	"In Process" = "119",
	"Resolved" = "120",
	"Closed" = "121",
	"Cancelled" = "122",
	"On Hold" = "123",
	"Reopened" = "138",
	"Awaiting Customer Response" = "187",
}
/**
 * Returns a {@link Status} based on the status's value
 * using a reverse mapping for a string enum
 *
 * @returns the Status or undefined if the status is not valid
 */
export function getStatusFromFormValue(value: string): Status | undefined {
	const enumKey = Object.keys(Status).find(
		(key) => Status[key as keyof typeof Status] === value
	);
	if (enumKey !== undefined) {
		return Status[enumKey as keyof typeof Status];
	}
	return undefined;
}
/**
 * The Service Request Area of a ticket, listed in TDX
 *
 * Usage: SRA["value"]
 *
 * The string representation of the enum is the TDX value
 * for {@link getAttributeFor}("Request Area")
 *
 * @todo: pull this stuff live
 * from the first ticket in a session
 * instead of hardcoding it
 */
export enum SRA {
	"2FA" = "2411",
	"2FA.Bypass Code" = "2427",
	"Accessibility Review" = "2100",
	"Active Directory" = "2101",
	"AITS Applications" = "2477",
	"Amazon Web Services" = "2456",
	"Authorization Manager" = "2459",
	"Azure" = "2455",
	"Business IT" = "5497",
	"Campus Email Relays" = "2420",
	"Campus Email Relays.Spam Control" = "2433",
	"Campus Mailing Lists" = "2424",
	"Campus Mailing Lists.Creation" = "2429",
	"Campus Monitoring" = "2764",
	"Campus Network" = "2436",
	"Campus Network.Wired" = "2448",
	"Canvas @ Illinois" = "2439",
	"Canvas @ Illinois.DesignPLUS" = "8455",
	"Canvas @ Illinois.Space Request" = "4803",
	"Canvas @ Illinois.TurnItIn" = "8454",
	"Canvas Catalog" = "8546",
	"CCFD" = "3204",
	"Cellular Services" = "2454",
	"Centrex" = "2789",
	"Classroom Request" = "2476",
	"Classroom Technologies.Lecture Capture" = "2453",
	"Classroom Trouble.Audio" = "2469",
	"Classroom Trouble.Display" = "2470",
	"Classroom Trouble.Other" = "2471",
	"Cloud Dashboard" = "2440",
	"Cloud Emailer Service" = "2452",
	"Communications and Marketing" = "2940",
	"Contacts Database" = "2480",
	"Course Explorer" = "6494",
	"COVID Overrides" = "6303",
	"COVID Policy" = "6304",
	"COVID Procedure" = "6305",
	"COVID Test Site Support" = "2478",
	"COVID Troubleshooting" = "6306",
	"cPanel" = "2426",
	"Cybersecurity Training and Awareness" = "6302",
	"DataCenter" = "2873",
	"Emergency Phones" = "3578",
	"Endpoint Services" = "2718",
	"Endpoint Services.CrowdStrike" = "2681",
	"Endpoint Services.Dell Data Protection" = "2682",
	"Endpoint Services.MECM" = "2458",
	"Endpoint Services.Munki" = "2680",
	"Endpoint Services.Workspace ONE (Airwatch)" = "2683",
	"Endpoint Services.WSUS" = "2684",
	"Exchange" = "2408",
	"GitHub" = "2788",
	"GivePulse" = "3205",
	"Google Apps at Illinois" = "2422",
	"Google Apps at Illinois.Email" = "2430",
	"Google Cloud Platform (GCP)" = "2776",
	"Hardware Tokens" = "2474",
	"ICS Computer Labs" = "2490",
	"Identity and Access Management" = "2432",
	"Illini-Alert" = "2462",
	"Illinois Compass 2G" = "2410",
	"Illinois Compass 2G.Ops Request" = "2442",
	"Illinois Wiki" = "2438",
	"Illinois Wiki.Space Request" = "2461",
	"IP Address Management" = "2671",
	"Iris" = "2457",
	"Kaltura" = "2417",
	"Knowledgebase" = "2482",
	"Malwarebytes for Students" = "6349",
	"Microsoft Teams" = "2437",
	"MITS Central" = "2774",
	"MITS East" = "2773",
	"MITS Grad College" = "5859",
	"MITS Intake" = "2483",
	"MITS North" = "2775",
	"MITS South" = "2772",
	"MyApps" = "2460",
	"NetID Change" = "2475",
	"NetID Claim" = "2468",
	"NetID Creation/Sponsorship" = "2467",
	"NetID Password" = "2409",
	"Office365" = "2419",
	"OnSite Consulting" = "2450",
	"Password Lockout" = "2472",
	"Password Registrar Requests" = "2479",
	"Pinnacle" = "2428",
	"Potential Spam/Phishing" = "2473",
	"Printing" = "2443",
	"Publish" = "2431",
	"REDCAP" = "2464",
	"Research IT" = "2491",
	"RightFax" = "2446",
	"Rokwire" = "2485",
	"Safer Illinois" = "2415",
	"Safer Illinois.Bug and Issue Reports" = "2434",
	"Safer Illinois.Overrides" = "2481",
	"Scholarly Commons Requests" = "8415",
	"Security Cameras" = "4193",
	"Security Policies" = "2487",
	"Security Scramble" = "2465",
	"Security Scramble Support" = "2466",
	"Service Catalog" = "3243",
	"Shibboleth" = "2421",
	"Skype for Business" = "2418",
	"Skype for Business.Contact Center" = "2871",
	"SMG" = "2777",
	"Splunk" = "2463",
	"SRM" = "2843",
	"SSL Certificates" = "3983",
	"Status" = "7260",
	"Swanlund IT" = "8408",
	"Swanlund IT.Admin" = "5811",
	"Swanlund IT.IPS" = "5809",
	"Swanlund IT.Procurement" = "5812",
	"Swanlund IT.UNI" = "5810",
	"TeamDynamix (TDX)" = "2484",
	"Tech Loan" = "2412",
	"Tech Services Communication Team" = "2489",
	"Tech Services Staff Support" = "2488",
	"TLP Support" = "2451",
	"Touchpoint" = "2486",
	"U of I Box" = "2414",
	"U of I Box.Enroll" = "2445",
	"UIUCAnyWare" = "2444",
	"Virtual Hosting" = "2449",
	"VPN" = "2416",
	"WebStore" = "2425",
	"Wireless" = "2423",
	"Wireless.Trouble" = "2447",
	"Wireless.Trouble.IllinoisNet" = "2435",
	"Wireless.Trouble.IllinoisNet_Guest" = "2441",
	"WSAA" = "2771",
	"Zoom" = "2413",
	"---------------" = "2103",
	"Admissions/Registration/Application" = "2498",
	"Billing/Finance" = "2503",
	"COVID General" = "2502",
	"Duplicate" = "2496",
	"Ethics/Title IX Training" = "2500",
	"Exception Request" = "4074",
	"Hardware" = "2494",
	"Help Desk Onboarding" = "2872",
	"Help Desk Tools Access" = "3445",
	"Informational Alerts & Messages" = "3380",
	"Junk" = "2104",
	"Library" = "2501",
	"Non-Technology" = "selected",
	"Service Management Office (SMO)" = "6412",
	"Software" = "2495",
	"Survey Follow-up" = "2497",
	"Transcripts" = "2499",
	"Walk-In Appointment Request" = "4537",
}
/**
 * The Create Method of a ticket, listed in TDX
 *
 * The string representation of the enum is the TDX value
 * for {@link getAttributeFor}("Created Via")
 *
 * @todo: pull this stuff live
 * from the first ticket in a session
 * instead of hardcoding it
 */
export enum CreateMethod {
	"Automation" = "9",
	"Chat" = "10",
	"Email" = "6",
	"Internal" = "11",
	"Phone" = "5",
	"Portal" = "4",
	"Voicemail" = "12",
	"Walk In" = "7",
	"Webform (External)" = "8",
}

/**
 * Converts a boolean to a checkbox value
 * as submitted in a form
 *
 * @see {@link checkboxValueToBool}
 * 
 * @remarks
 * true => "on"
 * false => "off"
 */
export function boolToCheckboxValue(val: boolean) {
	if (val) {
		return "on";
	}
	return "off";
}

/**
 * Converts a checkbox form value
 * to a boolean
 *
 * @throws if the passed checkbox form value is invalid
 *
 * @see {@link boolToCheckboxValue}
 * 
 * @remarks
 * "on" => true
 * "off" => false
 * else => throw
 */
export function checkboxValueToBool(val: string): boolean {
	if (val === "on") {
		return true;
	} else if (val === "off") {
		return false;
	}
	throw new Error("Invalid value");
}

