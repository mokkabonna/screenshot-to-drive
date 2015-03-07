define(['knockout', 'drive/auth', 'gapi', 'promise'], function(ko, auth, gapi, Promise) {
  'use strict';

  var folderMimeType = 'application/vnd.google-apps.folder';
  var allFolders = ko.observableArray();


  var viewModel = {
    auth: auth,
    folders: ko.computed(function() {
      return allFolders();
    })
  };

  window.d = viewModel;

  function loadRootFolders(pageToken) {
    var options = {
      maxResults: 100,
      q: 'mimeType=\'' + folderMimeType + '\' and \'root\' in parents and trashed=false',
    };

    if (pageToken) {
      options.pageToken = pageToken;
    }

    return gapi.client.drive.files.list(options);
  }

  function loadAllRootFoldersInto(allFolders) {
    var folders = [];
    return new Promise(function(resolve, reject) {
      loadRootFolders().then(function handleResult(res) {
        folders = folders.concat(res.result.items);
        allFolders(allFolders().concat(res.result.items));
        if (res.result.nextPageToken) {
          return loadRootFolders(res.result.nextPageToken).then(handleResult);
        } else {
          resolve(folders);
        }
      }, reject);
    });
  }

  function startApplication() {
    loadAllRootFoldersInto(allFolders).catch(function(err) {
      console.err(err);
    });

    ko.applyBindings(viewModel, document.body);
  }

  //attempt login once at start
  auth.login().finally(startApplication);

});
