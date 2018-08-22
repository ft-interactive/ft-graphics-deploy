/**
 * @file
 * Gets AWS keys from Vault
 */

import nodeVault from 'node-vault';

export default async function getAwsKeys(
  roleId: string,
  secretId: string,
  endpoint: string,
  secretPath: string,
) {
  const vault = nodeVault({
    endpoint,
  });

  try {
    const result = await vault.approleLogin({
      role_id: roleId,
      secret_id: secretId,
    });

    vault.token = result.auth.client_token;

    return vault.read(`${secretPath}/${
      process.env.CIRCLE_PROJECT_REPONAME &&
        process.env.CIRCLE_PROJECT_REPONAME === 'ft-graphics-deploy'
        ? 'testing'
        : 'latest'
    }`);
  } catch (e) {
    throw e;
  }
}
