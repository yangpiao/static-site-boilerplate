const path = require('path');
const glob = require('glob');
const async = require('async');
const readfile = require('./readfile');

module.exports = dir => new Promise((resolve, reject) => {
  glob('**/*.md', { cwd: dir }, (err, filenames) => {
    if (err) {
      reject(err);
      return;
    }
    const paths = filenames.map(name => ({
      relative: name,
      absolute: path.resolve(dir, name)
    }));
    async.map(paths, readfile, (err, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(files);
    });
  });
});
