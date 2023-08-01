# Todo

## Before launch

- cache getUser in chrome.storage (refresh weekly)
- setNotice in optionsInteractions needs to be more consistent and display better
- logging should print current function and maybe stacktrace (at least for log.e)
- set up basic macros
- try catch content scripts
- try catch sw and optionsInteractions
- options: on click input, if preset !== custom, move all options from preset to custom, flipping the one clicked
- add `@src/*`, `@utils/*`, `@config`, `@rules/*` import paths
    - fix src/rules/* not allowing absolute imports (eslint)
- add logging for debugging in production
- maybe add logging of error before `rej()`ing with generic error
    - > throw custom error with message

- Set up minifiers for HTML/CSS
    - ensure strips comments

## Backlog

- make configurable template for rule "TDX/Ticket/Update/Prefill response"

- remove `pages/` prefix on manifest.json
    - get vite to place that directory at the root

- complete more of spec as defined in doc

- Resolve todos scattered throughout files
