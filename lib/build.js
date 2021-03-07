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
  configFile = configFile || 'build-config.js';
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
} = require(path.join(cwd, configFile));

// exits if one or more arguments are missing
if (!TEMPLATES || !POSTS || !DIST || !SITE_CONFIG) {
  console.error('missing config');
  process.exit(1);
}

// build
const config = require('./config');
const parse = require('./parse');
const template = require('./template');
const render = require('./render');

async function build() {
  try {
    await config.load(path.join(cwd, SITE_CONFIG));
    let [templateCache, contents] = await Promise.all([
      template.load(TEMPLATES),
      parse({ posts: POSTS, pages: PAGES })
    ]);
    render(contents, templateCache, DIST);
    console.timeEnd('[BUILD]');
  } catch (error) {
    console.error(error);
  }
}

build();