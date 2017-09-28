const fs = require('fs');
const util = require('util');
const lstat = util.promisify(fs.lstat);
const readFile = util.promisify(fs.readFile);

module.exports = async path => {
  const file = {};
  const stat = await lstat(path);
  if (stat.isSymbolicLink()) {
    throw Error('Symlink is not supported');
  }
  file.stat = stat;
  const contents = await readFile(path, 'utf8');
  file.contents = contents;
  return file;
};
