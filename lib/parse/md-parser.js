const marked = require('marked');
const hljs = require('highlight.js');
const { getCrossReference: getXRef } = require('../utils');

function escapeHTML(html, encode) {
  return html
    .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

class Renderer extends marked.Renderer {
  toc = [];

  contentCache = {};

  // cross reference
  getCrossReference(url) {
    const crLink = url.match(/^\$!(.+[^\s\.])$/i);
    if (crLink && crLink.length === 2) {
      const cr = getXRef(crLink[1], contentCache);
      if (cr) {
        return {
          url: cr.url,
          title: cr.title
        };
      }
    }
    return {};
  }

  heading(text, level) {
    const id = this.options.headerPrefix + '-' + (this.toc.length + 1) + '-' +
      text.replace(/[^\w\u00C0-\u1FFF\u3040-\uD7AF]+/g, '-')
        .replace(/^-*|-*$/g, '')
        .toLowerCase();
    this.toc.push({ level, text, id });
    return `
      <h${level} class="md-heading md-heading--${level}" id="${id}">
        ${text}
        <a class="md-anchor" href="#${id}" aria-hidden="true">&num;</a>
      </h${level}>
    `;
  }

  blockquote(quote) {
    return `
      <blockquote class="md-quote">${quote}</blockquote>
    `;
  }

  listitem(text) {
    return `
      <li class="md-list__item">${text}</li>
    `;
  }

  list(body, ordered) {
    const type = ordered ? 'ol' : 'ul';
    const className = 'md-list md-list--' + (ordered ? 'ordered' : 'unordered');
    return `
      <${type} class="${className}">${body}</${type}>
    `;
  }

  paragraph(text) {
    if (text.trim().indexOf('<img ') === 0) {
      const match = text.match(/ title="([^"]*)"/i);
      const title = match && match[1];
      const figcaption = !title ? '' :
        `<figcaption class="md-figure__caption">${title}</figcaption>`;
      text = text.replace('class="md-image"', 'class="md-figure__image"');
      return `
        <figure class="md-figure">
          ${text}
          ${figcaption}
        </figure>
      `;
    }

    return `
      <p class="md-paragraph">${text}</p>
    `;
  }

  image(href, title, text) {
    title = title ? `title="${title}"` : '';
    return `
      <img class="md-image" src="${href}" alt="${text}" ${title}>
    `;
  }

  link(href, title, text) {
    const { url, title: crTitle } = this.getCrossReference(href);
    href = url || href;
    title = crTitle || title;
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
    return `
      <a class="md-link" href="${href}" title="${title || ''}">${text}</a>
    `;
  }

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
}

const defaults = Object.freeze({
  breaks: true,
  smartLists: true,
  smartypants: true,
  headerPrefix: 'post-heading-',
  langPrefix: 'hljs hljs--',

  highlight(code, lang) {
    if (!lang || !hljs.getLanguage(lang)) {
      return code;
    }
    return hljs.highlight(lang, code, true).value;
  }
});
const renderer = new Renderer(defaults);
marked.setOptions(Object.assign({ renderer }, defaults));

module.exports = {
  renderer,

  parse(source, contentCache) {
    this.renderer.contentCache = contentCache;
    this.renderer.toc = [];
    const content = marked(source);
    const toc = this.renderer.toc;
    this.renderer.toc = [];

    return { content, toc };
  }
};