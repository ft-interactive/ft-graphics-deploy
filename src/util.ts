/**
 * @file
 * Provides various utility functions
 */

import * as execa from "execa";
import { parse as semver } from "semver";

export const git = async (args: string[]) => {
  const { stdout, stderr } = await execa("git", args);
  if (stderr) {
    throw new Error(stderr);
  } else if (!stdout) {
    throw new Error("No git output");
  }

  return stdout;
};

/**
 * Verifies the system's git is at least v1.7.0.
 */
export const verifyGitVersion = async () => {
  const gitVersionStr = (await git(["--version"])).replace(/[^\d.]/g, "");

  const gitVersion = semver(gitVersionStr);

  if (!gitVersion) {
    throw new Error("Unable to parse Git version or Git not available.");
  } else if (gitVersion.major <= 1 && gitVersion.minor <= 7) {
    throw new Error(
      `Expected git version 32 or higher, but it was: "${gitVersion.version}"`
    );
  }

  return gitVersion;
};

/**
 * Verifies the required options are present; throw if not
 */
export const verifyOptions = ({
  awsKey,
  awsSecret,
  awsRegion,
  bucketName
}: IVerifyOptions) => {
  if (!awsKey) {
    throw new Error("You forgot to specify an AWS_ACCESS_KEY_ID.");
  }

  if (!awsSecret) {
    throw new Error("You forgot to specify an AWS_SECRET_ACCESS_KEY.");
  }

  if (!awsRegion) {
    throw new Error("You forgot to specify an AWS_REGION.");
  }

  if (!bucketName) {
    throw new Error("You forgot to specify a S3 bucket.");
  }
};

interface IVerifyOptions {
  awsKey?: string;
  awsSecret?: string;
  awsRegion?: string;
  bucketName?: string;
  [key: string]: any;
}
