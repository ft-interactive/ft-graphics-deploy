/**
 * @file
 * Spec for cli help file
 */

import * as chai from "chai";
import * as sinon from "sinon";
import help from "../src/help";

const should = chai.should();

describe("help page documentation", () => {
  describe("exports", () => {
    it("exports default", () => {
      should.exist(help);
      help.should.be.a("string");
    });
  });
});
