// @flow

import EventEmitter from 'events';
import fs from 'fs';
import path from 'path';
import s3 from 's3';
import tmp from 'tmp-promise';

export type DeployerOptions = {
  localDir: string, // e.g. '/path/to/dist'

  awsKey: string,
  awsSecret: string,
  awsRegion: string,
  bucketName: string,

  projectName: string, // usually in the form 'ft-interactive/some-project'

  targets: Array<string>, // for reference, the CLI provides two targets: the commit sha and branch name

  preview?: boolean,

  maxAge?: number, // for everything except revved assets

  assetsPrefix?: string, // e.g. "https://example.com/v2/__assets/"
};

type RevManifest = {
  [string]: string,
};

const REV_MANIFEST_FILENAME = 'rev-manifest.json';

export default class Deployer extends EventEmitter {
  options: DeployerOptions;

  constructor(options: DeployerOptions) {
    super();
    this.options = options;
  }

  async execute() {
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
      maxAge,
    } = this.options;

    // load in the rev-manifest
    const revManifest: ?RevManifest = (() => {
      try {
        return JSON.parse(fs.readFileSync(
          path.resolve(localDir, REV_MANIFEST_FILENAME),
          'utf8',
        ));
      } catch (error) {
        if (error.code === 'ENOENT') return undefined;
        throw error;
      }
    })();

    // save an altered version of the rev manifest, if any
    let revManifestTmpPath: string;
    if (revManifest) {
      if (typeof assetsPrefix !== 'string') {
        throw new Error('Expected assetsPrefix to be defined if revManifest is being used');
      }

      const tmpFileDetails: {
        fd: mixed, // file descriptor
        path: string,
      } = await tmp.file();

      revManifestTmpPath = tmpFileDetails.path;

      const modifiedRevManifest: RevManifest = {};
      Object.keys(revManifest).forEach((key) => {
        modifiedRevManifest[key] = `${assetsPrefix}${revManifest[key]}`;
      });

      // $FlowFixMe
      fs.writeSync(tmpFileDetails.fd, JSON.stringify(modifiedRevManifest));
    }

    const revvedFiles = revManifest && Object.values(revManifest);

    // make an S3 client instance
    const client = s3.createClient({
      s3Options: {
        accessKeyId: awsKey,
        secretAccessKey: awsSecret,
        region: awsRegion,
      },
    });

    // upload assets to a special place
    const uploadedAssets = new Promise((resolve, reject) => {
      if (!revvedFiles) {
        resolve();
        return;
      }

      const uploader = client.uploadDir({
        localDir,

        s3Params: {
          Bucket: bucketName,
          Prefix: `v2/__assets/${projectName}/`,
          ACL: 'public-read',
        },

        getS3Params: (localFile, stat, callback) => {
          const relativeLocalFile = path.relative(
            localDir,
            path.resolve(localFile),
          );

          // skip this file if it's not in the rev manifest
          if (revvedFiles.indexOf(relativeLocalFile) === -1) {
            callback(null, null);
            return;
          }

          const fileParams = {};

          // set long-term cache headers, as it's a revved asset
          fileParams.CacheControl = 'max-age=365000000, immutable';

          callback(null, fileParams);
        },
      });

      uploader.on('error', (error) => {
        this.emit('error', error);
        reject(error);
      });

      uploader.on('end', () => {
        this.emit('uploaded', {
          info: 'assets',
        });
        resolve();
      });
    });

    const uploadedBundles = Promise.all(targets.map(target =>
      new Promise((resolve, reject) => {
        const uploader = client.uploadDir({
          localDir,

          deleteRemoved: true,

          s3Params: {
            Bucket: bucketName,
            Prefix: `v2${preview
              ? '-preview'
              : ''}/${projectName}/${target}/`,
            ACL: 'public-read',
          },

          getS3Params: (localFile, stat, callback) => {
            const relativeLocalFile = path.relative(
              localDir,
              path.resolve(localFile),
            );

            if (relativeLocalFile === REV_MANIFEST_FILENAME) {
              callback(null, null);
            }

            const fileParams = {};

            // set cache headers
            fileParams.CacheControl = `max-age=${typeof maxAge === 'number'
              ? maxAge
              : 60}`;

            // use text/html for extensionless files (similar to gh-pages)
            if (path.extname(relativeLocalFile) === '') { fileParams.ContentType = 'text/html'; }

            callback(null, fileParams);
          },
        });

        uploader.on('error', (error) => {
          this.emit('error', error);
          reject(error);
        });

        uploader.on('end', () => {
          this.emit('uploaded', {
            info: `${target} (bundle)`,
          });

          // finally, upload the modifed rev manifest
          if (revManifest) {
            const manifestUploader = client.uploadFile({
              localFile: revManifestTmpPath,

              s3Params: {
                Bucket: bucketName,
                ACL: 'public-read',
                Key: `v2${preview
                  ? '-preview'
                  : ''}/${projectName}/${target}/${REV_MANIFEST_FILENAME}`,
              },
            });

            uploader.on('error', (error) => {
              this.emit('error', error);
              reject(error);
            });

            manifestUploader.on('end', () => {
              this.emit('uploaded', {
                info: `${target} (modified rev-manifest)`,
              });

              resolve();
            });
          } else resolve();
        });
      })));

    await Promise.all([uploadedAssets, uploadedBundles]);

    return this.getURLs();
  }

  /**
   * Returns the base URLs that this deployer would deploy to.
   */
  getURLs() {
    const {
      bucketName,
      projectName,
      awsRegion,
      targets,
      preview,
    } = this.options;

    return targets.map(target =>
      `http://${bucketName}.s3-website-${awsRegion}.amazonaws.com/v2${preview
        ? '-preview'
        : ''}/${projectName}/${target}/`);
  }
}
