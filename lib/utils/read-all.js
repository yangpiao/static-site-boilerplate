const { basename, extname, resolve } = require('path');
const { promisify } = require('util');
const glob = promisify(require('glob'));
const readFile = require('./read-file');

module.exports = async function readAll(dir, pattern) {
  if (!dir) {
    return [];
  }

  const filenames = await glob(pattern, { cwd: dir });
  const paths = filenames.map((name) => ({
    absolute: resolve(dir, name),
    relative: name,
    basename: basename(name)
  }));
  return await Promise.all(paths.map(readFile));
};