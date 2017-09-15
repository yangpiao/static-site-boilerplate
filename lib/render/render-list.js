const path = require('path');

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
      urls[current] = url;
      postList.push({
        url: url,
        posts: page,
        pagination: { current, total, urls }
      });
    });
  } else {
    postList.push({
      url: params.url(1),
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
