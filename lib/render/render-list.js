const { join, extname } = require('path');

function split(list, size) {
  if (!size) return [ list ];
  const result = [];
  for (let i = 0; i < list.length; i += size) {
    result.push(list.slice(i, i + size));
  }
  return result;
}

function renderList({
  list,
  pageSize,
  rootUrl,
  getPageUrl,
  contents,
  template,
  context,
  outputDir
}) {
  const pages = split(list, pageSize);
  const total = pages.length;

  const urls = pages.map((_, i) => {
    const pageNumber = i + 1;
    const url = getPageUrl(pageNumber);
    return {
      url,
      pageNumber,
      absoluteUrl: join(rootUrl, url)
    }
  });

  const contexts = pages.map((items, i) => Object.assign({
    url: urls[i].url,
    absoluteUrl: urls[i].absoluteUrl,
    posts: items.map(name => contents[name]),
    pagination: {
      total,
      current: urls[i].pageNumber,
      previous: i > 0 && urls[i - 1] || null,
      next: i < total - 1 && urls[i + 1] || null,
      pages: urls,
    }
  }, context));

  return contexts.map(context => {
    const filename = extname(context.url) ? '' : '/index.html';
    const filePath = join(outputDir, context.url, filename);
    return {
      filePath,
      fileContent: template.render(context)
    };
  });
}

module.exports = renderList;