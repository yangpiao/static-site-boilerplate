const marked = require('marked');
const hljs = require('highlight.js');

const renderer = new marked.Renderer();

// heading
var headings = [];
renderer.heading = function(text, level) {
  const id = this.options.headerPrefix + '-' + (headings.length + 1) + '-' +
    text.replace(/[^\w\u00C0-\u1FFF\u3040-\uD7AF]+/g, '-')
      .replace(/^-*|-*$/g, '')
      .toLowerCase();
  headings.push({ level, text, id });
  return '<h' + level + ' class="md-heading" id="' + id + '">' +
    '<a class="md-anchor" href="#' + id + '" aria-hidden="true">' +
    '<i class="md-anchor__icon"></i></a>' + text + '</h' + level + '>\n';
};

function addTocEntry(level, text, id) {
  renderer.toc.push({ id, level, text });
}

const imgTitle = / title="([^"]*)"/i;
renderer.paragraph = (text) => {
  if (text.indexOf('<img ') === 0) {
    const match = text.match(imgTitle);
    const title = match && match[1];
    const figcaption = !title ? '' :
      '<figcaption class="md-figcaption">' + title + '</figcaption>';
    return '<figure class="md-figure">' +
      text.replace('class="md-image"', 'class="md-image--block"') +
      figcaption + '</figure>';
  } else {
    return '<p class="md-paragraph">' + text + '</p>\n';;
  }
};

function escapeHTML(html, encode) {
  return html
    .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
renderer.code = function(code, lang, escaped) {
  if (this.options.highlight) {
    const out = this.options.highlight(code, lang);
    if (out != null && out !== code) {
      escaped = true;
      code = out;
    }
  }

  if (!lang) {
    return '<pre class="md-code-block"><code class="' +
      this.options.langPrefix + 'no-highlight">' +
      (escaped ? code : escapeHTML(code, true)) + '\n</code></pre>\n';
  }

  return '<pre class="md-code-block"><code class="' +
    this.options.langPrefix + escapeHTML(lang, true) + '">' +
    (escaped ? code : escapeHTML(code, true)) + '\n</code></pre>\n';
};

renderer.image = function(href, title, text) {
  var out = '<img class="md-image" src="' + href + '" alt="' + text + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += this.options.xhtml ? '/>' : '>';
  return out;
};

renderer.list = (body, ordered) => {
  const type = ordered ? 'ol' : 'ul';
  return '<' + type + ' class="md-list">\n' + body + '</' + type + '>\n';
};
renderer.listitem = (text) => '<li class="md-list__item">' + text + '</li>\n';

renderer.link = function(href, title, text) {
  if (this.options.sanitize) {
    try {
      const prot = decodeURIComponent(unescape(href))
        .replace(/[^\w:]/g, '')
        .toLowerCase();

      if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0) {
        return '';
      }
    } catch (e) {
      return '';
    }
  }
  var out = '<a class="md-link" href="' + href + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += '>' + text + '</a>';
  return out;
};

renderer.blockquote = (quote) =>
  '<blockquote class="md-quote">\n' + quote + '</blockquote>\n';

marked.setOptions({
  renderer: renderer,
  breaks: true,
  headerPrefix: 'post-heading-',
  langPrefix: 'hljs hljs--',
  highlight: (code, lang) => {
    if (!lang || !hljs.getLanguage(lang)) return code;
    else return hljs.highlight(lang, code, true).value;
  }
});

module.exports = {
  parse: function (source) {
    headings = [];
    return {
      content: marked(source),
      toc: headings
    };
  },

  renderer: renderer
};
