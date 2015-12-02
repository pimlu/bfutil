var global = typeof window === 'object' ? window : this;
global['namefuck'] = require('./namefuck.js');
if(typeof define === 'function' && define.amd) {
  define([], function() {
    return global['namefuck'];
  });
}