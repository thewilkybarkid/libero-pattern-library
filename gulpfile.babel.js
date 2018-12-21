import browserSync from 'browser-sync';
import del from 'del';
import distributeConfig from './libero-config/bin/distributeConfig';
import flatten from 'gulp-flatten';
import gulp from 'gulp';
import minimist from 'minimist';
import mocha from 'gulp-mocha';
import postcss from 'gulp-postcss';
import rename from 'gulp-rename';
import replace from 'gulp-replace';
import reporter from 'postcss-reporter';
import sass from 'gulp-sass';
import sassGlob from 'gulp-sass-glob';
import sourcemaps from 'gulp-sourcemaps';
import stylelint from 'stylelint';
import syntaxScss from 'postcss-scss';

const buildConfig = (invocationArgs, publicRoot, sourceRoot, testRoot, exportRoot) => {

  const invocationOptions = minimist(
    invocationArgs, {
      default: {
        environment: 'production',
        sassEntryPoint: 'base.scss',
        cssOutFilename: 'all.css',
        'sass-lint': true,
      },
    },
  );

  const config = {};
  config.environment = invocationOptions.environment;
  config.publicRoot = publicRoot;
  config.sourceRoot = sourceRoot;
  config.testRoot = testRoot;
  config.exportRoot = exportRoot;

  config.sass = {};
  config.sass.linting = invocationOptions['sass-lint'] !== 'false';
  config.sass.options = config.environment === 'production' ? {outputStyle: 'compressed'} : null;

  config.dir = {
    src: {},
    test: {},
    out: {},
  };
  config.dir.src.css = `${config.sourceRoot}/css`;
  config.dir.src.sass = `${config.dir.src.css}/sass`;
  config.dir.src.images = `${config.sourceRoot}/images`;
  config.dir.src.fonts = `${config.sourceRoot}/fonts`;
  config.dir.src.templates = `${config.sourceRoot}/_patterns`;
  config.dir.src.js = `${config.sourceRoot}/js`;

  config.dir.test.sass = `${config.testRoot}/sass`;

  config.dir.out.css = `${config.exportRoot}/css`;
  config.dir.out.sass = `${config.dir.out.css}/sass`;
  config.dir.out.sassVendor = `${config.dir.out.css}/sass/vendor`;
  config.dir.out.images = `${config.exportRoot}/images`;
  config.dir.out.fonts = `${config.exportRoot}/fonts`;
  config.dir.out.templates = `${config.exportRoot}/templates`;

  config.files = {
    src: {},
    test: {},
    out: {},
  };
  config.files.src.css = [
    `${config.dir.src.css}/**/*.css`,
    `${config.dir.src.css}/**/*.map`,
    `!${config.dir.src.css}/pattern-scaffolding.css`,
    `!${config.dir.src.css}/sass/**/*`,
  ];
  config.files.src.sass = [
    `${config.dir.src.sass}/**/*.scss`,
    `!${config.dir.src.sass}/vendor/**/*`,
  ];
  config.files.src.sassEntryPoint = `${config.dir.src.sass}/${invocationOptions.sassEntryPoint}`;
  config.files.src.sassVendor = [
    `${config.dir.src.sass}/vendor/**/*.scss`,
    `${config.dir.src.sass}/vendor/**/*.css`,
    `${config.dir.src.sass}/vendor/**/LICENSE.*`,
  ];
  config.files.src.images = [`${config.dir.src.images}/*`, `${config.dir.src.images}/**/*`];
  config.files.src.fonts = [`${config.dir.src.fonts}/*`, `${config.dir.src.fonts}/**/*`];
  config.files.src.templates = [
    `${config.dir.src.templates}/*.twig`,
    `${config.dir.src.templates}/**/*.twig`,
    `!${config.dir.src.templates}/02-pages/**/*.twig`
  ];
  config.files.src.derivedConfigs = [
    `${config.dir.src.sass}/variables/**/*`,
    `${config.dir.src.js}/derivedConfig.json`,
  ];

  config.files.test.sass = `${config.dir.test.sass}/**/*.spec.scss`;
  config.files.test.sassTestsEntryPoint = `${config.dir.test.sass}/test_sass.js`;

  config.files.out.cssFilename = invocationOptions.cssOutFilename;

  return config;

};

