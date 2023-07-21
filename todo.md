# Todo

## Next up

- refactor some of rules/* to utils/*

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

- try out MS Power BI for log dumping
- add logging for debugging in production
- add "@src/*", "@utils/*", and "@config" import paths
    - fix src/rules/* not allowing absolute imports
- try to replace `const browser = require("webextension-polyfill");` with `import * as browser from "webextension-polyfill";`
- maybe add logging of error before `rej()`ing with generic error
    - > throw custom error with message
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
