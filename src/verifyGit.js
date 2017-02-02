// @flow

import execa from 'execa';

/**
 * Verifies the system's git is at least v1.7.0.
 */
export default async () => {
  const gitVersion = (await execa.stdout('git', ['--version'])).replace(/^[^0-9]*/, '');

  if (parseFloat(gitVersion) < 1.7) {
    throw new Error(`Expected git version 32 or higher, but it was: "${gitVersion}"`);
  }
};
