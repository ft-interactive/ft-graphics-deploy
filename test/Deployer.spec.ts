/**
 * @file
 * Spec for Deployer class
 */

import AWS from "aws-sdk-mock";
import * as chai from "chai";
import { resolve } from "path";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import Deployer from "../src/Deployer";

chai.use(sinonChai);
const should = chai.should();

describe("Deployer class", () => {
  let inst: Deployer;
  const putObjectSpy = sinon.spy();

  beforeEach(() => {
    inst = new Deployer({
      assetsPrefix: "https://ig.ft.com/v2/__assets/",
      awsRegion: "eu-west-1",
      bucketName: "test-bucket",
      localDir: resolve(__dirname, "..", "fixture", "dist"),
      projectName: "test-project",
      targets: ["test"]
    });

    AWS.mock("S3", "putObject", async (params: any) => {
      return putObjectSpy(params);
    });
  });

  afterEach(() => {
    AWS.restore("S3", "putObject");
    putObjectSpy.resetHistory();
  });

  describe("exports", () => {
    it("exports default", () => {
      should.exist(Deployer);
    });
  });

  describe("#execute()", () => {
    it("uploads expected files to S3", async () => {
      const res = await inst.execute();

      res.should.be.a("array");
      res[0].should.equal(
        "http://test-bucket.s3-website-eu-west-1.amazonaws.com/v2/test-project/test/"
      );
      putObjectSpy.callCount.should.equal(4);
      putObjectSpy.firstCall.should.have.been.calledWithMatch({
        ACL: "public-read",
        Body: "console.log('hi');\n",
        Bucket: "test-bucket",
        CacheControl: "max-age=365000000, immutable",
        Key: `v2/__assets/test-project/foo.abc123.js`
      });
      putObjectSpy.secondCall.should.have.been.calledWithMatch({
        ACL: "public-read",
        Body: "console.log('hi');\n",
        Bucket: "test-bucket",
        CacheControl: "max-age=60",
        Key: `v2/test-project/test/foo.abc123.js`
      });
      putObjectSpy.thirdCall.should.have.been.calledWithMatch({
        ACL: "public-read",
        Body: "<h1>it works</h1>\n",
        Bucket: "test-bucket",
        CacheControl: "max-age=60",
        Key: `v2/test-project/test/index.html`
      });
      putObjectSpy.lastCall.should.have.been.calledWithMatch({
        ACL: "public-read",
        Body: '{"foo.js":"foo.abc123.js"}',
        Bucket: "test-bucket",
        CacheControl: "max-age=60",
        ContentType: "application/json",
        Key: "v2/test-project/test/rev-manifest.json"
      });
    });
  });

  describe("#getURLs()", () => {
    it("returns an array of URLs", () => {
      const urls = inst.getURLs();

      urls.should.be.a("array");
      urls[0].should.equal(
        `http://test-bucket.s3-website-eu-west-1.amazonaws.com/v2/test-project/test/`
      );
    });
  });
});
