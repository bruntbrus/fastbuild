/*
 * Minimal CommonJS require
 *
 * No need for a heavy CommonJS implementation!
 */

(function commonjs() {
  'use strict'

  // Module registry
  const modules = new Map()

  // Module constructor
  function Module(id, exports, def) {
    this.id = id
    this.exports = exports
    this._def = def
    this._required = false
    this._loading = false
  }

  // Initializes a module
  function initModule(module) {
    const localRequire = createLocalRequire(module.id)
    const def = module._def

    module._required = true
    module._loading = true

    def(localRequire, module.exports, module)

    module._loading = false
  }

  // Disposes of a module
  function disposeModule(module) {
    Module.call(module, '', null, null)
  }

  // Requires a module and returns its exports
  function require(id, fromId) {
    if (!modules.has(id)) {
      throw createRequireError(id, fromId, 'not registered')
    }

    const module = modules.get(id)

    if (module._loading) {
      throw createRequireError(id, fromId, 'has cyclic dependency')
    }

    if (!module._required) {
      initModule(module)
    }

    return module.exports
  }

  // Returns a module ID from path
  function resolve(fromId, path) {
    let parts

    if (path.startsWith('.')) {
      parts = fromId.split('/')
      parts.pop()
    } else {
      parts = []
    }

    path.split('/').forEach((part) => {
      switch (part) {
        case '.': break
        case '..': parts.pop(); break
        default: parts.push(part)
      }
    })

    return parts.join('/')
  }

  // Creates a local require function
  function createLocalRequire(fromId) {
    return function localRequire(path) {
      return require(resolve(fromId, path), fromId)
    }
  }

  // Creates a new require error
  function createRequireError(id, fromId, message) {
    message = `Required module "${id}" ${message}`

    if (fromId) {
      if (fromId === id) {
        message += ' (required by itself)'
      } else {
        message += ` (required by module "${fromId}")`
      }
    }

    const error = new Error(message)
    error.name = 'RequireError'

    return error
  }

  // Registers a module
  require.register = function register(id, def) {
    if (modules.has(id)) {
      throw new Error(`Module ${id} already registered`)
    }

    let module

    if (typeof def === 'function') {
      module = new Module(id, {}, def)
    } else {
      module = new Module(id, def, null)
      module._required = true
    }

    modules.set(id, module)
  }

  // Removes a registered module
  require.unregister = function unregister(id) {
    const module = modules.get(id)

    if (module) {
      disposeModule(module)
      modules.delete(id)
    }
  }

  // Export
  require.modules = modules
  window.require = require
})()
