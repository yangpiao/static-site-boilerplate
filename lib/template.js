const nunjucks = require('nunjucks');
const path = require('path');
const glob = require('glob');
const moment = require('moment');
const config = require('./config');
const { crossReference } = require('./utils');

const EAGER_COMPILE = true;
const INCLUDE_DIR = '_include/';

function createEnvironment(dir) {
  const environment = nunjucks.configure(dir);
  environment.addFilter('time', (input, format) => moment(input).format(format));
  environment.addFilter('xref', (filename, prop) => {
    const cr = crossReference.get(filename);
    if (!cr) return null;
    prop = prop || 'url';
    return cr[prop];
  });
  environment.addGlobal('$now', Date.now());
  environment.addGlobal('$site', config.site);
  return environment;
}

function createTemplateCache(environment) {
  return {
    pages: {},
    blog: {},
    addGlobal: environment.addGlobal.bind(environment),
    addFilter: environment.addFilter.bind(environment),
    customize: props => {
      if (props.globals) {
        for (let [key, value] of Object.entries(props.globals)) {
          environment.addGlobal(key, value);
        }
      }
      if (props.filters) {
        for (let [key, value] of Object.entries(props.filters)) {
          environment.addFilter(key, value);
        }
      }
    }
  }
}

module.exports = {
  load(dir) {
    const environment = createEnvironment(dir);
    const templateCache = createTemplateCache(environment);
    const blogTemplates = new Set();
    if (config.blog && config.blog.templates) {
      Object.values(config.blog.templates).forEach(template => {
        blogTemplates.add(template);
      });
    }

    return new Promise((resolve, reject) => {
      glob('**/*.{htm,html,xml}', { cwd: dir }, (err, filenames) => {
        if (!err) {
          filenames.forEach(filename => {
            if (blogTemplates.has(filename)) {
              templateCache.blog[filename] =
                environment.getTemplate(filename, EAGER_COMPILE);
              return;
            }
            if (filename.startsWith(INCLUDE_DIR)) return;
            const template = environment.getTemplate(filename, EAGER_COMPILE);
            templateCache.pages[filename] = template;
            templateCache.pages['/' + filename] = template;
            const ext = path.extname(filename);
            const filenameNoExt = filename.substring(0, filename.length - ext.length);
            templateCache.pages[filenameNoExt] = template;
          });

          resolve(templateCache);
        } else {
          reject(err);
        }
      });
    });
  }
};

