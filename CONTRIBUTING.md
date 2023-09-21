# Contributing

We welcome feature requests and bugs in the form of issues.

Please review the [Code of Conduct](/CODE_OF_CONDUCT.md) before contributing.

For vulnerabilities, please see our [Security documentation](./SECURITY.md).

## Contributing code

Below are common code tasks and basic rules for how to complete them.

### Adding a new toggleable feature (rule)

Toggleable features that are available on the options page.
They are referred to as "rules" internally.

1. Verify the scope of the rule

	- Each rule's scope should be single-focused
	- If it has multiple features, it should be broken up into two rules
	- A rule may run multiple scripts on different pages, but they should only be bundled in one rule if they are dependent on each other
	and are tied in one single purpose

2. Determine a name for the rule

	- This should be described by a descending hierarchical order separated by slashes
		- ex: "TDX/Ticket/Create/Ctrl+Enter to submit"
	- The non-final strings in between the slashes should drill down functionality
		- ex: "TDX", "Ticket", "Create" specify where the rule is acting
	- The final string after the slash should be specific to the rules functionality
		- ex: "Ctrl+Enter to submit" is the actual functionality
	- Examples can be seen in `src/rules/rules.ts`
		- Try to mimick the form of existing rules, i.e., re-use top level categories if possible

3. Implement the rule's code

	Implement scripts, if applicable:

	- In `src/contentScripts/[rulePath]/cs[N].ts`
		- `[rulePath]` is typically the rule name without the final slash and following string
		- `[N]` is the integer of the next content script
			- E.g., if the latest content script is named `cs30.ts`, the new one should be named `cs31.ts`
			- This is regardless of the directory that the file is stored in
	- `import`s should be relative to `src`
	- Multiple scripts may be related to a single rule; remember to keep them to a single purpose

	Implement CSS, if applicable:

	- In `src/static/themes/[name].ts`
		- `[name]` is a shortened version of the rule name, or whatever makes sense for the CSS
	- Typically, a rule only contains CSS if it is a theme

4. Register the rule in `src/rules/rules.ts`

	- Add a `name` according to the name of the rule determined in step 1
	- Add a `description`
		- This is displayed below on the options page
		- This should describe the user-facing functionality of the rule
	- Populate the `contentScripts`
		- Each entry should have:
			1. `url` - The URL to run on. Matches wildcard `*`. Try to reuse this if possible, using the `TICKET_URL` object.
			2. (optional) `script` - The path of the uncompiled content script to run, relative from the `src/contentScripts` directory
			3. (optional) `css` - The path of the CSS to run, relative from the `static/themes` directory
			- The `script` key [inclusive] or the `css` key must be set.
		- Multiple entries can be set for a single rule
			- E.g., a script can be to run on two different pages for the rule
			- These are bundled and all turned on/off as the feature is toggled

5. Set the rule's defaults in `src/rules/presets.ts`

	- Must be `false` for "All Off" and `true` for "All On"
	- Generally:
		- Should be `true` for "Non-TSHD Default" only if it is a feature that is nearly essential or would make sense to have been a built-in feature
		- Should be `true` for "Default" if it is true for "Non-TSHD Default" or if it would be acutely useful for Help Desk employees
		- Should be `true` for "Recommended" if it would be useful for most users
	- The setting for the remaining presets may be requested to be changed by the team
