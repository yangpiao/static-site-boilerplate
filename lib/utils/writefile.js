const fs = require('fs');
const path = require('path');

module.exports = async (filepath, content) => {
  await mkdirP(path.dirname(filepath));
  await writeToFile(filepath, content);
};

// similar to `mkdir -p`
async function mkdirP(dir) {
  const parent = await mkdir(dir);
  if (parent) {
    await mkdirP(parent);
    await mkdir(dir);
  }
}

function mkdir(dir) {
  if (!dir) {
    return Promise.resolve(null);
  }
  return new Promise((resolve, reject) => {
    fs.mkdir(dir, err => {
      if (!err) {
        resolve(null);
      } else {
        switch (err.code) {
          case 'ENOENT':
            resolve(path.dirname(dir));
            break;
          case 'EEXIST':
            fs.lstat(dir, (statErr, stats) => {
              if (statErr || !stats.isDirectory()) {
                reject(err);
              } else {
                resolve(null);
              }
            });
            break;
          default:
            reject(err);
            break;
        }
      }
    });
  });
}

function writeToFile(filepath, content) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filepath, content, err => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}
