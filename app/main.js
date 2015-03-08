define([
  'knockout',
  'drive/auth',
  'drive/service',
  'gapi',
  'promise',
  'lodash/collection/sortBy',
  './bindings',
  'moment',
], function(ko, auth, service, gapi, Promise, sortBy, foo, moment) {
  'use strict';

  var allFolders = ko.observableArray();
  var allImages = ko.observableArray();
  var rootFolder = {
    id: 'root',
    iconLink: '',
    title: 'Root folder'
  };
  var locale = window.navigator.userLanguage || window.navigator.language;
  moment.locale(locale);

  var viewModel = {
    auth: auth,
    initialized: ko.observable(false),
    handlePaste: handlePaste,
    selectedFolder: ko.observable(rootFolder),
    allImages: allImages,
    getParentFolders: getParentFolders,
    uploadingImages: ko.computed(function() {
      return allImages().filter(function(image) {
        return !image.uploaded();
      });
    }),
    folders: ko.computed(function() {
      return sortBy(allFolders(), 'title');
    })
  };

  //Load root folders when logged in
  auth.isLoggedIn.subscribe(function(loggedIn) {
    if (loggedIn) {
      service.loadAllRootFolders().then(function(folders) {
        allFolders(folders);
      }).catch(function(err) {
        console.error('Could not load root folders');
      });
    }
  });

  //attempt login once at start
  auth.login().catch(function() {
    //do nothing
  }).finally(startApplication);

  return viewModel;
  //Private functions

  function startApplication() {
    ko.applyBindings(viewModel, document.body);
    viewModel.initialized(true);
  }


  function Image(file, metaData) {
    var self = this;
    this.dataURL = ko.observable();
    this.uploaded = ko.observable(false);
    this.file = file;
    this.metaData = ko.observable();
    this.title = metaData.title;
    this.newTitle = ko.observable();
    this.isUpdatingTitle = ko.observable();

    this.newTitle.subscribe(function(title) {
      self.isUpdatingTitle(true);

      gapi.client.drive.files.patch({
        fileId: self.metaData().id,
        resource: {
          title: title
        }
      }).then(function() {
        self.isUpdatingTitle(false);
      }, function() {
        self.isUpdatingTitle(false);
      });
    });
  }

  /**
   * Get the parent folders for a file
   * @return {string} The path
   */
  function getParentFolders(file) {
    return 'Somefolder';
  }


  /**
   * Handles the paste event
   */
  function handlePaste(obj, event) {
    var matchType = /image.*/;
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
        var title = 'Screenshot - ' + moment().format('LLL');

        var metadata = {
          title: title,
          parents: [{
            id: selectedFolderId
          }]
        };

        var image = new Image(file, metadata);

        allImages.push(image);

        service.insertFileInParentFolder(file, metadata).then(function(file) {
          image.uploaded(true);
          image.metaData(file);
        });

        reader = new FileReader();
        reader.onload = function(evt) {
          image.dataURL(evt.target.result);
        };
        reader.readAsDataURL(file);


        return found = true;
      }
    });
    event.preventDefault();
  }

});
