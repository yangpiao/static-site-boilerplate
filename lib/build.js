console.time('[BUILD]');

const process = require('process');
const path = require('path');
const { accessSync, constants } = require('fs');
const cwd = process.cwd();

// reads build config
const OPTS_CONFIG = '--config=';
let configFile;

for (let argument of process.argv) {
  if (argument.startsWith(OPTS_CONFIG)) {
    configFile = argument.substring(OPTS_CONFIG.length);
  }
}

try {
  configFile = path.join(cwd, configFile || 'build-config.js');
  accessSync(configFile, constants.R_OK);
} catch(ex) {
  console.error('config file is not found');
  process.exit(1);
}

const {
  DIST,
  POSTS,
  PAGES,
  TEMPLATES,
  SITE_CONFIG
} = require(configFile);

// exits if one or more arguments are missing
if (!TEMPLATES || !POSTS || !DIST || !SITE_CONFIG) {
  console.error('missing config');
  process.exit(1);
}

// build
const { readConfig } = require('./utils');
const parse = require('./parse');
const loadTemplates = require('./template');
const render = require('./render');

async function build() {
  try {
    const config = await readConfig(path.join(cwd, SITE_CONFIG));
    const [ templates, data ] = await Promise.all([
      loadTemplates(TEMPLATES, config),
      parse({ posts: POSTS, pages: PAGES }, config)
    ]);
    await render({ data, templates, config, outputDir: DIST });
  } catch (error) {
    console.error(error);
  } finally {
    console.timeEnd('[BUILD]');
  }
}

build();