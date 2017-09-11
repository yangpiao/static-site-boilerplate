const fs = require('fs');

let counter = 1;

module.exports = path => new Promise((resolve, reject) => {
  const file = {};
  file.path = path;
  fs.lstat(path.absolute, (err, stat) => {
    if (err) {
      reject(err);
      return;
    }
    file.stat = stat;
    if (!stat.isSymbolicLink()) {
      fs.readFile(path.absolute, 'utf8', (err, contents) => {
        if (err) {
          reject(err);
          return;
        }
        file.$id = counter++;
        file.contents = contents;
        resolve(file);
      });
    } else {
      reject(Error('symlink'));
    }
  });
});
