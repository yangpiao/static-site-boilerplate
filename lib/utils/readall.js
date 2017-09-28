const path = require('path');
const util = require('util');
const glob = util.promisify(require('glob'));
const readfile = require('./readfile');

async function getPaths(dir, pattern) {
  const filenames = await glob(pattern, { cwd: dir });
  return filenames.map(name => ({
    relative: name,
    absolute: path.resolve(dir, name)
  }));
}

async function read(filePath) {
  const file = await readfile(filePath.absolute);
  file.path = filePath;
  file.basename = path.basename(filePath.relative, path.extname(filePath.relative));
  return file;
}

module.exports = async (dir, pattern) => {
  if (!dir) return [];
  const paths = await getPaths(dir, pattern);
  return await Promise.all(paths.map(read));
};
