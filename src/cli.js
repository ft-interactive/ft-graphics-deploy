// @flow

import meow from 'meow';
import execa from 'execa';
import parseGitHubURL from 'parse-github-url';
import input from 'input';
import help from './help';
import Deployer from './Deployer';
import verifyGit from './verifyGit';

(async () => {
  // use meow to parse CLI arguments
  const cli = meow({
    help,
  }, {
    alias: {
      h: 'help',
    },
  });

  // define our defaults - some of which come from environment variables
  const defaults = {
    localDir: 'dist',
    awsKey: process.env.AWS_KEY_PROD,
    awsSecret: process.env.AWS_SECRET_PROD,
    bucketName: process.env.BUCKET_NAME_PROD,
    awsRegion: process.env.AWS_REGION_PROD || 'eu-west-1',
  };

  const options = { ...defaults, ...cli.flags };

  // unless provided, magically infer the variables that determine our deploy targets
  if (!options.projectName || !options.sha || !options.branchName) {
    await verifyGit();

    // infer the project name from the GitHub repo name
    if (!options.projectName) {
      const originURL = await execa.stdout('git', ['config', '--get', 'remote.origin.url']);

      const { repo, host } = parseGitHubURL(originURL);

      if (host !== 'github.com') {
        throw new Error(
          `Expected git remote "origin" to be a github.com URL, but it was: ${originURL}`,
        );
      }

      options.projectName = repo;
    }

    // use the SHA of the current commit
    if (!options.sha) {
      options.sha = await execa.stdout('git', ['rev-parse', '--verify', 'HEAD']);
    }

    // use the name of the branch we're on now
    if (!options.branchName) {
      options.branchName = await execa.stdout('git', ['rev-parse', '--abbrev-ref', '--verify', 'HEAD']);
    }
  }

  // TODO validate options

  // report options (except secrets)
  console.log(
    '\nOptions:\n' +
    `  local dir: ${options.localDir}\n` +
    `  project name: ${options.projectName}\n` +
    `  sha: ${options.sha}\n` +
    `  branch name: ${options.branchName}\n` +
    `  assets prefix: ${options.assetsPrefix}\n`,
  );

  // ask for confirmation
  if (!options.confirm && !(await input.confirm('Continue?', { default: false }))) {
    process.exit();
  }

  // construct our deployer
  const deployer = new Deployer(options);

  // TODO: listen to events and show progress

  // deploy!
  await deployer.execute();

  // report success
  // if (options.sha) {
  //   console.log(cyan(`Permanent link to this commit:\n http://${options.bucketName}.s3-website-eu-west-1.amazonaws.com/v2/${options.projectName}/${options.sha}`));
  // }
  //
  // if (options.branchName) {
  //   console.log(cyan(`Branch deployed:\n http://${options.bucketName}.s3-website-eu-west-1.amazonaws.com/v2/${options.projectName}/${options.sha}`));
  // }
})();
