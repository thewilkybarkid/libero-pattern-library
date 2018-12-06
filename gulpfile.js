'use strict';

const del = require('del');
const distributeConfig = require('./libero-config/bin/distributeConfig');
const flatten = require('gulp-flatten');
const gulp = require('gulp');
const mergeStreams = require('merge-stream');
const minimist = require('minimist');
const mocha = require('gulp-mocha');
const postcss = require('gulp-postcss');
const rename = require('gulp-rename');
const reporter = require('postcss-reporter');
const replace = require('gulp-replace');
const runSequence = require('run-sequence').use(gulp);
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
  config.dir.src.js = `${config.sourceRoot}js/`;

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
  config.files.src.derivedConfigs = [
    `${config.dir.src.sass}variables/**/*`,
    `${config.dir.src.js}derivedConfig.json`
  ];

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
             .pipe(replace(/\.\.\/\.\.\/fonts\//g, '../fonts/'))
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
  return del(config.files.src.css);
});

gulp.task('build', ['css:generate']);

gulp.task('patternsExport:clean', () => {
  return del([`${config.exportRoot}**/*`]);
});

gulp.task('exportPatterns', ['patternsExport:clean'], () => {

  return mergeStreams(
    gulp.src(config.files.src.css)
        .pipe(gulp.dest(config.dir.out.css)),

    gulp.src(config.files.src.sass)
        .pipe(gulp.dest(config.dir.out.sass)),

    gulp.src(config.files.src.images)
        .pipe(gulp.dest(config.dir.out.images)),

    gulp.src(config.files.src.fonts)
        .pipe(gulp.dest(config.dir.out.fonts)),

    gulp.src(config.files.src.templates)
        // Rename files to standard Twig usage
        .pipe(rename(path => {
            path.basename = path.basename.replace(/^_/, '');
            path.extname = '.html.twig';
        }))
        // Replace pattern-lab partial inclusion with generic Twig syntax
        .pipe(replace(/('|")(?:atoms|molecules|organisms)-(.+?)(\1)(?=[\s\S]*?(}}|%}))/g, '$1@LiberoPatterns/$2.html.twig$3'))
        // Template files don't need their authoring hierarchy for downstream use
        .pipe(flatten({ includeParents: false }))
        .pipe(gulp.dest(config.dir.out.templates)),
  );

});

gulp.task('sharedConfig:clean', () => {
  return del(config.files.src.derivedConfigs);
});

gulp.task('distributeSharedConfig', ['sharedConfig:clean'], (done) => {
  distributeConfig();
  done();
});

gulp.task('sharedConfig:watch', () => {
  return gulp.watch('libero-config/**/*', ['distributeSharedConfig']);
});

gulp.task('sass:watch', () => {
  return gulp.watch([config.files.src.sass, config.files.test.sass], ['css:generate']);
});

gulp.task('assemble', done => {
  runSequence(
    'distributeSharedConfig',
    'build',
    done,
  );
});

gulp.task('default', done => {
  runSequence(
    'assemble',
    'exportPatterns',
    done,
  );
});

gulp.task('watch', ['sass:watch', 'sharedConfig:watch']);
