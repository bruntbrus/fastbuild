/*
 * Main script
 */

/* jshint devel: true */

(function main() {
  'use strict'

  // Check support
  const polyfill = require('polyfill')
  const isSupported = polyfill.isSupported()

  if (isSupported) {
    setTimeout(start, 1)
  } else {
    polyfill.load(start)
  }

  // Starts it all
  function start() {
    if (!isSupported) {
      console.log('Polyfill loaded')
    }

    require('app').init()
  }
})()
