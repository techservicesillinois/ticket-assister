# Ticket Assister

> Helping you handle TDX tickets more efficiently.

[View on the Chrome Web Store](https://chrome.google.com/webstore/detail/ticket-assister-for-teamd/eaiopmfjdmdalcdlmabkekblibicpeih)

## Info

Ticket Assister (stylized TkAst) optimizes your workflow with TDX tickets by setting defaults, filling out forms, and consolidating information.
It reduces your cognitive load so that you can focus on getting work done accurately and efficiently.

It has many features, all of which can be toggled on and off in the Options page.

## Building/Deployment

0. Make sure that `package.json` and `manifest.json` have their version numbers bumped

    - Extension web stores will reject the build if it is the same version number as the current uploaded version

1. `npm run build`

    - This will build for production, i.e. for URLs at https://help.uillinois.edu/TDNext/*

    - This will generate files in the `build/` directory
        - As a side effect, all previous files in the `build` directory will be removed
    
    - Two main scripts are ran in this command
        1. `vite build`
            - this builds the pages, e.g. the Options page and the default popup (index) page
        2. `node buildContentScripts.mjs`
            - this builds each of the content scripts
            - each script is packaged as an IIFE to allow turning the features on and off at runtime

2. Zip the output files

    1. Zip all of the files from the `build/` directory.
    *Do not zip the `build` directory in itself. Only the contents.*

    2. Name the zipped file
    
        - For Chrome, `YYYYMMDD_tkast_X.Y.Z.zip`

        - For Firefox, `YYYYMMDD_tkast_X.Y.Z-f.zip`

        - `YYYYMMDD` is the current date (which the files were built)
        - `X.Y.Z` is the version number
    
    3. Save the zip file in the `releases/` directory

        - This directory is ignored from source control

3. Upload package to the relevant extension store

    - Upload the zip file and Submit for Review

## Testing

`npm run test`

- This runs all unit tests
    - This verifies that all of the content scripts ("rules") are properly associated
    - This runs basic tests on helper functions
    - These tests are not yet comprehensive i.e. do not include integration tests with Playwright
