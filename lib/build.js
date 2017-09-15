console.time('[BUILD]');
const process = require('process');
const path = require('path');
const OPTS_TEMPLATES = '--templates=';
const OPTS_POSTS = '--posts=';
const OPTS_PAGES = '--pages=';
const OPTS_OUTPUT = '--output=';
const OPTS_CONFIG = '--site-config=';
const args = {};

// commmand line arguments
const cwd = process.cwd();
for (let argument of process.argv) {
  if (argument.startsWith(OPTS_TEMPLATES)) {
    args.templates = argument.substring(OPTS_TEMPLATES.length);
  } else if (argument.startsWith(OPTS_POSTS)) {
    args.posts = argument.substring(OPTS_POSTS.length);
  } else if (argument.startsWith(OPTS_PAGES)) {
    args.pages = argument.substring(OPTS_PAGES.length);
  } else if (argument.startsWith(OPTS_OUTPUT)) {
    args.output = argument.substring(OPTS_OUTPUT.length);
  } else if (argument.startsWith(OPTS_CONFIG)) {
    args.config = path.join(cwd, argument.substring(OPTS_CONFIG.length));
  }
}

// exits if one or more arguments are missing
if (!args.templates || !args.posts || !args.output || !args.config) {
  console.error('incorrect arguments');
  process.exit(1);
}


// build
const config = require('./config');
const parse = require('./parse');
const template = require('./template');
const render = require('./render');

async function build() {
  try {
    await config.load(args.config);
    let [templateCache, contents] = await Promise.all([
      template.load(args.templates),
      parse({ posts: args.posts, pages: args.pages })
    ]);
    render(contents, templateCache, args.output);
    console.timeEnd('[BUILD]');
  } catch (error) {
    console.error(error);
  }
}

build();
