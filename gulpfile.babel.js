import browserSync from 'browser-sync';
import color from 'ansi-colors';
import copy from 'recursive-copy';
import del from 'del';
import download from 'download';
import eslint from 'gulp-eslint';
import flatten from 'gulp-flatten';
import fontRanger from 'font-ranger/lib/font-ranger';
import fs from 'fs-extra';
import gulp from 'gulp';
import imagemin from 'gulp-imagemin';
import jest from 'gulp-jest';
import Keyv from 'keyv';
import KeyvFile from 'keyv-file';
import log from 'fancy-log';
import minimist from 'minimist';
import mocha from 'gulp-mocha';
import os from 'os';
import path from 'path';
import pngToIco from 'png-to-ico';
import postcss from 'gulp-postcss';
import rename from 'gulp-rename';
import replace from 'gulp-replace';
import replaceStream from 'replacestream';
import reporter from 'postcss-reporter';
import sass from 'gulp-sass';
import sassGlob from 'gulp-sass-glob';
import sharp from 'sharp';
import sourcemaps from 'gulp-sourcemaps';
import stylelint from 'stylelint';
import syntaxScss from 'postcss-scss';
import tempWrite from 'temp-write';
import * as Throttle from 'promise-parallel-throttle';
import url from 'url';
import webpack from 'webpack';
import webpackConfigFactory from './webpack.config.babel.js';
import yaml from 'js-yaml';

