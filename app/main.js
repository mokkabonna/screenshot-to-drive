define([
  'knockout',
  'drive/auth',
  'gapi',
  'promise',
  'lodash/collection/sortBy'
], function(ko, auth, gapi, Promise, sortBy) {
  'use strict';

  var folderMimeType = 'application/vnd.google-apps.folder';
  var allFolders = ko.observableArray();

  var viewModel = {
    auth: auth,
    handlePaste: handlePaste,
    selectedFolder: ko.observable(),
    folders: ko.computed(function() {
      return sortBy(allFolders(), 'title');
    })
  };

  window.d = viewModel;

  /**
   * Insert new file.
   *
   * @param {File} fileData File object to read data from.
   * @param {Function} callback Function to call when the request is complete.
   */
  function insertFileInParentFolder(fileData, parentFolderId, callback) {
    var boundary = '-------314159265358979323846';
    var delimiter = "\r\n--" + boundary + "\r\n";
    var close_delim = "\r\n--" + boundary + "--";

    var reader = new FileReader();
    reader.readAsBinaryString(fileData);
    reader.onload = function(e) {
      var contentType = fileData.type || 'application/octet-stream';
      var metadata = {
        title: 'Screenshot to drive',
        parents: [{
          id: parentFolderId
        }],
        mimeType: contentType
      };

      var base64Data = btoa(reader.result);
      var multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: ' + contentType + '\r\n' +
        'Content-Transfer-Encoding: base64\r\n' +
        '\r\n' +
        base64Data +
        close_delim;

      var request = gapi.client.request({
        'path': '/upload/drive/v2/files',
        'method': 'POST',
        'params': {
          'uploadType': 'multipart'
        },
        'headers': {
          'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
        },
        'body': multipartRequestBody
      });

      request.execute(callback);
    };
  }

  var matchType = /image.*/;

  function handlePaste(obj, event) {
    var clipboardData, found;
    found = false;
    clipboardData = event.clipboardData;
    var selectedFolderId = viewModel.selectedFolder().id;
    Array.prototype.forEach.call(clipboardData.types, function(type, i) {
      var file, reader;
      if (found) {
        return;
      }
      if (type.match(matchType) || clipboardData.items[i].type.match(matchType)) {
        file = clipboardData.items[i].getAsFile();

        insertFileInParentFolder(file, selectedFolderId, function() {
          console.log('inserted', arguments);
        });

        reader = new FileReader();
        reader.onload = function(evt) {

          var image = document.getElementById('pasted');
          image.src = evt.target.result;

          var imageData = {
            dataURL: evt.target.result,
            event: evt,
            file: file,
            name: file.name
          };
        };
        reader.readAsDataURL(file);

        return found = true;
      }
    });
    event.preventDefault();
  }



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
