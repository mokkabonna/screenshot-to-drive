require.config({
  // make bower_components more sensible
  // expose jquery
  paths: {
    bower_components: "../bower_components",
    async: '../bower_components/requirejs-plugins/src/async',
    text: '../bower_components/requirejs-text/text',
    promise: '../bower_components/bluebird/js/browser/bluebird',
    jquery: '../bower_components/jquery/jquery',
    moment: '../bower_components/moment/min/moment-with-locales'
  },
  'packages': [{
    'name': 'lodash',
    'location': '../bower_components/lodash-amd/modern'
  }, {
    'name': 'mout',
    'location': '../bower_components/mout/src'
  }],
  map: {
    "*": {
      knockout: "../bower_components/knockout/dist/knockout",
      ko: "../bower_components/knockout/dist/knockout"
    }
  }
});

if (!window.requireTestMode) {
  require(['main'], function() {});
}
