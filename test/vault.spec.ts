/**
 * @file
 * Spec for Vault helpers
 */

import * as chai from "chai";
import * as moxios from "moxios";
import vault from "../src/vault";

chai.should();

describe("Vault functionality", () => {
  beforeEach(() => {
    // import and pass your custom axios instance to this method
    moxios.install();
  });

  describe("default export", () => {
    const roleId = "test-role";
    const secretId = "test-secret";
    const endpoint = "http://test-endpoint";
    const secretPath = "test-secret-path";

    beforeEach(() => {
      moxios.stubRequest(`${endpoint}/v1/auth/approle/login`, {
        response: {
          auth: {
            client_token: "whee"
          }
        },
        status: 200
      });

      moxios.stubRequest(`${endpoint}/v1/test-secret-path`, {
        response: {
          data: {
            AWS_KEY_PROD: "test",
            AWS_SECRET_PROD: "test"
          }
        },
        status: 200
      });
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
