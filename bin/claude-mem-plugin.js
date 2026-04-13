#!/usr/bin/env node
'use strict';

const { runCli } = require('../cli/index.js');

runCli(process.argv.slice(2)).then((exitCode) => {
  process.exit(exitCode);
});
