import { cyan, grey } from 'chalk';

export default (`
  ${grey('>')} ft-graphics-deploy ${grey('[FLAGS...]')}
  ${grey('────────────────────────────────────────────────────────────────────')}
  ${grey(`All flags are optional when this command is run from a typical FT
  Graphics project repo in CI.`)}
  ${grey('────────────────────────────────────────────────────────────────────')}
  ${cyan('AWS settings')}
  ${grey('If not provided, these settings are inherited from env vars ("AWS_KEY" etc.)')}
    --aws-key
    --aws-secret
    --aws-region
    --bucket-name

  ${cyan('Upload settings')}
  ${grey('If not provided, these are deduced from the git situation in the CWD.')}
    --project-name
    --sha - unique reference for this commit
    --branch-name
    --local-dir - what to upload; defaults to ./dist
    --assets-prefix - base for asset URLs; affects the rev-manifest and HTML/CSS files

  ${cyan('Other')}
    --confirm - skip the confirmation dialogue
    --help - show this help and exit
`);
