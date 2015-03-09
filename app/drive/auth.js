define([
  'gapi',
  'knockout',
  'promise'
], function(gapi, ko, Promise) {
  'use strict';

  var CLIENT_ID = '426861507088-sctvq64k79cqta3lui9t9tq6d4o95ome.apps.googleusercontent.com';
  var SCOPES = [
    'https://www.googleapis.com/auth/drive.file'
  ];

  var auth = {
    rootFolderId: 'root',
    about: ko.observable(),
    login: function() {
      return login(true);
    },
    forceLogin: function() {
      return login(false);
    },
    isLoggedIn: ko.observable(false),
  };

  return auth;
  //Private methods

  function loadAbout() {
    gapi.client.drive.about.get().then(function(about) {
      auth.about(about.result);
      auth.rootFolderId = about.result.rootFolderId;
    });
  }

  /**
   * Check if the current user has authorized the application.
   */
  function login(immediate) {
    return new Promise(function(resolve, reject) {
      gapi.auth.authorize({
        client_id: CLIENT_ID,
        scope: SCOPES,
        immediate: immediate
      }, function(authResult) {
        if (authResult.access_token) {
          // Access token has been successfully retrieved, requests can be sent to the API
          loadClient(function() {
            loadAbout();
            auth.isLoggedIn(true);
            resolve(authResult);
          });
        } else {
          reject();
        }
      });
    });
  }

  /**
   * Load the Drive API client.
   * @param {Function} callback Function to call when the client is loaded.
   */
  function loadClient(callback) {
    gapi.client.load('drive', 'v2', callback);
  }

});
