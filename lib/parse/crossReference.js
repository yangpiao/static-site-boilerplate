let postCache = {};

module.exports = {
  set(cache) {
    postCache = cache;
  },
  get: relativePath => {
    if (postCache[relativePath]) {
      const { url, title } = postCache[relativePath];
      return { url, title };
    }
    return null;
  }
};
