'use strict';

const del = require('del');
const flatten = require('gulp-flatten');
const gulp = require('gulp');
const minimist = require('minimist');
const mocha = require('gulp-mocha');
const postcss = require('gulp-postcss');
const rename = require('gulp-rename');
const reporter = require('postcss-reporter');
const sass = require('gulp-sass');
const sassGlob = require('gulp-sass-glob');
const sourcemaps = require('gulp-sourcemaps');
const stylelint = require('stylelint');
const syntaxScss = require('postcss-scss');

function buildConfig(invocationArgs, sourceRoot, testRoot, exportRoot) {

  const invocationOptions = minimist(
    invocationArgs, {
      default: {
        environment: 'production',
        sassEntryPoint: 'build.scss',
        cssOutFilename: 'all.css',
        'sass-lint': true
      },
    }
  );

  const config = {};
  config.environment = invocationOptions.environment;
  config.sassLinting = invocationOptions['sass-lint'] !== 'false';
  config.sourceRoot = sourceRoot;
  config.testRoot = testRoot;
  config.exportRoot = exportRoot;

  config.dir = {
    src: {},
    test: {},
    out: {}
  };
  config.dir.src.css = `${config.sourceRoot}css/`;
  config.dir.src.sass = `${config.dir.src.css}sass/`;
  config.dir.src.images = `${config.sourceRoot}images/`;
  config.dir.src.fonts = `${config.sourceRoot}fonts/`;
  config.dir.src.templates = `${config.sourceRoot}_patterns/`;

  config.dir.test.sass = `${config.testRoot}sass/`;

  config.dir.out.css = `${config.exportRoot}css/`;
  config.dir.out.sass = `${config.dir.out.css}sass/`;
  config.dir.out.images = `${config.exportRoot}images/`;
  config.dir.out.fonts = `${config.exportRoot}fonts/`;
  config.dir.out.templates = `${config.exportRoot}templates/`;

  config.files = {
    src: {},
    test: {},
    out: {}
  };
  config.files.src.css = [
    `${config.dir.src.css}/**/*.css`,
    `${config.dir.src.css}/**/*.map`,
    `!${config.dir.src.css}pattern-scaffolding.css`
  ];
  config.files.src.sass = `${config.dir.src.sass}/**/*.scss`;
  config.files.src.sassEntryPoint = config.dir.src.sass + invocationOptions.sassEntryPoint;
  config.files.src.images = [`${config.dir.src.images}/*`, `${config.dir.src.images}/**/*`];
  config.files.src.fonts = [`${config.dir.src.fonts}/*`, `${config.dir.src.fonts}/**/*`];
  config.files.src.templates = [`${config.dir.src.templates}/*.twig`, `${config.dir.src.templates}/**/*.twig`];

  config.files.test.sass = `${config.dir.test.sass}**/*.spec.scss`;
  config.files.test.sassTestsEntryPoint = `${config.dir.test.sass}test_sass.js`;

  config.files.out.cssFilename = invocationOptions.cssOutFilename;

  return config;

}

const config = buildConfig(process.argv, 'source/', 'test/', 'export/');

gulp.task('css:generate', ['sass:test'], () => {
  const sassOptions = config.environment === 'production' ? {outputStyle: 'compressed'} : null;
  return gulp.src(config.files.src.sassEntryPoint)
             .pipe(sourcemaps.init())
             .pipe(sassGlob())
             .pipe(sass(sassOptions).on('error', sass.logError))
             .pipe(rename(config.files.out.cssFilename))
             .pipe(sourcemaps.write('./'))
             .pipe(gulp.dest(config.dir.src.css));
});

gulp.task('sass:lint', ['css:clean'], () => {
  if (!config.sassLinting) {
    console.info("Skipping sass:lint");
    return;
  }

  const processors = [
    stylelint(),
    reporter(
      {
        clearMessages: true,
        throwError: true
      }
    )
  ];

  return gulp.src([config.files.src.sass])
             .pipe(postcss(processors, {syntax: syntaxScss}));
});

gulp.task('sass:test', ['sass:lint'], () => {
  return gulp.src(config.files.test.sassTestsEntryPoint)
             .pipe(mocha({ reporter: 'spec' }));
});

gulp.task('css:clean', () => {
  del(config.files.src.css);
});

gulp.task('build', ['css:generate']);

gulp.task('patternsExport:clean', () => {
  del([`${config.exportRoot}**/*`]);
});

gulp.task('exportPatterns', ['patternsExport:clean'], () => {

  gulp.src(config.files.src.css)
      .pipe(gulp.dest(config.dir.out.css));

  gulp.src(config.files.src.sass)
      .pipe(gulp.dest(config.dir.out.sass));

  gulp.src(config.files.src.images)
      .pipe(gulp.dest(config.dir.out.images));

  gulp.src(config.files.src.fonts)
      .pipe(gulp.dest(config.dir.out.fonts));

  // Template files don't need their authoring hierarchy for downstream use
  gulp.src(config.files.src.templates)
      .pipe(flatten({ includeParents: false }))
      .pipe(gulp.dest(config.dir.out.templates));

});

gulp.task('sass:watch', ['css:generate'], () => {
  gulp.watch([config.files.src.sass, config.files.test.sass], ['css:generate']);
});

gulp.task('default', ['build', 'exportPatterns']);
