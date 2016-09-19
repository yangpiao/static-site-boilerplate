const path = require('path');
const yaml = require('js-yaml');
const parser = require('./parser');

module.exports = parse;


function parse(file) {
  try {
    const data = markdown(file.contents);
    data.$id = file.$id;
    const time = Date.parse(data.time);
    if (!isNaN(time)) {
      data.time = new Date(time);
    } else {
      data.time = new Date();
    }
    if (!typeof data.tags === 'string') {
      data.tags = [ data.tags ];
    } else if (!Array.isArray(data.tags)) {
      data.tags = [];
    }
    return data;
  } catch (err) {
    console.error(err);
  }
}

const FRONT_MATTER_START = '---\n';
const FRONT_MATTER_END = '\n...\n';
const MORE = /\<!--[\s]+\$more[\s]+--\>/m;
const TOC = /^\<!--[\s]+\$TOC[\s]+--\>$/m;

function markdown(raw) {
  var metaData = null, excerpt = '';
  // meta
  if (raw.indexOf(FRONT_MATTER_START) === 0) {
    const index = raw.indexOf(FRONT_MATTER_END);
    const meta = raw.substring(FRONT_MATTER_START.length, index);
    metaData = meta ? yaml.safeLoad(meta) : null;
    raw = raw.substring(index + FRONT_MATTER_END.length);
  }
  // content
  const article = parser.parse(raw);
  const content = article.content;
  const toc = generateTOC(article.toc);
  const result = {
    content: content.replace(TOC, generateTOC(article.toc)),
    toc: toc
  };
  // excerpt
  const parts = raw.split(MORE);
  if (parts.length > 1) {
    result.excerpt = parser.parse(parts.shift()).content;
  } else {
    result.excerpt = '';
  }
  return Object.assign(result, metaData);
}

const TOC_LIST_START = '<ol class="toc__list">';
const TOC_LIST_END = '</ol>';
const TOC_ITEM_END = '</li>';

function generateTOC(toc, tracker) {
  tracker = tracker || 0;
  var result = '<div class="toc"><h2 class="toc__title">Contents</h2>';
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
