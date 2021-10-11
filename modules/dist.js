/*
 * Build distributable module
 */

/* jshint node: true */

const gulp = require('gulp')
const babel = require('gulp-babel')
const tap = require('gulp-tap')
const concat = require('gulp-concat')
const pump = require('pump')
const path = require('path')

/*
 * Builds distributable file (using Babel)
 *
 * Options:
 * - destDir {string}          - Path to destination directory
 * - fileName {string}         - Name for generated file
 * - babel {Object = null}     - Options for Babel
 * - wrap {boolean = false}    - Wrap everyting in an IIFE
 * - verbose {boolean = false} - Log details
 */
function dist(globs, options) {
  return new Promise((resolve, reject) => {
    const steps = [

      gulp.src(globs),
      tap((file) => {
        if (options.verbose) {
          console.log('Dist: ' + file.relative)
        }
      }),
      concat(options.fileName),
    ]

    if (options.babel) {
      steps.push(babel(options.babel))
    }

    if (options.wrap) {
      steps.push(tap(wrap))
    }

    steps.push(
      tap((file) => {
        if (options.verbose) {
          console.log('Write: ' + path.join(options.destDir, file.relative))
        }
      }),
      gulp.dest(options.destDir),
    )

    pump(steps, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

// Wraps file contents in an IIFE
function wrap(file) {
  const source = file.contents.toString().trim()

  file.contents = Buffer.from(`(function () {\n\n${source}\n\n})();`)
}

module.exports = dist
