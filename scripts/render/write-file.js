const fs = require('fs');
const path = require('path');
// path.dirname

module.exports = (filepath, content) => {
  return mkdirP(path.dirname(filepath))
    .then(() => writeToFile(filepath, content));
};


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

// similar to `mkdir -p`
function mkdirP(dir) {
  return mkdir(dir).then(parent => {
    if (parent) {
      return mkdirP(parent).then(() => mkdir(dir));
    } else {
      return parent;
    }
  });
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

