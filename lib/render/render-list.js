const path = require('path');
const config = require('../config');

module.exports = renderList;

// params = { list, pagination, template, data, url, outputDir }
function renderList(params) {
  const pages = split(params.list, params.pagination);
  const total = pages.length;
  const postList = [];
  const urls = [];
  if (total > 1) {
    pages.forEach((page, i) => {
      const current = i + 1;
      const url = params.url(current);
      const absoluteUrl = config.site.url + path.join('/', url);
      urls[current] = url;
      postList.push({
        url,
        absoluteUrl,
        posts: page,
        pagination: { current, total, urls }
      });
    });
  } else {
    const url = params.url(1);
    const absoluteUrl = config.site.url + path.join('/', url);
    postList.push({
      url,
      absoluteUrl,
      posts: pages[0]
    });
  }

  return postList.map(data => {
    const filename = path.extname(data.url) ? '' : '/index.html';
    const outputFile = path.join(params.outputDir, data.url, filename);
    return {
      file: outputFile,
      content: params.template.render(Object.assign(data, params.data))
    };
  });
}

function split(list, size) {
  if (!size) return [ list ];
  const result = [];
  for (let i = 0; i < list.length; i += size) {
    result.push(list.slice(i, i + size));
  }
  return result;
}
