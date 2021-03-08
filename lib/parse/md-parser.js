const { EOL } = require('os');
const marked = require('marked');
const hljs = require('highlight.js');
const { crossReference } = require('../utils');

const mdOptions = {
  gfm: true,
  tables: true,
  breaks: true,
  smartLists: true,
  smartypants: true,
  headerPrefix: 'post-heading-',
  langPrefix: 'hljs hljs--',
  highlight: (code, lang) => {
    if (!lang || !hljs.getLanguage(lang)) return code;
    else return hljs.highlight(lang, code, true).value;
  }
};

module.exports = {
  renderer: mdRenderer(mdOptions),
  parse(source) {
    return this.renderer.render(source);
  }
};

function mdRenderer(options) {
  const renderer = new marked.Renderer();
  let tocHeadings = [];

  Object.assign(renderer, {
    render(source) {
      this.resetToc();
      const content = marked(source);
      const toc = this.getToc();
      return { content, toc };
    },

    blockquote: (quote) => `<blockquote class="md-quote">${EOL}${quote}</blockquote>${EOL}`,
    listitem: (text) => `<li class="md-list__item">${text}</li>${EOL}`,

    list(body, ordered) {
      const type = ordered ? 'ol' : 'ul';
      const className = 'md-list md-list--' + (ordered ? 'ordered' : 'unordered');
      return `<${type} class="${className}">${body}</${type}>${EOL}`;
    },

    getToc: () => tocHeadings,
    resetToc: () => { tocHeadings = []; },
    heading(text, level) {
      const id = this.options.headerPrefix + '-' + (tocHeadings.length + 1) + '-' +
        text.replace(/[^\w\u00C0-\u1FFF\u3040-\uD7AF]+/g, '-')
          .replace(/^-*|-*$/g, '')
          .toLowerCase();
      tocHeadings.push({ level, text, id });
      return `
        <h${level} class="md-heading" id="${id}">
          <a class="md-anchor" href="#${id}" aria-hidden="true">
          <i class="md-anchor__icon"></i></a>${text}
        </h${level}>
      `;
    },

    paragraph(text) {
      if (text.indexOf('<img ') === 0) {
        const match = text.match(/ title="([^"]*)"/i);
        const title = match && match[1];
        const figcaption = !title ? '' :
          `<figcaption class="md-figcaption">${title}</figcaption>`;
        text = text.replace('class="md-image"', 'class="md-image--block"');
        return `
          <figure class="md-figure">
            ${text}
            ${figcaption}
          </figure>
        `;
      } else {
        return `<p class="md-paragraph">${text}</p>${EOL}`;
      }
    },

    image(href, title, text) {
      title = title ? `title="${title}"` : '';
      return `<img class="md-image" src="${href}" alt="${text}" ${title}>`;
    },

    link(href, title, text) {
      const crLink = href.match(/^\$!(.+[^\s\.])$/i);
      if (crLink && crLink.length === 2) {
        const cr = crossReference.get(crLink[1]);
        if (cr) {
          href = cr.url;
          title = cr.title;
        }
      }
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
      return `<a class="md-link" href="${href}" title="${title || ''}">${text}</a>`;
    },

    code(code, lang, escaped) {
      if (this.options.highlight) {
        const out = this.options.highlight(code, lang);
        if (out != null && out !== code) {
          escaped = true;
          code = out;
        }
      }
      code = escaped ? code : escapeHTML(code, true);
      lang = this.options.langPrefix + (lang ? escapeHTML(lang, true) : 'no-highlight');
      return `
        <pre class="md-code-block"><code class="${lang}">${code}</code></pre>
      `;
    }
  });

  marked.setOptions(Object.assign({ renderer }, options));

  return renderer;
}

function escapeHTML(html, encode) {
  return html
    .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
