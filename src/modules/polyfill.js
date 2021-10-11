/*
 * Polyfill module
 *
 * Note: Do not use any features here that might need a polyfill!
 */

// Export
const polyfill = {

  /**
   * Returns true if needed features are supported
   *
   * @public
   * @returns {boolean}
   */
  isSupported() {
    // Crude check
    return ['Map', 'Set', 'Promise'].every((name) => typeof window[name] === 'function')
  },

  /**
   * Loads polyfills from external script
   *
   * @public
   * @param {Function} onLoad(event) - this = script
   */
  load(onLoad) {
    const script = document.createElement('script')

    script.onload = onLoad
    script.src = 'libs/babel/polyfill.js'

    document.head.appendChild(script)
  },
}

module.exports = polyfill
