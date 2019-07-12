const { src, dest, series, parallel, watch } = require('gulp');
const { exec } = require('child_process');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const browserSync = require('browser-sync').create();

const properties = require('./properties');
const glob = {
  posts: `${properties.dir.posts}/**/*.md`,
  pages: `${properties.dir.pages}/**/*.md`,
  templates: `${properties.dir.templates}/**/*.{html,xml}`,
  static: `${properties.dir.static}/**/*`,
  styles: `${properties.dir.styles}/**/*.scss`,
  css: `${properties.dir.css}/**/*.css`
};
const watchedFiles = {
  src: [
    glob.posts,
    glob.pages,
    glob.templates,
    './site.config.yml',
    './lib/**/*'
  ],
  static: glob.static,
  styles: glob.styles
};

// >>>>>>>>>> tasks <<<<<<<<<<

const clean = () => exec(`rm -rf ${properties.dir.build}`);

const buildSrc = () => exec(properties.builder.join(' '));
const buildStatic = () => src(glob.static).pipe(dest(properties.dir.build));
const buildSass = () => exec(properties.sass.join(' '));
const buildPostcss = () =>
  src(glob.css)
    .pipe(postcss([ autoprefixer() ]))
    .pipe(dest(properties.dir.css));
const buildStyles = series(buildSass, buildPostcss);
const build = parallel(buildSrc, buildStatic, buildStyles);

const reload = () => Promise.resolve(browserSync.reload());
const serveFiles = (callback) => {
  browserSync.init({
    server: {
      baseDir: properties.dir.build
    }
  });
  watch(watchedFiles.src, series(buildSrc, reload));
  watch(watchedFiles.static, series(buildStatic, reload));
  watch(watchedFiles.styles, series(buildStyles, reload));
  callback();
};
const serve = series(clean, build, serveFiles);

Object.assign(exports, { clean, build, serve });
exports.default = series(clean, build);

