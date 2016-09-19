const fs = require('fs');

let counter = 1;

module.exports = (path, callback) => {
  const file = {};
  file.path = path;
  fs.lstat(path.absolute, (err, stat) => {
    if (err) {
      callback(err);
      return;
    }
    file.stat = stat;
    if (!stat.isSymbolicLink()) {
      fs.readFile(path.absolute, 'utf8', (err, contents) => {
        if (err) {
          callback(err);
          return;
        }
        file.$id = counter++;
        file.contents = contents;
        callback(null, file);
      });
    } else {
      callback(Error('symlink'));
    }
  });
};
