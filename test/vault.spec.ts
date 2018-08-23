/**
 * @file
 * Spec for Vault helpers
 */

import * as chai from "chai";
import * as sinon from "sinon";
import vault from "../src/vault";

const should = chai.should();

describe("Vault functionality", () => {
  describe("exports", () => {
    it("exports default", () => {
      should.exist(vault);
    });
  });
});
