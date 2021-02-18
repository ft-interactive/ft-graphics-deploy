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
    it("exports verifyGitVersion()", () => {
      should.exist(util.verifyGitVersion);
    });
    it("exports verifyOptions()", () => {
      should.exist(util.verifyOptions);
    });
    it("exports git()", () => {
      should.exist(util.git);
    });
  });

  describe("#verifyGitVersion()", () => {
    const gitRawStub = sinon.stub();
    const { verifyGitVersion } = proxyquire("../src/util", {
      execa: (...args: any[]) => gitRawStub(...args)
    });

    beforeEach(() => {
      gitRawStub.withArgs("git", ["--version"]).resolves({
        stderr: null,
        stdout: "git version 99.88.77"
      });
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

  describe("#verifyAppleGitVersion()", () => {
    const gitRawStub = sinon.stub();
    const { verifyGitVersion } = proxyquire("../src/util", {
      execa: (...args: any[]) => gitRawStub(...args)
    });

    beforeEach(() => {
      gitRawStub.withArgs("git", ["--version"]).resolves({
        stderr: null,
        stdout: "git version 2.21.0 (Apple Git-122)"
      });
    });

    afterEach(() => {
      gitRawStub.reset();
    });

    it("gets Git version", async () => {
      try {
        const result = await verifyGitVersion();

        result.major.should.equal(2);
        result.minor.should.equal(21);
        result.patch.should.equal(0);
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

  describe("#git()", () => {
    const execaStub = sinon.stub();
    const { git } = proxyquire("../src/util", {
      execa: (...args: any[]) => execaStub(...args)
    });

    beforeEach(() => {
      execaStub.resolves({
        stderr: null,
        stdout: true,
      });
    })

    afterEach(() => {
      execaStub.reset();
    });

    it('passes the arguments to git', async () => {
      const output = await git(['herpa', 'derpa']);

      output.should.be.true;
      execaStub.should.have.been.calledWith('git', ['herpa', 'derpa']);
    });
  });
});
