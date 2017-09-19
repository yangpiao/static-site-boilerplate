const PAGE_PREFIX = 'page!';
const PREFIX_LENGTH = PAGE_PREFIX.length;

let cache = {
  posts: {},
  pages: {}
};

module.exports = {
  init(postCache, pageCache) {
    cache.posts = postCache;
    cache.pages = pageCache;
  },
  get: key => {
    if (key.startsWith(PAGE_PREFIX)) {
      return cache.pages[key.substring(PREFIX_LENGTH)] || null;
    }
    return cache.posts[key] || null;
  }
};
