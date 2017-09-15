const fs = require('fs');

module.exports = path => new Promise((resolve, reject) => {
  const file = {};
  fs.lstat(path, (err, stat) => {
    if (err) {
      reject(err);
      return;
    }
    file.stat = stat;
    if (!stat.isSymbolicLink()) {
      fs.readFile(path, 'utf8', (err, contents) => {
        if (err) {
          reject(err);
          return;
        }
        file.contents = contents;
        resolve(file);
      });
    } else {
      reject(Error('symlink'));
    }
  });
});
