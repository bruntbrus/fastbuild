/*
 * Minify JavaScript module
 */

/* jshint node: true */

const gulp = require('gulp')
const uglify = require('gulp-uglify')
const sourcemaps = require('gulp-sourcemaps')
const tap = require('gulp-tap')
const rename = require('gulp-rename')
const pump = require('pump')
const path = require('path')

/*
 * Minifies scripts (using UglifyJS)
 *
 * Options:
 * - destDir {string}          - Path to destination directory
 * - uglify {Object = null}    - Options for UglifyJS
 * - verbose {boolean = false} - Log details
 */
function minjs(globs, options) {
  // Statistics
  let originalLength

  // Logs statistics
  function logStats(file) {
    const length = file.contents.length
    const ratio = Math.round(10000 * (1 - length / originalLength)) / 100
    const name = toUnixPath(file.relative)

    console.log(`Minify: ${name} (${ratio}%)`)
  }

  return new Promise((resolve, reject) => {
    pump([

      gulp.src(globs),
      sourcemaps.init(),
      tap((file) => (originalLength = file.contents.length)),
      uglify(options.uglify),
      tap((file) => {
        if (options.verbose) {
          logStats(file)
        }
      }),
      rename({ extname: '.min.js' }),
      sourcemaps.write('.'),
      tap((file) => {
        if (options.verbose) {
          console.log('Write: ' + path.join(options.destDir, file.relative))
        }
      }),
      gulp.dest(options.destDir),

    ], (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

// Returns path separated by forward slashes
function toUnixPath(somePath) {
  return somePath.replace(/\\/g, '/')
}

module.exports = minjs
