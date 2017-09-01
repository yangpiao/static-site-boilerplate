const path = require('path');
const writeFile = require('./write-file');
const renderList = require('./render-list');
const basename = name => path.basename(name, path.extname(name));

module.exports = render;


/**
 * contents = { posts, files, list, byTag, tags, tagUrls }
 * templateCache = { addGlobal, addFilter, templates, special }
 */
function render(contents, templateCache, config, outputDir) {
  const blog = config.blog;
  const pageData = config.pageData;
  const pageUrlPattern = blog.pageUrlPattern;
  const fileCache = contents.files;
  const tagUrls = contents.tagUrls;
  const output = [];

  // posts
  const postPages = contents.list.map(post => ({
    file: path.join(outputDir, fileCache[post.$id].output),
    content: templateCache.special.post.render({
      isPostPage: true,
      post: post,
      url: post.url
    })
  }));
  output.push(...postPages);

  // list page
  const indexPages = renderList({
    template: templateCache.special.index,
    list: contents.list,
    pagination: blog.pagination,
    url: page => {
      if (page > 1) {
        return pageUrlPattern.replace('{{page}}', page);
      } else {
        return '/';
      }
    },
    outputDir: outputDir
  });
  output.push(...indexPages);

  // tag page
  contents.tags.forEach(tag => {
    const tagPages = renderList({
      template: templateCache.special.tag,
      list: contents.byTag[tag],
      pagination: blog.pagination,
      data: {
        page: { title: '#' + tag }
      },
      url: page => {
        if (page > 1) {
          return path.join(tagUrls[tag], pageUrlPattern.replace('{{page}}', page));
        } else {
          return tagUrls[tag];
        }
      },
      outputDir: outputDir
    });
    output.push(...tagPages);
  });

  // others
  const pages = Object.keys(templateCache.templates).map(name => ({
    file: path.join(outputDir, name),
    content: templateCache.templates[name].render({
      url: path.join('/', name.replace(/(\/|^)index.html$/i, '')),
      page: pageData[basename(name)] || pageData[name] || {}
    })
  }));
  output.push(...pages);

  return Promise.all(output.map(({file, content}) => writeFile(file, content)));
}
