import test from 'ava';
import execa from 'execa';
import path from 'path';

test('CLI', async (t) => {
  const cliPath = path.resolve(__dirname, '..', 'cli.js');

  const stdout = await execa.stdout(cliPath, ['--help']);

  t.true(/All flags are optional/.test(stdout));

  // TODO: full deploy test against dev buckets
});
