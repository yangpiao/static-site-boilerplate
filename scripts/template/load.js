const nunjucks = require('nunjucks');
const path = require('path');
const glob = require('glob');

const EAGER_COMPILE = true;
const INCLUDE_DIR = '_include/';
const SPECIAL_DIR = '_special/';

module.exports = dir => {
  const environment = nunjucks.configure(dir);
  const templateCache = {
    templates: {},
    special: {},
    addGlobal: environment.addGlobal.bind(environment),
    addFilter: environment.addFilter.bind(environment)
  };

  return new Promise((resolve, reject) => {
    glob('**/*.{html,xml}', { cwd: dir }, (err, filenames) => {
      if (!err) {
        filenames.forEach(filename => {
          if (filename.indexOf(INCLUDE_DIR) > -1) return;

          const special = (filename.indexOf(SPECIAL_DIR) > -1);
          const template = environment.getTemplate(filename, EAGER_COMPILE);
          // const name = path.basename(filename, path.extname(filename));
          if (special) {
            const name = path.basename(filename, path.extname(filename));
            templateCache.special[name] = template;
          // } else if (!templateCache.templates[name]) {
          //   templateCache.templates[name] = template;
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
};
