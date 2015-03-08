require.config({
  // make bower_components more sensible
  // expose jquery
  paths: {
    bower_components: "../bower_components",
    async: '../bower_components/requirejs-plugins/src/async',
    promise: '../bower_components/bluebird/js/browser/bluebird',
    jquery: '../bower_components/jquery/jquery',
    moment: '../bower_components/moment/min/moment-with-locales'
  },
  'packages': [{
    'name': 'lodash',
    'location': '../bower_components/lodash-amd/modern'
  }],
  map: {
    "*": {
      knockout: "../bower_components/knockout/dist/knockout",
      ko: "../bower_components/knockout/dist/knockout"
    }
  }
});

// Use the debug version of knockout it development only
// When compiling with grunt require js will only look at the first
// require.config({}) found in this file
require.config({
  map: {
    "*": {
      "knockout": "../bower_components/knockout/dist/knockout.debug",
      "ko": "../bower_components/knockout/dist/knockout.debug"
    }
  }
});

if (!window.requireTestMode) {
  require(['main'], function() {});
}
