import test from 'ava';
import execa from 'execa';
import path from 'path';
import fetch from 'node-fetch';

const projectRoot = path.resolve(__dirname, '..');
const cliPath = path.resolve(projectRoot, 'cli.js');
const fixturePath = path.resolve(projectRoot, 'fixture');

test('CLI help works', async (t) => {
  const stdout = await execa.stdout(cliPath, ['--help']);

  t.true(/All flags are optional/.test(stdout));
});

test('CLI deployment works', async (t) => {
  const child = execa(cliPath, [
    '--aws-key', process.env.AWS_KEY_DEV,
    '--aws-secret', process.env.AWS_SECRET_DEV,
    '--bucket-name', process.env.BUCKET_NAME_DEV,
    '--aws-region', process.env.AWS_REGION_DEV,
    '--project-name', 'ft-graphics-deploy/test-fixture',
    '--branch-name', 'master',
    '--sha', 'abcdefghijklmnop12345',
    '--assets-prefix', 'http://example.com/assets/',
    '--confirm',
  ], {
    cwd: fixturePath,
    stdio: 'inherit',
  });

  try {
    await child;
  } catch (error) {
    // do not print the error message, as it may contain secrets
    t.fail('Command exited with non-zero code');
    return;
  }

  // check both targets got deployed
  await Promise.all(['master', 'abcdefghijklmnop12345'].map(async (ref) => {
    const htmlRes = await fetch(`http://${process.env.BUCKET_NAME_DEV}.s3-website-eu-west-1.amazonaws.com/v2/ft-graphics-deploy/test-fixture/${ref}/`);
    t.true(htmlRes.ok);
    t.true(/it works/.test(await htmlRes.text()));

    const revManifestRes = await fetch(`http://${process.env.BUCKET_NAME_DEV}.s3-website-eu-west-1.amazonaws.com/v2/ft-graphics-deploy/test-fixture/${ref}/rev-manifest.json`);
    t.true(revManifestRes.ok);

    t.deepEqual(await revManifestRes.json(), {
      'foo.js': 'http://example.com/assets/foo.abc123.js',
    });
  }));
});

test('CLI preview deployment works', async (t) => {
  const child = execa(cliPath, [
    '--aws-key', process.env.AWS_KEY_DEV,
    '--aws-secret', process.env.AWS_SECRET_DEV,
    '--bucket-name', process.env.BUCKET_NAME_DEV,
    '--aws-region', process.env.AWS_REGION_DEV,
    '--project-name', 'ft-graphics-deploy/test-fixture',
    '--branch-name', 'master',
    '--sha', 'abcdefghijklmnop12345',
    '--assets-prefix', 'http://example.com/assets/',
    '--preview',
    '--confirm',
  ], {
    cwd: fixturePath,
    stdio: 'inherit',
  });

  try {
    await child;
  } catch (error) {
    // do not print the error message, as it may contain secrets
    t.fail('Command exited with non-zero code');
    return;
  }

  // check both targets got deployed
  await Promise.all(['master', 'abcdefghijklmnop12345'].map(async (ref) => {
    const htmlRes = await fetch(`http://${process.env.BUCKET_NAME_DEV}.s3-website-eu-west-1.amazonaws.com/v2-preview/ft-graphics-deploy/test-fixture/${ref}/`);
    t.true(htmlRes.ok);
    t.true(/it works/.test(await htmlRes.text()));

    const revManifestRes = await fetch(`http://${process.env.BUCKET_NAME_DEV}.s3-website-eu-west-1.amazonaws.com/v2-preview/ft-graphics-deploy/test-fixture/${ref}/rev-manifest.json`);
    t.true(revManifestRes.ok);

    t.deepEqual(await revManifestRes.json(), {
      'foo.js': 'http://example.com/assets/foo.abc123.js',
    });
  }));
});

test('Can get the branch URL', async (t) => {
  const child = execa(cliPath, [
    '--aws-key', process.env.AWS_KEY_DEV,
    '--aws-secret', process.env.AWS_SECRET_DEV,
    '--bucket-name', process.env.BUCKET_NAME_DEV,
    '--aws-region', process.env.AWS_REGION_DEV,
    '--project-name', 'ft-graphics-deploy/test-fixture',
    '--branch-name', 'master',
    '--sha', 'abcdefghijklmnop12345',
    '--assets-prefix', 'http://example.com/assets/',
    '--get-branch-url',
  ], { cwd: fixturePath });

  try {
    await child;
  } catch (error) {
    // do not print the error message, as it may contain secrets
    t.fail('Command exited with non-zero code');
    return;
  }

  const { stdout } = await child;

  t.is(stdout, `http://${process.env.BUCKET_NAME_DEV}.s3-website-${process.env.AWS_REGION_DEV}.amazonaws.com/v2/ft-graphics-deploy/test-fixture/master/`);
});

test('Can get the commit URL', async (t) => {
  const child = execa(cliPath, [
    '--aws-key', process.env.AWS_KEY_DEV,
    '--aws-secret', process.env.AWS_SECRET_DEV,
    '--bucket-name', process.env.BUCKET_NAME_DEV,
    '--aws-region', process.env.AWS_REGION_DEV,
    '--project-name', 'ft-graphics-deploy/test-fixture',
    '--branch-name', 'master',
    '--sha', 'abcdefghijklmnop12345',
    '--assets-prefix', 'http://example.com/assets/',
    '--get-commit-url',
  ], { cwd: fixturePath });

  try {
    await child;
  } catch (error) {
    // do not print the error message, as it may contain secrets
    t.fail('Command exited with non-zero code');
    return;
  }

  const { stdout } = await child;

  t.is(stdout, `http://${process.env.BUCKET_NAME_DEV}.s3-website-${process.env.AWS_REGION_DEV}.amazonaws.com/v2/ft-graphics-deploy/test-fixture/abcdefghijklmnop12345/`);
});