const config = buildConfig(process.argv, 'public', 'source', 'test', 'export');

// Builders

const cleanSharedConfig = () => del(config.files.src.derivedConfigs);

export const distributeSharedConfig = gulp.series(cleanSharedConfig, distributeConfig);

const lintSass = () => {
  if (!config.sass.linting) {
    console.info('Skipping sass:lint');
    return Promise.resolve();
  }

  const processors = [
    stylelint(),
    reporter(
      {
        clearMessages: true,
        throwError: true,
      },
    ),
  ];

  return gulp.src(config.files.src.sass)
    .pipe(postcss(processors, {syntax: syntaxScss}));
};

const testSass = () =>
  gulp.src(config.files.test.sassTestsEntryPoint)
    .pipe(mocha({reporter: 'spec'}));

export const validateSass = gulp.parallel(lintSass, testSass);

const cleanCss = () => del(config.files.src.css);

const compileCss = () =>
  gulp.src(config.files.src.sassEntryPoint)
    .pipe(sourcemaps.init())
    .pipe(sassGlob())
    .pipe(sass(config.sass.options).on('error', sass.logError))
    .pipe(replace(/\.\.\/\.\.\/fonts\//g, '../fonts/'))
    .pipe(rename(config.files.out.cssFilename))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(config.dir.src.css));

export const generateCss = gulp.series(cleanCss, compileCss);

export const build = gulp.parallel(validateSass, generateCss);

export const assemble = gulp.series(distributeSharedConfig, build);

// Exporters

const cleanExport = () => del(`${config.exportRoot}**/*`);

const exportCss = () =>
  gulp.src(config.files.src.css)
    .pipe(gulp.dest(config.dir.out.css));

const exportSass = () =>
  gulp.src(config.files.src.sass)
    .pipe(gulp.dest(config.dir.out.sass));

const exportSassVendor = () =>
  gulp.src(config.files.src.sassVendor)
    .pipe(gulp.dest(config.dir.out.sassVendor));

const exportImages = () =>
  gulp.src(config.files.src.images)
    .pipe(gulp.dest(config.dir.out.images));

const exportFonts = () =>
  gulp.src(config.files.src.fonts)
    .pipe(gulp.dest(config.dir.out.fonts));

const exportTemplates = () =>
  gulp.src(config.files.src.templates)
    // Rename files to standard Twig usage
    .pipe(rename(path => {
      path.basename = path.basename.replace(/^_/, '');
      path.extname = '.html.twig';
    }))
    // Replace pattern-lab partial inclusion with generic Twig syntax
    .pipe(replace(/(['"])(?:atoms|molecules|organisms)-(.+?)(\1)(?=[\s\S]*?(}}|%}))/g, '$1@LiberoPatterns/$2.html.twig$3'))
    // Template files don't need their authoring hierarchy for downstream use
    .pipe(flatten({includeParents: false}))
    .pipe(gulp.dest(config.dir.out.templates));

export const exportPatterns = gulp.series(
  cleanExport,
  gulp.parallel(exportCss, exportSass, exportSassVendor, exportImages, exportFonts, exportTemplates),
);

// Default

export default gulp.series(assemble, exportPatterns);

// Watchers

const watchSass = () => gulp.watch(config.files.src.sass, build);

const watchSassTests = () => gulp.watch(config.files.test.sass, build);

const watchSharedConfig = () => gulp.watch('libero-config/**/*', distributeSharedConfig);

export const watch = gulp.parallel(watchSass, watchSassTests, watchSharedConfig);

// Server

const reloadServer = done => {
  browserSync.reload();
  done();
};

const watchServer = () => gulp.watch(config.publicRoot, reloadServer);

const initialiseServer = done => {
  browserSync.init({
    notify: false,
    open: false,
    port: 80,
    server: {
      baseDir: config.publicRoot,
    },
  });
  done();
};

export const server = gulp.series(initialiseServer, watchServer);
