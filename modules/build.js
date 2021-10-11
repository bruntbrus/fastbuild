/*
 * Build module
 *
 * Custom module bundler without dependency tracking (really simple).
 */

/* jshint node: true */

const gulp = require('gulp')
const sort = require('gulp-sort')
const tap = require('gulp-tap')
const concat = require('gulp-concat')
const pump = require('pump')
const path = require('path')

// Supported file extensions
const fileExts = [
  '.js', '.json',
  '.html', '.htm', '.xhtml', '.xhtm', '.xml',
  '.md', '.markdown',
  '.yaml', '.yml',
  '.tpl', '.hbs', '.handlebars', '.ejs', '.pug', '.jade',
]

// Source filters by filename match
const filters = [
  {
    match: /\.js$/,
    fn: (source) => source,
  },
  {
    match: /\.json$/,
    fn: (source, options) => toModuleExports(source, options),
  },
  {
    match: /\.(md|markdown)$/,
    fn: (source, options) => toStringExports(require('marked')(source, options.marked)),
  },
  {
    match: /\.(yaml|yml)$/,
    fn: (source, options) => toStringExports(require('js-yaml').safeLoad(source), options),
  },
  {
    match: /\.tpl(\.html)?$/,
    fn: (source, options) => toModuleExports(`require('underscore').template(${toJS(source, options)}, { variable: 'data' })`),
  },
  {
    match: /\.(hbs|handlebars)(\.html)?$/,
    fn: (source, options) => toModuleExports(`require('hbs').compile(${toJS(source, options)})`),
  },
  {
    match: /\.ejs(\.html)?$/,
    fn: (source, options) => toModuleExports(`require('ejs').compile(${toJS(source, options)}, { _with: false })`),
  },
  {
    match: /\.(pug|jade)(\.html)?$/,
    fn: (source, options) => toModuleExports(`require('pug').compile(${toJS(source, options)})`),
  },
  {
    match: /\.(html|htm|xhtml|xhtm|xml)$/,
    fn: (source, options) => toStringExports(source, options),
  },
]

/*
 * Builds modules (using custom bundler)
 *
 * Options:
 * - srcDir {string}           - Path to source directory
 * - destDir {string}          - Path to destination directory
 * - fileName {string}         - Name for generated file
 * - exclude {string[] = null} - Patterns of files to exclude
 * - indent {string = ""}      - Indentation
 * - strict {boolean = false}  - Strict mode modules
 * - marked {object = null}    - Options for Marked
 * - verbose {boolean = false} - Log details
 */
function build(options) {
  // Files to build
  const globs = fileExts.map((ext) => `${options.srcDir}/**/*${ext}`)

  if (options.exclude) {
    options.exclude.forEach((exclude) => globs.push(`!${options.srcDir}/${exclude}`))
  }

  // Filters source
  function filter(file) {
    const relPath = toUnixPath(file.relative)
    const id = relPath.replace(/\.js$/, '')
    const sourceFilter = getFilter(relPath)

    if (!sourceFilter) {
      throw new Error(`No filter for "${relPath}"`)
    }

    let source = file.contents.toString().trim()
    source = applyFilter(sourceFilter, id, source, options, file)

    file.contents = Buffer.from(source)
  }

  return new Promise((resolve, reject) => {
    pump([

      gulp.src(globs),
      sort(),
      tap((file) => {
        if (options.verbose) {
          console.log('Build: ' + file.relative)
        }
      }),
      tap((file) => filter(file)),
      concat(options.fileName, { newLine: '\n\n' }),
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

// Returns module registration code
function toRequireRegister(id, source) {
  return `require.register('${id}', function (require, exports, module) {\n\n${source}\n});`
}

// Returns module exports code
function toModuleExports(source) {
  return `module.exports = ${source};`
}

// Returns string export
function toStringExports(source, options) {
  return toModuleExports(toJS(source, options))
}

// Returns filter by filename
function getFilter(fileName) {
  return filters.find((filter) => filter.match.test(fileName))
}

// Applies source filter
function applyFilter(filter, id, source, options, file) {
  source = filter.fn(source, options, file)

  if (options.strict) {
    source = `'use strict';\n\n${source}`
  }

  if (options.indent) {
    source = indent(source, options.indent)
  }

  return toRequireRegister(id, source)
}

// Returns path separated by forward slashes
function toUnixPath(somePath) {
  return somePath.replace(/\\/g, '/')
}

// Returns string with indented lines
function indent(string, indentation) {
  return string.replace(/^./gm, indentation + '$&')
}

// Returns JavaScript code from value
function toJS(value, options) {
  return (options.indent ? JSON.stringify(value, null, options.indent) : JSON.stringify(value))
}

module.exports = build
