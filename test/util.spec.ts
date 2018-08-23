/**
 * @file
 * Spec for helper functions
 */

import * as chai from "chai";
import * as sinon from "sinon";
import * as util from "../src/util";

const should = chai.should();

describe("util functions", () => {
  describe("exports", () => {
    it("exports verifyGitVersion", () => {
      should.exist(util.verifyGitVersion);
    });
    it("exports verifyOptions", () => {
      should.exist(util.verifyOptions);
    });
  });
});
