/**
 * @file
 * Spec for Deployer class
 */

import * as chai from "chai";
import { readFileSync } from "fs";
import { resolve } from "path";
import proxyquire from "proxyquire";
import sinon from "sinon";
import sinonChai from "sinon-chai";

chai.use(sinonChai);
const should = chai.should();

describe("Deployer class", () => {
  let inst: any;
  const putObjectStub = sinon.stub();
  const { default: Deployer } = proxyquire("../src/Deployer", {
    "aws-sdk": {
      // prettier-ignore
      S3: function() { // tslint:disable-line
        return { putObject: putObjectStub };
      }
    }
  });
  beforeEach(() => {
    putObjectStub.returns({ promise: () => Promise.resolve(true) });
    inst = new Deployer({
      assetsPrefix: "https://ig.ft.com/v2/__assets/",
      awsRegion: "eu-west-1",
      bucketName: "test-bucket",
      localDir: resolve(__dirname, "..", "fixture", "dist"),
      projectName: "test-project",
      targets: ["test"]
    });
  });

  afterEach(() => {
    putObjectStub.resetHistory();
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
      putObjectStub.callCount.should.equal(4);
      putObjectStub.should.have.been.calledWith({
        ACL: "public-read",
        Body: readFileSync(
          resolve(__dirname, "..", "fixture", "dist", "foo.abc123.js")
        ),
        Bucket: "test-bucket",
        CacheControl: "max-age=365000000, immutable",
        Key: `v2/__assets/test-project/foo.abc123.js`
      });
      putObjectStub.should.have.been.calledWith({
        ACL: "public-read",
        Body: readFileSync(
          resolve(__dirname, "..", "fixture", "dist", "foo.abc123.js")
        ),
        Bucket: "test-bucket",
        CacheControl: "max-age=60",
        ContentType: "application/javascript",
        Key: `v2/test-project/test/foo.abc123.js`
      });
      putObjectStub.should.have.been.calledWith({
        ACL: "public-read",
        Body: readFileSync(
          resolve(__dirname, "..", "fixture", "dist", "index.html")
        ),
        Bucket: "test-bucket",
        CacheControl: "max-age=60",
        ContentType: "text/html",
        Key: `v2/test-project/test/index.html`
      });
      putObjectStub.should.have.been.calledWith({
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
