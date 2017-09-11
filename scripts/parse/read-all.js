const path = require('path');
const glob = require('glob');
const async = require('async');
const readfile = require('./readfile');

function getPaths(pattern, dir) {
  return new Promise((resolve, reject) => {
    glob(pattern, { cwd: dir }, (err, filenames) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(filenames.map(name => ({
        relative: name,
        absolute: path.resolve(dir, name)
      })));
    });
  });
}

module.exports = dir =>
  getPaths('**/*.md', dir).then(paths => Promise.all(paths.map(readfile)));
