/**
 * @file
 * Spec for cli entry point
 */

import * as chai from "chai";
import * as sinon from "sinon";
import cli from "../src/cli";

const should = chai.should();

describe("cli entry point", () => {
  it("exports default", () => {
    should.exist(cli);
  });
});