const buildConfig = (invocationArgs, sourceRoot, testRoot, buildRoot) => {

  const invocationOptions = minimist(
    invocationArgs, {
      default: {
        environment: 'production',
        jsEntryPoint: 'main.js',
        lint: true,
      },
    },
  );

  const config = {};
  config.environment = invocationOptions.environment;
  config.lint = invocationOptions.lint !== 'false';
  config.sourceRoot = sourceRoot;
  config.testRoot = testRoot;
  config.buildRoot = buildRoot;
  config.exportRoot = `${config.buildRoot}/export`;
  config.publicRoot = `${config.buildRoot}/public`;

  config.sass = config.environment === 'production' ? {outputStyle: 'compressed'} : null;

  config.dir = {
    src: {},
    test: {},
    build: {},
    export: {},
  };

  config.dir.src.sass = `${config.sourceRoot}/sass`;
  config.dir.src.sassFonts = `${config.dir.src.sass}/fonts`;
  config.dir.src.sassVendor = `${config.dir.src.sass}/vendor`;
  config.dir.src.fonts = `${config.sourceRoot}/fonts`;
  config.dir.src.images = `${config.sourceRoot}/images`;
  config.dir.src.patterns = `${config.sourceRoot}/patterns`;
  config.dir.src.meta = `${config.sourceRoot}/meta`;
  config.dir.src.js = `${config.sourceRoot}/js`;

  config.dir.test.sass = `${config.testRoot}/sass`;
  config.dir.test.js = `${config.testRoot}/js`;

  config.dir.build.cache = `${config.buildRoot}/cache`;
  config.dir.build.fontCache = `${config.dir.build.cache}/fonts`;
  config.dir.build.src = `${config.buildRoot}/source`;
  config.dir.build.css = `${config.dir.build.src}/css`;
  config.dir.build.fonts = `${config.dir.build.src}/fonts`;
  config.dir.build.images = `${config.dir.build.src}/images`;
  config.dir.build.js = `${config.dir.build.src}/js`;
  config.dir.build.meta = `${config.dir.build.src}/_meta`;
  config.dir.build.patterns = `${config.dir.build.src}/_patterns`;
  config.dir.build.stubs = [
    `${config.dir.build.src}/_annotations`,
    `${config.dir.build.src}/_data`,
  ];

  config.dir.export.css = `${config.exportRoot}/css`;
  config.dir.export.js = `${config.exportRoot}/js`;
  config.dir.export.jsSrc = `${config.dir.export.js}/src`;
  config.dir.export.sass = `${config.dir.export.css}/sass`;
  config.dir.export.sassVendor = `${config.dir.export.css}/sass/vendor`;
  config.dir.export.images = `${config.exportRoot}/images`;
  config.dir.export.fonts = `${config.exportRoot}/fonts`;
  config.dir.export.templates = `${config.exportRoot}/templates`;

  config.files = {
    src: {},
    test: {},
    build: {},
    export: {},
  };

  config.files.src.sass = [
    `${config.dir.src.sass}/**/*.scss`,
    `!${config.dir.src.sassVendor}/**/*`,
  ];
  config.files.src.sassEntryPoints = `${config.dir.src.sass}/*.scss`;
  config.files.src.sassVendor = [
    `${config.dir.src.sassVendor}/**/*.{css,scss}`,
    `${config.dir.src.sassVendor}/**/_*.scss`,
    `${config.dir.src.sassVendor}/**/{LICENSE,license}.*`,
    `!${config.dir.src.sassVendor}/modularscale-sass/{libsass,test-compass}/**/*`,
  ];
  config.files.src.js = `${config.dir.src.js}/**/*.js`;
  config.files.src.jsEntryPoint = `${config.dir.src.js}/${invocationOptions.jsEntryPoint}`;
  config.files.src.images = `${config.dir.src.images}/**/*`;
  config.files.src.favicon = `${config.dir.src.images}/libero-logo.svg`;
  config.files.src.fontsDefinition = `${config.dir.src.fonts}/fonts.yaml`;
  config.files.src.fonts = [
    `${config.dir.src.fonts}/**/*`,
    `!${config.files.src.fontsDefinition}`,
  ];
  config.files.src.meta = `${config.dir.src.meta}/**/*`;
  config.files.src.patterns = `${config.dir.src.patterns}/**/*`;
  config.files.src.templates = `${config.dir.src.patterns}/!(04-pages)/**/*.twig`;

  config.files.test.js = `${config.dir.test.js}/**/*.spec.js`;
  config.files.test.sass = `${config.dir.test.sass}/**/*.spec.scss`;
  config.files.test.sassTestsEntryPoint = `${config.dir.test.sass}/test_sass.js`;

  config.files.build.favicon = `${config.dir.build.src}/favicon.ico`;
  config.files.build.imagesExportable = [`${config.dir.build.images}/**/*`, `!${config.dir.build.images}/local`, `!${config.dir.build.images}/local/**/*`];

  config.webpack = webpackConfigFactory(config.environment, path.resolve(config.files.src.jsEntryPoint), path.resolve(config.dir.build.js));

  return config;

};

const config = buildConfig(process.argv, 'source', 'test', 'build');

const httpCache = new Keyv({
  store: new KeyvFile({
    filename: `${config.dir.build.cache}/http.json`,
  }),
});

// Font tasks

const cleanFonts = () => del(config.files.src.fonts.concat([config.dir.build.fontCache, config.dir.src.sassFonts]));

const compileFontFiles = () => {
  const fonts = yaml.safeLoad(fs.readFileSync(config.files.src.fontsDefinition));

  const files = fonts.reduce(
    (carry, font) => {
      font.files.forEach(file => {
        const uri = url.resolve(font.base, file.path);
        if (!(uri in carry)) {
          carry[uri] = [];
        }
        carry[uri].push({
          fontDisplay: 'fallback',
          fontFamily: font.name,
          fontStyle: file.style || 'normal',
          fontWeight: file.weight || 400,
          subsetMap: font.subsets,
        });
      });

      return carry;
    }, {},
  );

  const maxInProgress = Math.ceil(os.totalmem() / 1024 / 1024 / 1024);

  return Throttle.all(Object.keys(files).map(uri => () =>
    download(uri, {cache: httpCache})
      .then(data => tempWrite(data, path.basename(uri)))
      .then(fontFile => {
        return Throttle.all(files[uri].map(file => {
          file.fontFile = fontFile;
          file.outputFolder = config.dir.build.fontCache;
          return () => fontRanger(file);
        }, {maxInProgress}))
          .finally(() => fs.promises.unlink(fontFile));
      })), {maxInProgress})
    .then(() => copy(config.dir.build.fontCache, config.dir.src.sassFonts, {
        filter: '*.css',
        rename: basename => path.basename(basename, '.css') + `.scss`,
        transform: () => replaceStream('url(\'', 'url(\'#{$fonts-path}/'),
      },
    ))
    .then(() => copy(config.dir.build.fontCache, config.dir.src.fonts, {filter: '*.woff2'}));
};

