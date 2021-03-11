const PAGE_PREFIX = 'page:';
const POST_PREFIX = 'post:';
const EXT = '.md';

function getCrossReference(name, contents) {
  let key = name;
  if (!name.endsWith(EXT)) {
    key = `${name}${EXT}`;
  }
  if (!name.startsWith(PAGE_PREFIX) && !name.startsWith(POST_PREFIX)) {
    key = `${POST_PREFIX}${key}`;
  }
  return contents[key] || null;
}

module.exports = getCrossReference;