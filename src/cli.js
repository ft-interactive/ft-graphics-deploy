// @flow

import meow from 'meow';
import execa from 'execa';
import parseGitHubURL from 'parse-github-url';
import { cyan, green } from 'chalk';
import input from 'input';
import help from './help';
import Deployer from './Deployer';
import verifyGit from './verifyGit';

const getURL = (options, urlType: 'sha' | 'branchName') => (
  `http://${options.bucketName}.s3-website-${options.awsRegion}.amazonaws.com/v2${
    options.preview ? '-preview' : ''
  }/${options.projectName}/${options[urlType]}/`
);

(async () => {
  // use meow to parse CLI arguments
  const cli = meow({ help }, {
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
    preview: false,
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

  // validate options
  if (!options.bucketName) throw new Error('bucketName not set');
  if (!options.awsRegion) throw new Error('awsRegion not set');
  if (!options.sha) throw new Error('sha not set');
  if (!options.branchName) throw new Error('branchName not set');

  // handle special --get-branch-url or --get-commit-url use cases
  if (options.getBranchUrl || options.getCommitUrl) {
    process.stdout.write(getURL(options, options.getBranchUrl ? 'branchName' : 'sha'));

    process.exit();
  }

  // report options (except secrets)
  console.log(
    '\nOptions:\n' +
    `  local dir: ${options.localDir}\n` +
    `  project name: ${options.projectName}\n` +
    `  sha: ${options.sha}\n` +
    `  branch name: ${options.branchName}\n` +
    `  assets prefix: ${options.assetsPrefix}\n` +
    `  preview: ${options.preview}`,
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

  // report result
  console.log(green('Deployment complete.'));

  if (options.sha) {
    console.log(cyan(`  ${getURL(options, 'sha')}`));
  }

  if (options.branchName) {
    console.log(cyan(`  ${getURL(options, 'branchName')}`));
  }
})();
