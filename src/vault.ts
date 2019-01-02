/**
 * @file
 * Gets AWS keys from Vault
 */

import * as nodeVault from "node-vault";

export default async function getAwsKeys(
  roleId: string,
  secretId: string,
  endpoint: string,
  secretPath: string
) {
  const vault = nodeVault({
    endpoint
  });

  try {
    const result = await vault.approleLogin({
      role_id: roleId,
      secret_id: secretId
    });

    vault.token = result.auth.client_token;

    return vault.read(secretPath);
  } catch (e) {
    throw e;
  }
}
