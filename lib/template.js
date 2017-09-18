const nunjucks = require('nunjucks');
const path = require('path');
const glob = require('glob');
const moment = require('moment');
const config = require('./config');

const EAGER_COMPILE = true;
const INCLUDE_DIR = '_include/';
const SPECIAL_DIR = '_special/';

function createEnvironment(dir) {
  const environment = nunjucks.configure(dir);
  environment.addFilter('time', (input, format) => moment(input).format(format));
  environment.addGlobal('$fn', {
    now: Date.now,
    joinPaths: path.join.bind(path)
  });
  environment.addGlobal('$site', config.site);
  return environment;
}

function createTemplateCache(environment) {
  return {
    templates: {},
    special: {},
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

    return new Promise((resolve, reject) => {
      glob('**/*.{html,xml}', { cwd: dir }, (err, filenames) => {
        if (!err) {
          filenames.forEach(filename => {
            if (filename.includes(INCLUDE_DIR)) return;
            const special = filename.includes(SPECIAL_DIR);
            const template = environment.getTemplate(filename, EAGER_COMPILE);
            if (special) {
              const name = path.basename(filename, path.extname(filename));
              templateCache.special[name] = template;
            } else {
              templateCache.templates[filename] = template;
            }
          });

          resolve(templateCache);
        } else {
          reject(err);
        }
      });
    });
  }
};

