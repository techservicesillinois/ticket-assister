# Todo

## Next up
- create page:
	- finish quick select
	- auto select Service Request
	- auto select Phone as source
	- modify tabindex
	- hide additional contacts (click to expand)
- view page:
	- collapse ticket details
		- excpet for Responsibility, Request Area, and Age
	- Button to copy NetID
		- From person requiring service’s Illinois email
	- Link to show full Cerebro details, iCard details, or ISA details (POST)
	- emphasize highlight when prim resp is viewing ticket
- cache getUser with chrome.storage (refresh weekly)

## General

- work on adding functionality to disher.ts
    - get disher.ts to dispatch properly
    - create options page
- maybe add logging of error before `rej()`ing with generic error
    - > throw custom error with message
~~- find a way to test these programmatically~~
- clean up imports to export `testingData` object with them instead
- remove `pages/` prefix on manifest.json
    - get vite to place that directory at the root

- finish spec as defined in doc
- Prepare for production
    - Set up minifiers
        - For JS
        - Get vite to stop spitting out additional .mjs files
        - For HTML/CSS
            - also strip comments
- Resolve todos scattered throughout files
