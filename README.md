# ft-graphics-deploy [![Build Status][circle-image]][circle-url]

CLI for deploying built static websites to an S3 bucket.

## Usage

```
$ ft-graphics-deploy --help

  CLI for deploying FT Graphics projects

  > ft-graphics-deploy [FLAGS...]
  ────────────────────────────────────────────────────────────────────
  All flags are optional when this command is run from a typical FT
  Graphics project repo in CI.
  ────────────────────────────────────────────────────────────────────
  AWS settings
  If not provided, these settings are taken from env vars
  ("AWS_KEY_PROD", "AWS_SECRET_PROD", etc.)
    --aws-key
    --aws-secret
    --aws-region
    --bucket-name

  Upload settings
  If not provided, these are deduced from the git situation in the CWD.
    --project-name
    --sha - unique reference for this commit
    --branch-name
    --local-dir - what to upload; defaults to ./dist
    --assets-prefix - base for asset URLs; affects the rev-manifest and all
                      HTML/CSS files

  Other
    --confirm - skip the confirmation dialogue
    --help - show this help and exit
```

## Development

Clone this repo and run `yarn` to install dependencies.

Run `yarn build:watch` and `yarn test:watch` in separate terminal tabs while developing. (The first one watches `src` and builds to `dist`. The second one runs ava tests in `dist`.

To publish to npm: bump the version (e.g. `npm version patch`) and do `yarn build && npm publish`. You'll need privileges. (TO DO: auto-publish from Circle.)

<!-- badge URLs -->
[circle-url]: https://circleci.com/gh/ft-interactive/ft-graphics-deploy
[circle-image]: https://circleci.com/gh/ft-interactive/ft-graphics-deploy.svg?style=svg
