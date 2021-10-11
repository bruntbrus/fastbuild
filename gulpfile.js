/*
 * Gulp tasks
 */

/* jshint node: true */

const gulp = require('gulp')
const sequence = require('gulp-sequence')
const path = require('path')

// Configuration
const config = {

  publicDir: 'public',
  cssDir: 'public/css',
  libDir: 'public/libs',
  distDir: 'public/dist',
  srcDir: 'src',
  moduleDir: 'src/modules',
  tempDir: 'temp',
  buildDir: 'temp/build',
  distName: 'bundle.js',
  transpile: false,
  wrap: false,
  strict: true,
  indent: '\t',
  verbose: false,

  // Options for Babel (transpile)
  babelOptions: {

    presets: [
      ['env', { useBuiltIns: true }], // Latest features
    ],
  },

  // Options for marked (markdown to HTML)
  markedOptions: {

    gfm: true, // GitHub-flavored markdown (GFM)
    tables: true, // GFM tables
    breaks: false, // No GFM line breaks
    pedantic: false, // No obscure rules
    sanitize: false, // Don't sanitize output (keep HTML)
    smartLists: true, // Smarter list behavior
    smartypants: false, // No smart typographic punctuation
  },

  // Options for UglifyJS
  uglifyOptions: {

    mangle: true, // Mangle names

    compress: {
      sequences: false, // Ordinary statements (no comma-operator)
    },

    output: {
      max_line_len: 1200, // Reasonable limit of line length
    },
  },
}

// Runs lint task by default
gulp.task('default', sequence('lint'))

// Runs copy libs tasks
gulp.task('copy', sequence('copy:libs'))

// Copies lib files
gulp.task('copy:libs', sequence(

  'copy:babel-polyfill',
  'copy:ejs',
))

// Copies babel-polyfill lib files
gulp.task('copy:babel-polyfill', () => copy(

  'node_modules/babel-polyfill/dist',
  config.libDir + '/babel',
  ['*.js'],
))

// Copies es6-shim lib files
gulp.task('copy:ejs', () => copy(

  'node_modules/ejs',
  config.libDir + '/ejs',
  ['*.js'],
))

// Runs all lint tasks except for node scripts
gulp.task('lint', sequence(

  'lint:src',
  'lint:modules',
))

// Lint checks node scripts
gulp.task('lint:node', () => lint([

  'gulpfile.js',
  'server.js',
  'modules/*.js',
]))

// Lint checks general scripts
gulp.task('lint:src', () => lint(config.srcDir + '/*.js'))

// Lint checks modules
gulp.task('lint:modules', () => lint(config.moduleDir + '/**/*.js'))

// Runs all clean tasks
gulp.task('clean', sequence(

  'clean:build',
  'clean:dist',
))

// Cleans build directory
gulp.task('clean:build', () => remove(config.buildDir))

// Cleans distributable directory
gulp.task('clean:dist', () => remove(config.distDir))

// Runs all build tasks
gulp.task('build', sequence(

  'clean:build',
  'build:modules',
))

// Builds modules
gulp.task('build:modules', () => build(

  config.moduleDir,
  config.buildDir,
  'modules.js',
))

// Builds modules and distributable files
gulp.task('build:dist', sequence(

  'build',
  'dist',
))

// Runs all build distributable tasks
gulp.task('dist', sequence(

  'clean:dist',
  'dist:bundle',
))

// Builds general distributable scripts
gulp.task('dist:bundle', () => dist([

  config.srcDir + '/require.js',
  config.buildDir + '/modules.js',
  config.srcDir + '/main.js',
]))

// Runs all minify tasks
gulp.task('min', sequence('min:bundle'))

// Minifies bundle
gulp.task('min:bundle', () => minjs(config.distDir + '/bundle.js'))

// Copies files to destination directory
function copy(srcDir, destDir, globs) {
  const tap = require('gulp-tap')
  const options = {}

  if (srcDir) {
    options.base = srcDir
    globs = globs.map((glob) => srcDir + '/' + glob)
  }

  return gulp.src(globs, options)
    .pipe(tap((file) => {
      if (config.verbose) {
        console.log(`Copy: ${srcDir}/${file.relative} => ${destDir}/`)
      }
    }))
    .pipe(gulp.dest(destDir))
}

// Removes files (be careful!)
function remove(globs) {
  const del = require('del')

  return del(globs).then((filePaths) => {
    if (config.verbose) {
      filePaths.forEach((filePath) => console.log('Remove: ' + path.relative(__dirname, filePath)))
    }
  })
}

// Lint checks files
function lint(globs) {
  const sort = require('gulp-sort')
  const jshint = require('gulp-jshint')
  const tap = require('gulp-tap')

  return gulp.src(globs)
    .pipe(sort())
    .pipe(tap((file) => {
      if (config.verbose) {
        console.log('Lint: ' + file.relative)
      }
    }))
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
}

// Builds modules (using custom bundler)
function build(srcDir, destDir, fileName) {
  const options = {

    srcDir: srcDir,
    destDir: destDir,
    fileName: fileName,
    exclude: ['**/README.md'],
    strict: config.strict,
    indent: config.indent,
    marked: config.markedOptions,
    verbose: config.verbose,
  }

  return require('./modules/build')(options)
}

// Builds distributable files (optionally using Babel)
function dist(globs) {
  const options = {

    destDir: config.distDir,
    fileName: config.distName,
    babel: config.transpile ? config.babelOptions : null,
    wrap: config.wrap,
    verbose: config.verbose,
  }

  return require('./modules/dist')(globs, options)
}

// Minifies scripts (using UglifyJS)
function minjs(globs) {
  const options = {

    destDir: config.distDir,
    uglify: config.uglifyOptions,
    verbose: config.verbose,
  }

  return require('./modules/minjs')(globs, options)
}
