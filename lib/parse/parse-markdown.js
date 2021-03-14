const parser = require('./md-parser');

const MORE = /\<!--[\s]+\$more[\s]+--\>/m;
const TOC = /^[\s]+\<!--[\s]+\$toc[\s]+--\>[\s]+$/m;
const TOC_LIST_START = '<ol class="md-list md-list--ordered">';
const TOC_LIST_END = '</ol>';
const TOC_ITEM_END = '</li>';

function tocItemStart(heading) {
  return `
    <li class="md-list__item">
      <a class="toc__link" href="#${heading.id}">${heading.text}</a>
  `;
}

function addFragment(levels, item) {
  let result = '';
  let lastLevel = levels[levels.length - 1];
  const currentLevel = item.level;
  if (currentLevel > lastLevel) {
    result += TOC_LIST_START + tocItemStart(item);
    levels.push(currentLevel);
  } else if (currentLevel === lastLevel) {
    result += TOC_ITEM_END + tocItemStart(item);
  } else {
    while (lastLevel > currentLevel && levels.length > 2) {
      result += TOC_ITEM_END + TOC_LIST_END;
      levels.pop();
    }
    if (lastLevel > currentLevel && levels.length === 2) {
      levels[1] = currentLevel;
    }
    result += addFragment(levels, item);
  }
  return result;
}

function generateTOC(toc) {
  if (!toc.length) {
    return '';
  }

  const levels = [ 0 ];
  const fragments = toc.map(item => addFragment(levels, item));
  const rest = levels.map(() => TOC_ITEM_END + TOC_LIST_END);
  rest.pop();

  return `
    <section class="toc">
      <h2 class="toc__title">Contents</h2>
      ${fragments.join('')}
      ${rest.join('')}
    </section>
  `;
}

function parseMarkdown(raw, contentCache) {
  const article = parser.parse(raw, contentCache);
  const content = article.content;
  const toc = generateTOC(article.toc);
  const result = {
    content: content.replace(TOC, toc),
    toc: toc
  };
  // excerpt
  const parts = raw.split(MORE);
  if (parts.length > 1) {
    result.excerpt = parser.parse(parts.shift(), contentCache).content;
    result.content = result.content.replace(MORE, '');
  } else {
    result.excerpt = '';
  }
  return result;
}

module.exports = parseMarkdown;