const path = require('path');
const parser = require('./md-parser');

const MORE = /\<!--[\s]+\$more[\s]+--\>/m;
const TOC = /^\<!--[\s]+\$TOC[\s]+--\>$/m;
const TOC_LIST_START = '<ol class="toc__list">';
const TOC_LIST_END = '</ol>';
const TOC_ITEM_END = '</li>';

function parseMarkdown(raw) {
  const article = parser.parse(raw);
  const content = article.content;
  const toc = generateTOC(article.toc);
  const result = {
    content: content.replace(TOC, toc),
    toc: toc
  };
  // excerpt
  const parts = raw.split(MORE);
  if (parts.length > 1) {
    result.excerpt = parser.parse(parts.shift()).content;
  } else {
    result.excerpt = '';
  }
  return result;
}

function generateTOC(toc, tracker) {
  tracker = tracker || 0;
  let result = '<div class="toc"><h2 class="toc__title">Contents</h2>';
  const levels = [ 0 ];
  toc.forEach(item => {
    result += addFragment(levels, item)
  });
  for (let i = 1; i < levels.length; i++) {
    result += TOC_ITEM_END + TOC_LIST_END;
  }
  result += '</div>';
  return result;
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

function tocItemStart(heading) {
  return '<li class="toc__item"><a class="toc__link" href="#' +
      heading.id + '">' + heading.text + '</a>';
}

module.exports = parseMarkdown;