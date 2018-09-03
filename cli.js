#! /usr/bin/env node

require('ts-node/register');
require('./setup');
require('./src/cli').default();
