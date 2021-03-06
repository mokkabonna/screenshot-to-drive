define([
  'gapi',
  'promise',
  'ko',
  'moment',
  './auth',
  'ga',
], function(gapi, Promise, ko, moment, auth, ga) {
  'use strict';

  var folderMimeType = 'application/vnd.google-apps.folder';
  var desiredFields = 'items(id,parents,title)';

  var exports = {
    loadAllRootFolders: loadAllRootFolders,
    loadAllFolders: loadAllFolders,
    loadAllFoldersUnderParent: loadAllFoldersUnderParent,
    insertFileInParentFolder: insertFileInParentFolder,
    createNewFolder: createNewFolder
  };

  return exports;
  //Private methods

  function loadAllFoldersPage(pageToken) {
    var options = {
      maxResults: 1000,
      q: 'mimeType=\'' + folderMimeType + '\' and trashed=false',
      fields: desiredFields,
    };

    if (pageToken) {
      options.pageToken = pageToken;
    }

    return gapi.client.drive.files.list(options);
  }

  function loadAllFolders() {
    var folders = [];
    return new Promise(function(resolve, reject) {
      ga('send', 'event', 'load-folders', 'start');
      loadAllFoldersPage().then(function handleResult(res) {
        folders = folders.concat(res.result.items);
        if (res.result.nextPageToken) {
          return loadAllFoldersPage(res.result.nextPageToken).then(handleResult);
        } else {
          ga('send', 'event', 'load-folders', 'completed');
          resolve(folders);
        }
      }, function(err) {
        ga('send', 'event', 'load-folders', 'failed');
        reject(err);
      });
    });
  }

  /**
   * Loads the first or specified page of folders in the root folder
   * @param  {string} pageToken The token for the specific page
   * @return {Promise<result>}           [description]
   */
  function loadPageOfFolders(parentId, pageToken) {
    var options = {
      maxResults: 1000,
      q: 'mimeType=\'' + folderMimeType + '\' and \'' + parentId + '\' in parents and trashed=false',
      fields: desiredFields
    };

    if (pageToken) {
      options.pageToken = pageToken;
    }

    return gapi.client.drive.files.list(options);
  }

  function loadAllFoldersUnderParent(parentId) {
    var folders = [];
    return new Promise(function(resolve, reject) {
      loadPageOfFolders(parentId).then(function handleResult(res) {
        folders = folders.concat(res.result.items);
        if (res.result.nextPageToken) {
          return loadPageOfFolders(parentId, res.result.nextPageToken).then(handleResult);
        } else {
          resolve(folders);
        }
      }, reject);
    });
  }

  /**
   * Loads all folders in the root folder, notifies if possible
   * @param  {ObservableArray} allFolders [description]
   * @return {Promise<Array<drive#file>>}   A list of folders
   */
  function loadAllRootFolders() {
    return loadAllFoldersUnderParent(auth.rootFolderId());
  }

  /**
   * Creates a new Folder in the parent folder
   */
  function createNewFolder(title, parentId) {
    return new Promise(function(resolve, reject) {
      ga('send', 'event', 'create-folder', 'start');
      gapi.client.drive.files.insert({
        title: title,
        parents: [{
          id: parentId
        }],
        mimeType: folderMimeType
      }).then(function(response) {
        ga('send', 'event', 'create-folder', 'completed');
        resolve(response.result);
      }, function(err) {
        ga('send', 'event', 'create-folder', 'failed');
        reject(err);
      });
    });
  }

  /**
   * Insert new file.
   *
   * @param {File} fileData File object to read data from.
   * @param {Function} callback Function to call when the request is complete.
   */
  function insertFileInParentFolder(fileData, metadata) {
    return new Promise(function(resolve, reject) {
      ga('send', 'event', 'upload-file', 'start');
      var boundary = '-------314159265358979323846';
      var delimiter = "\r\n--" + boundary + "\r\n";
      var close_delim = "\r\n--" + boundary + "--";

      var reader = new FileReader();
      reader.readAsBinaryString(fileData);
      reader.onload = function() {
        var contentType = fileData.type || 'application/octet-stream';
        metadata.mimeType = contentType;

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

        ga('send', 'event', 'upload-file', 'posting');
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

        request.then(function(response) {
          ga('send', 'event', 'upload-file', 'completed');
          resolve(response.result);
        }, function(err) {
          ga('send', 'event', 'upload-file', 'failed');
          reject(err);
        });
      };
    });
  }


});
