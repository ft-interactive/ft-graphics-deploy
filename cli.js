#! /usr/bin/env node -r ts-node/register

require('./setup');
require('./src/cli').default();
