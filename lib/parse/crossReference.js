let postCache = {};

module.exports = {
  set(cache) {
    postCache = cache;
  },
  get: relativePath => {
    const { url, title } = postCache[relativePath]
    return { url, title };
  }
};
