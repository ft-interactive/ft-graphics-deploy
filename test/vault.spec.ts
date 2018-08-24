/**
 * @file
 * Spec for Vault helpers
 */

import * as chai from "chai";
import proxyquire from "proxyquire";
import * as sinon from "sinon";
import sinonChai from "sinon-chai";

chai.use(sinonChai);
const should = chai.should();

describe("Vault functionality", () => {
  const vaultApproleLoginStub = sinon.stub();
  const vaultReadStub = sinon.stub();
  const vaultStub = sinon.stub().returns({
    approleLogin: vaultApproleLoginStub,
    read: vaultReadStub
  });

  const vault = proxyquire("../src/vault", {
    "node-vault": vaultStub
  }).default;

  describe("exports", () => {
    it("exports default", () => {
      should.exist(vault);
    });
  });

  describe("default export", () => {
    // console.dir(nodeVault.default);

    const roleId = "test-role";
    const secretId = "test-secret";
    const endpoint = "test-endpoint";
    const secretPath = "test-secret-path";

    beforeEach(() => {
      vaultStub.returns({
        approleLogin: vaultApproleLoginStub,
        read: vaultReadStub
      });

      vaultApproleLoginStub.resolves({
        auth: {
          client_token: "test-token"
        }
      });

      vaultReadStub.resolves({
        data: {
          AWS_KEY_PROD: "test",
          AWS_SECRET_PROD: "test"
        }
      });
    });

    afterEach(() => {
      sinon.reset();
    });

    it("requests credentials from Vault", async () => {
      const result = await vault(roleId, secretId, endpoint, secretPath);
      result.data.should.eql({
        AWS_KEY_PROD: "test",
        AWS_SECRET_PROD: "test"
      });
    });
  });
});
