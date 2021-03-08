const fs = require('fs');
const { promisify } = require('util');
const lstat = promisify(fs.lstat);
const readFile = promisify(fs.readFile);

module.exports = async function readfile(path) {
  const filePath = path.absolute || path;
  const stat = await lstat(filePath);
  if (stat.isSymbolicLink()) {
    throw Error('Symlink is not supported');
  }
  const contents = await readFile(filePath, 'utf8');
  return {
    stat,
    contents,
    path: typeof path === 'string' ? { absolute: path } : path
  };
};