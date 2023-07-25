# Todo

## Next up

- make rules/rules.test.ts
	- checks contentScripts/* iff rules[*].scriptPath
	- ensures that each file starts with like `// <rule name="Cerebro flagger/Alert/Red">`
		- and has the correct name for its file
- work on null checks in `optionsInteractions.ts`

- finish options page
	- show descriptions
	- tree out
	- save Custom to storage
- create page:
	- finish quick select
	- auto select Service Request
	- auto select Phone as source
	- modify tabindex
	- hide additional contacts (click to expand)
- cache getUser in chrome.storage (refresh weekly)

- cerebro connection

## General

- add logging for debugging in production
- add `@src/*`, `@utils/*`, `@config`, `@rules/*` import paths
    - fix src/rules/* not allowing absolute imports
- maybe add logging of error before `rej()`ing with generic error
    - > throw custom error with message
- remove `pages/` prefix on manifest.json
    - get vite to place that directory at the root

- finish spec as defined in doc
- Prepare for production
    - Clean up manifest.json to only contain necessary permissions
    - Set up minifiers
        - For JS
        - Get vite to stop spitting out additional .mjs files
        - For HTML/CSS
            - also strip comments
- Resolve todos scattered throughout files
