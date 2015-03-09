define([
  'drive/auth',
  'text!./authStatus.html',
], function(auth, template) {
  'use strict';

  return {
    viewModel: {
      instance: auth.about
    },
    template: template
  };
});
