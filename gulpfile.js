const { src, dest, series, parallel, watch } = require('gulp');
const { exec } = require('child_process');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const browserSync = require('browser-sync').create();

// paths
const {
  DIST,
  POSTS: PATH_POSTS,
  PAGES: PATH_PAGES,
  TEMPLATES: PATH_TEMPLATES,
  ASSETS: PATH_ASSETS,
  STYLES: PATH_STYLES,
  CSS: PATH_CSS,
  SITE_CONFIG
} = require('./build-config');

const POSTS = `${PATH_POSTS}/**/*.md`;
const PAGES = `${PATH_PAGES}/**/*.md`;
const TEMPLATES = `${PATH_TEMPLATES}/**/*.{html,xml}`;
const ASSETS = `${PATH_ASSETS}/**/*`;
const STYLES = `${PATH_STYLES}/**/*.scss`;
const CSS = `${PATH_CSS}/**/*.css`;
const LIB = 'lib/**/*';

// clean
const clean = () => exec(`rm -rf ${DIST}`);

// assets
const moveAssets = () => src(ASSETS).pipe(dest(DIST));
// styles
const buildSass = () =>
  exec(
    `yarn sass --style compressed ${PATH_STYLES}/index.scss ${PATH_CSS}/styles.css`
  );
const buildPostcss = () =>
  src(CSS)
    .pipe(postcss([ autoprefixer() ]))
    .pipe(dest(PATH_CSS));
const buildStyles = series(buildSass, buildPostcss);
// html
const buildHtml = () => exec(`node ./lib/build.js --config=build-config.js`);
// build all in parallel
const build = parallel(moveAssets, buildHtml, buildStyles);

const reload = () => Promise.resolve(browserSync.reload());
const serveFiles = (callback) => {
  browserSync.init({
    server: {
      baseDir: DIST
    }
  });
  watch([ POSTS, PAGES, TEMPLATES, LIB, SITE_CONFIG ], series(buildHtml, reload));
  watch(ASSETS, series(moveAssets, reload));
  watch(STYLES, series(buildStyles, reload));
  callback();
};

exports.clean = clean;
exports.buildHtml = buildHtml;
exports.buildStyles = buildStyles;
exports.build = build;
exports.serve = series(clean, build, serveFiles);
exports.default = series(clean, build);