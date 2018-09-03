#! /usr/bin/env node

require('ts-node/register');
require('./setup.ts');
require('./src/cli.ts').default();
