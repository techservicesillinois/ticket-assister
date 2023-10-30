# Ticket Assister for TeamDynamix

> Helping you handle TDX tickets more efficiently.

[View on the Chrome Web Store](https://chrome.google.com/webstore/detail/ticket-assister-for-teamd/eaiopmfjdmdalcdlmabkekblibicpeih)

## Info

Ticket Assister (stylized TkAst) optimizes your workflow with TeamDynamix (TDX) tickets by setting defaults, filling out forms, and consolidating information.
It reduces your cognitive load so that you can focus on getting work done accurately and efficiently.

It has many features, all of which can be toggled on and off in the Options page.

## Building/Deployment

0. Install deps

    - install `npm`
    - `npm install` project dependencies

1. Make sure that `package.json` and `manifest.json` have their version numbers bumped

    - Extension web stores will reject the build if it is the same version number as the current uploaded version

2. `npm run build`

    - This will build for production, i.e. for URLs at https://help.uillinois.edu/TDNext/*
        - To build for development, run `npm run build:dev`

    - This will generate files in the `build/` directory
        - As a side effect, all previous files in the `build` directory will be removed
    
    - Two main scripts are ran in this command:
        1. `vite build`
            - this builds the pages, e.g. the Options page and the default popup (index) page
        2. `node buildContentScripts.mjs`
            - this builds each of the content scripts
            - each script is packaged as an IIFE to allow turning the features on and off at runtime

3. Zip the output files

    1. Zip all of the files from the `build/` directory.
    *Do not zip the `build` directory in itself. Only the contents.*

    2. Name the zipped file
    
        - For Chrome, `YYYYMMDD_tkast_X.Y.Z.zip`
        - `YYYYMMDD` is the current date (which the files were built)
        - `X.Y.Z` is the version number

    3. Save the zip file in the `releases/` directory

        - This directory is ignored from source control

4. Upload package to the relevant extension store

    - Upload the zip file and Submit for Review

### Automated Deployment

This repository partially automates the build pipeline for the Chrome Web store.

1. Update the version in `manifest.json` and `package.json` and merge these changes into main

2. `git tag` the latest commit with the version number (e.g., `1.0.0`)

3. A GitHub action will trigger to create a release and associated artifact. Download the artifact zip file

4. Upload the artifact zip file to the Chrome Web Store via the [developer dashboard](https://chrome.google.com/webstore/devconsole)



As of September of 2023, this repository is configured to continue to deploy under the original "Alpo" developer account. This may change in the future.

## Testing

### Automatic testing

Tests are ran automatically with each commit to a pull request.

Manually run unit tests with `npm run test`

- This verifies that all of the content scripts ("rules") are properly associated
- This runs basic tests on helper functions

Manually run integration tests with `npm run test-integration`

- This runs the Playwright test suite
- As of October 2023, these tests are not yet comprehensive

### Manual testing

To install locally and manually test the extension, see [CONTRIBUTING.md](/CONTRIBUTING.md#manual-testing)

## Contributing

Issues and PRs are welcome.
See [CONTRIBUTING.md](/CONTRIBUTING.md) to get started.

## End of Life

This product is supported by Elijah Mock, Cybersecurity, and Technology Services on a best-effort basis.

As of the last update to this README, the expected End-of-Life and End-of-Support dates of this product are February 2024.

End-of-Life was decided upon based on these dependencies:

    Chrome Manifest V3 (undocumented; expected January 2025 or later based on V2 retirement timeline)
    TeamDynamix (quarterly; possible breaking changes February 2024)
    Cerebro (unknown; dynamic release schedule)