const compileFontLicenses = () => {
  const fonts = yaml.safeLoad(fs.readFileSync(config.files.src.fontsDefinition));

  const licenses = fonts.reduce((licenses, font) => licenses.add(url.resolve(font.base, font.license)), new Set());

  return Promise.all([...licenses].map(uri =>
    download(uri, {cache: httpCache})
      .then(data => data.toString()),
  ))
    .then(licenses => [...new Set(licenses)])
    .then(licenses => fs.promises.writeFile(`${config.dir.src.fonts}/LICENSE`, licenses.join('\n\n\n\n\n---\n\n\n\n\n\n')));
};

const compileFonts = gulp.parallel(compileFontFiles, compileFontLicenses);

export const buildFonts = gulp.series(cleanFonts, compileFonts);

// Sass tasks

const lintSass = () => {
  if (!config.lint) {
    console.info('Skipping lintSass');
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

const cleanCss = () => del(config.dir.build.css);

const compileCss = () =>
  gulp.src(config.files.src.sassEntryPoints)
    .pipe(sourcemaps.init())
    .pipe(sassGlob())
    .pipe(sass(config.sass))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(config.dir.build.css));

export const generateCss = gulp.series(cleanCss, compileCss);

export const buildCss = gulp.series(validateSass, generateCss);

// JavaScript tasks

const lintJs = () => {
  if (!config.lint) {
    console.info('Skipping lintJs');
    return Promise.resolve();
  }

  return gulp.src(config.files.src.js)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
};

const testJs = () =>
  gulp.src(config.dir.test.js)
  // TODO: remove passWithNoTests once js work has started
    .pipe(jest({'passWithNoTests': true}));

export const validateJs = gulp.parallel(lintJs, testJs);

const cleanJs = () => del(config.dir.build.js);

const compileJs = done => {
  const logBuild = (err, stats) => {
    if (err) {
      log('Error', err);
      done();
    } else {
      Object.getOwnPropertyNames(stats.compilation.assets).forEach((asset) => {
        log('Webpack: output', color.green(asset));
      });
    }
    log('Webpack:', color.blue('finished'));
    done();
  };

  webpack(config.webpack).run(logBuild);
};

export const generateJs = gulp.series(cleanJs, compileJs);

export const buildJs = gulp.series(validateJs, generateJs);

// Image tasks

const cleanImages = () => del(config.dir.build.images);

const compileImages = () =>
  gulp.src(config.files.src.images)
    .pipe(imagemin())
    .pipe(gulp.dest(config.dir.build.images));

const generateImages = gulp.series(cleanImages, compileImages);

const generateFavicon = () =>
  sharp(config.files.src.favicon)
    .resize(256, 256, {background: {r: 255, g: 255, b: 255, alpha: 0}, fit: 'contain'})
    .png()
    .toBuffer()
    .then(png => pngToIco(png))
    .then(ico => fs.outputFile(config.files.build.favicon, ico));

export const buildImages = gulp.parallel(generateFavicon, generateImages);

// Pattern Lab tasks

const cleanPatternLab = () => del([config.dir.build.fonts, config.dir.build.meta, config.dir.build.patterns].concat(config.dir.build.stubs));

const patternLabFonts = () =>
  gulp.src(config.files.src.fonts)
    .pipe(gulp.dest(config.dir.build.fonts));

const patternLabMeta = () =>
  gulp.src(config.files.src.meta)
    .pipe(gulp.dest(config.dir.build.meta));

const patternLabPatterns = () =>
  gulp.src(config.files.src.patterns)
    .pipe(gulp.dest(config.dir.build.patterns));

const patternLabStubs = () =>
  Promise.all(
    config.dir.build.stubs
      .map(path => fs.ensureDir(path)),
  );

const generatePatternLab = gulp.parallel(patternLabFonts, patternLabMeta, patternLabPatterns, patternLabStubs);

export const buildPatternLab = gulp.series(cleanPatternLab, generatePatternLab);

// Combined tasks

export const build = gulp.series(gulp.parallel(gulp.series(buildFonts, buildCss), buildImages, buildJs), buildPatternLab);

export const test = gulp.parallel(validateJs, validateSass);

// Exporters

const cleanExport = () => del(`${config.exportRoot}**/*`);

const exportCss = () =>
  gulp.src(`${config.dir.build.css}/**/*`)
    .pipe(gulp.dest(config.dir.export.css));

const exportSass = () =>
  gulp.src(config.files.src.sass)
    .pipe(gulp.dest(config.dir.export.sass));

const exportSassVendor = () =>
  gulp.src(config.files.src.sassVendor)
    .pipe(gulp.dest(config.dir.export.sassVendor));

const exportImages = () =>
  gulp.src(config.files.build.imagesExportable)
    .pipe(gulp.dest(config.dir.export.images));

const exportFavicon = () =>
  gulp.src(config.files.build.favicon)
    .pipe(gulp.dest(config.exportRoot));

const exportFonts = () =>
  gulp.src(config.files.src.fonts)
    .pipe(gulp.dest(config.dir.export.fonts));

const exportJs = () =>
  gulp.src(`${config.dir.build.js}/**/*`)
    .pipe(gulp.dest(config.dir.export.js));

const exportJsSrc = () =>
  gulp.src(config.files.src.js)
    .pipe(gulp.dest(config.dir.export.jsSrc));

const exportTemplates = () =>
  gulp.src(config.files.src.templates)
    // Rename files to standard Twig usage
    .pipe(rename(path => {
      path.basename = path.basename.replace(/^_/, '');
      path.extname = '.html.twig';
    }))
    // Replace pattern-lab partial inclusion with generic Twig syntax
    .pipe(replace(/(['"])(?:atoms|molecules|organisms|templates)-(.+?)(\1)(?=[\s\S]*?(}}|%}))/g, '$1@LiberoPatterns/$2.html.twig$3'))
    // Add asset package
    .pipe(replace(/asset\s*\(\s*(['"])(.*?)(?:\1)\s*\)(?=[\s\S]*?(?:}}|%}))/g, 'asset($1$2$1, $1libero_patterns$1)'))
    // Template files don't need their authoring hierarchy for downstream use
    .pipe(flatten({includeParents: false}))
    .pipe(gulp.dest(config.dir.export.templates));

export const exportPatterns = gulp.series(
  cleanExport,
  gulp.parallel(exportCss, exportSass, exportSassVendor, exportImages, exportFavicon, exportFonts, exportTemplates, exportJs, exportJsSrc),
);

// Default

export default gulp.series(build, exportPatterns);

// Watchers

const watchFonts = () => gulp.watch(config.files.src.fontsDefinition, gulp.series(buildFonts, gulp.parallel(buildCss, patternLabFonts)));

const watchImages = () => gulp.watch(config.files.src.images, buildImages);

const watchJs = () => gulp.watch([config.files.src.js, config.files.test.js], buildJs);

const watchPatternLab = () => gulp.watch([config.dir.src.meta, config.dir.src.patterns], buildPatternLab);

const watchSass = () => gulp.watch(config.files.src.sass.concat([config.files.test.sass, `!${config.dir.src.sassFonts}`]), buildCss);

export const watch = gulp.parallel(watchFonts, watchImages, watchJs, watchPatternLab, watchSass);

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
