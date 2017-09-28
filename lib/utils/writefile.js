const fs = require('fs');
const path = require('path');
const util = require('util');
const lstat = util.promisify(fs.lstat);
const fsmkdir = util.promisify(fs.mkdir);
const writeFile = util.promisify(fs.writeFile);

module.exports = async (filepath, content) => {
  await mkdirP(path.dirname(filepath));
  await writeFile(filepath, content);
};

// similar to `mkdir -p`
async function mkdirP(dir) {
  try {
    await mkdir(dir);
  } catch (err) {
    if (err.code === 'ENOENT') {
      await mkdirP(path.dirname(dir));
      await mkdir(dir);
      return;
    }
    throw err;
  }
}

async function mkdir(dir) {
  if (!dir) return;
  try {
    await fsmkdir(dir);
  } catch (err) {
    if (err.code === 'EEXIST') {
      const stat = await lstat(dir);
      if (stat.isDirectory()) return;
    }
    throw err;
  }
}
