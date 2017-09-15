const path = require('path');
const glob = require('glob');
const async = require('async');
const readfile = require('./readfile');

function getPaths(dir, pattern) {
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

async function read(path) {
  const file = await readfile(path.absolute);
  file.path = path;
  return file;
}

module.exports = async function(dir, pattern) {
  if (!dir) return [];
  const paths = await getPaths(dir, pattern);
  return await Promise.all(paths.map(read));
}
