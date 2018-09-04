/**
 * @file
 * Spec for helper functions
 */

import * as chai from "chai";
import * as proxyquire from "proxyquire";
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

  describe("#verifyGitVersion()", () => {
    const gitRawStub = sinon.stub();
    const { verifyGitVersion } = proxyquire("../src/util", {
      "simple-git/promise": () => ({
        raw: gitRawStub
      })
    });

    beforeEach(() => {
      gitRawStub.withArgs(["--version"]).resolves("git version 99.88.77");
    });

    afterEach(() => {
      gitRawStub.reset();
    });

    it("gets Git version", async () => {
      try {
        const result = await verifyGitVersion();

        result.major.should.equal(99);
        result.minor.should.equal(88);
        result.patch.should.equal(77);
      } catch (e) {
        should.not.exist(e);
      }
    });
  });

  describe("#verifyOptions()", () => {
    it("throws if an option isn't supplied", () => {
      (() =>
        util.verifyOptions({
          awsKey: "test",
          awsRegion: "test",
          awsSecret: "test",
          bucketName: "test"
        })).should.not.throw();

      (() =>
        util.verifyOptions({
          awsKey: undefined,
          awsRegion: "test",
          awsSecret: "test",
          bucketName: "test"
        })).should.throw();

      (() =>
        util.verifyOptions({
          awsKey: "test",
          awsRegion: undefined,
          awsSecret: "test",
          bucketName: "test"
        })).should.throw();

      (() =>
        util.verifyOptions({
          awsKey: "test",
          awsRegion: "test",
          awsSecret: undefined,
          bucketName: "test"
        })).should.throw();

      (() =>
        util.verifyOptions({
          awsKey: "test",
          awsRegion: "test",
          awsSecret: "test",
          bucketName: undefined
        })).should.throw();
    });
  });
});
