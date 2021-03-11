const nunjucks = require('nunjucks');
const { extname, sep } = require('path');
const { promisify } = require('util');
const glob = promisify(require('glob'));
const moment = require('moment');

const EAGER_COMPILE = true;
const INCLUDE_DIR = '_include/';
const BLOG_DIR = '_blog/';


class TemplateCache {
  environment;

  cache = Object.create(null);

  constructor(environment) {
    this.environment = environment;
  }

  get(templateName) {
    if (!templateName) {
      return null;
    }

    if (this.cache[templateName]) {
      return this.cache[templateName];
    }

    // if no template is found, normalizes the name and tries again
    let name = templateName;
    if (name.indexOf(sep) === 0) {
      name = name.substring(1);
    }
    if (!extname(name)) {
      name = `${name}.html`;
    }
    return this.cache[name] || null;
  }
}

function createEnvironment(dir, config) {
  const environment = nunjucks.configure(dir, {
    trimBlocks: true,
    lstripBlocks: true
  });
  environment.addFilter('datetime', (input, format) => moment(input).format(format));
  environment.addGlobal('$now', Date.now());
  environment.addGlobal('$site', config);
  return environment;
}

async function loadTemplates(dir, config) {
  const environment = createEnvironment(dir, config);
  const templates = new TemplateCache(environment);

  const filenames = await glob('**/*.{htm,html,xml}', { cwd: dir });
  filenames.forEach(filename => {
    // templates in _includes
    if (filename.startsWith(INCLUDE_DIR)) {
      return;
    }

    const template = environment.getTemplate(filename, EAGER_COMPILE);
    const ext = extname(filename);

    // blog templates (in _blog)
    if (filename.startsWith(BLOG_DIR)) {
      const name = filename.substring(BLOG_DIR.length, filename.length - ext.length);
      templates.cache[`blog:${name}`] = template;
      return;
    }

    templates.cache[filename] = template;
  });

  return templates;
};

module.exports = loadTemplates;