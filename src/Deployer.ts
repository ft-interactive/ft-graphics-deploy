/**
 * @file
 * EventEmitter-based deployer class.
 * This does all the work.
 */

import { S3 } from "aws-sdk";
import EventEmitter from "events";
import { createReadStream, readFileSync, writeFileSync } from "fs";
import { sync as glob } from "glob";
import { lookup as mime } from "mime-types";
import { extname, resolve } from "path";
import tmp from "tmp-promise";

export interface IDeployerOptions {
  localDir: string; // e.g. '/path/to/dist'
  awsKey?: string;
  awsSecret?: string;
  awsRegion?: string;
  bucketName: string;

  projectName: string; // usually in the form 'ft-interactive/some-project'

  targets: string[]; // for reference, the CLI provides two targets: the commit sha and branch name

  preview?: boolean;

  maxAge?: number; // for everything except revved assets

  assetsPrefix?: string; // e.g. "https://example.com/v2/__assets/"
}

interface IRevManifest {
  [key: string]: string;
}

const REV_MANIFEST_FILENAME = "rev-manifest.json";

export default class Deployer extends EventEmitter {
  public options: IDeployerOptions;

  constructor(options: IDeployerOptions) {
    super();
    this.options = options;
  }

  public async execute() {
    const {
      localDir,
      bucketName,
      projectName,
      awsKey,
      awsSecret,
      awsRegion,
      targets,
      preview,
      assetsPrefix,
      maxAge
    } = this.options;

    // load in the rev-manifest
    const revManifest: IRevManifest | null = (() => {
      try {
        return JSON.parse(
          readFileSync(resolve(localDir, REV_MANIFEST_FILENAME), "utf-8")
        );
      } catch (error) {
        if (error.code === "ENOENT") {
          return undefined;
        }
        throw error;
      }
    })();

    // save an altered version of the rev manifest, if any
    const modifiedRevManifest: IRevManifest = {};
    if (revManifest) {
      if (typeof assetsPrefix !== "string") {
        throw new Error(
          "Expected assetsPrefix to be defined if revManifest is being used"
        );
      }

      Object.keys(revManifest).forEach(key => {
        modifiedRevManifest[key] = `${assetsPrefix}${revManifest[key]}`;
      });
    }

    const revvedFiles = revManifest && Object.values(modifiedRevManifest);

    // make an S3 client instance
    const client = new S3({
      accessKeyId: awsKey,
      region: awsRegion,
      secretAccessKey: awsSecret
    });

    const allFiles: string[][] = glob(`${localDir}/**/*.*`)
      .filter(filePath => !filePath.includes(REV_MANIFEST_FILENAME))
      .map(filePath => [filePath, filePath.replace(`${localDir}/`, "")]);

    if (revvedFiles) {
      const uploadedAssets = Promise.all(
        allFiles
          .filter(([filePath, filename]) =>
            revvedFiles.find(revved => revved.includes(filename as string))
          )
          .map(([filePath, filename]) =>
            client
              .putObject({
                ACL: "public-read",
                Body: readFileSync(filePath as string),
                Bucket: bucketName,
                CacheControl: "max-age=365000000, immutable",
                Key: `v2/__assets/${projectName}/${filename}`
              })
              .promise()
          )
      ).then(() => this.emit("uploaded", { info: "assets" }));
    }

    await targets.reduce(async (queue: Promise<any[]>, target: string) => {
      const acc = await queue;
      const uploadedTarget = Promise.all(
        allFiles
          .filter(
            ([, filename]) =>
              filename && !filename.includes(REV_MANIFEST_FILENAME)
          )
          .map(([filePath, filename]) =>
            client
              .putObject({
                ACL: "public-read",
                Body: readFileSync(filePath as string),
                Bucket: bucketName,
                CacheControl: `max-age=${
                  typeof maxAge === "number" ? maxAge : 60
                }`,
                ContentType:
                  extname(filename as string) === ""
                    ? "text/html"
                    : mime(extname(filename as string)) || undefined,
                Key: `v2${
                  preview ? "-preview" : ""
                }/${projectName}/${target}/${filename}`
              })
              .promise()
          )
      ).then(() => {
        this.emit("uploaded", {
          info: `${target} (bundle)`
        });
      });

      if (revManifest) {
        await client
          .putObject({
            ACL: "public-read",
            Body: JSON.stringify(revManifest),
            Bucket: bucketName,
            CacheControl: `max-age=${typeof maxAge === "number" ? maxAge : 60}`,
            ContentType: "application/json",
            Key: `v2${
              preview ? "-preview" : ""
            }/${projectName}/${target}/${REV_MANIFEST_FILENAME}`
          })
          .promise()
          .then(() =>
            this.emit("uploaded", { info: `${target} (modified rev-manifest)` })
          );
      }
      return [...acc, await uploadedTarget];
    }, Promise.resolve([]));

    return this.getURLs();
  }

  /**
   * Returns the base URLs that this deployer would deploy to.
   */
  public getURLs() {
    const {
      bucketName,
      projectName,
      awsRegion,
      targets,
      preview
    } = this.options;

    return targets.map(
      target =>
        `http://${bucketName}.s3-website-${awsRegion}.amazonaws.com/v2${
          preview ? "-preview" : ""
        }/${projectName}/${target}/`
    );
  }
}
