define(['knockout', 'components/authStatus'], function(ko, authStatus) {
  'use strict';

  return function() {
    ko.components.register('auth-status', authStatus);
  };

});
