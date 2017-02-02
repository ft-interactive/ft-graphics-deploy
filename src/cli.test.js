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

  // check branch deploy
  {
    const response = await fetch(`http://${process.env.BUCKET_NAME_DEV}.s3-website-eu-west-1.amazonaws.com/v2/ft-graphics-deploy/test-fixture/master/`);
    t.true(response.ok);
    t.true(/it works/.test(await response.text()));
  }

  // check sha deploy
  {
    const response = await fetch(`http://${process.env.BUCKET_NAME_DEV}.s3-website-eu-west-1.amazonaws.com/v2/ft-graphics-deploy/test-fixture/abcdefghijklmnop12345/`);
    t.true(response.ok);
    t.true(/it works/.test(await response.text()));
  }

  t.pass();
});
