# Todo

## Before launch

- patches:
    - cs38.ts:13 --- auto take is not working (Closed, auto-view)
        - maybe getTicketDatumsRecursively isn't loaded
    - ticket/view: pressing showAll causes madness
        - likely due to detecting DOM changes... find a way to ignore this (e.g. make a div#tkast-expand and have DOM listener check for this

- update manifest's listed version to 1.0.0

## Next release

1.1.0

- **glob Apps/X/Tickets to allow things besides U of I - Main (still in UIUC help.uillinois)**
    - config.ts, middleman.ts, person.ts, **ticketActions.ts**, shared.ts, ticketEdit.ts, ticketView.ts
- make configurable template for rule "TDX/Ticket/Update/Prefill response"

## Backlog

- add a consistent level of logging throughout

- add `@src/*`, `@utils/*`, `@config`, `@rules/*` import paths
    - fix src/rules/* not allowing absolute imports (eslint)
- Set up minifiers for HTML
    - ensure strips comments

- remove `pages/` prefix on manifest.json
    - get vite to place that directory at the root

- complete more of spec as defined in doc

- add log collection service (add a transport)
- Resolve todos scattered throughout files
