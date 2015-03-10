define([
  'knockout',
  'drive/auth',
  'drive/service',
  'gapi',
  'promise',
  'lodash/collection/sortBy',
  './bindings',
  'moment',
  './registerKnockoutComponents',
], function(ko, auth, service, gapi, Promise, sortBy, foo, moment, registerKnockoutComponents) {
  'use strict';

  registerKnockoutComponents();

  var allFolders = ko.observableArray();
  var allImages = ko.observableArray();
  var locale = window.navigator.userLanguage || window.navigator.language;
  var poppedState;


  var rootFolder = {
    id: 'root',
    iconLink: '',
    title: 'Top Folder'
  };

  var hierarcy = ko.observableArray([rootFolder]);

  moment.locale(locale);

  var viewModel = {
    auth: auth,
    hierarcy: hierarcy,
    initialized: ko.observable(false),
    handlePaste: handlePaste,
    selectedFolder: ko.observable(rootFolder),
    allImages: allImages,
    getParentFolders: getParentFolders,
    goFullscreen: goFullscreen,
    revertToFolder: function(folder) {
      hierarcy(hierarcy.slice(0, hierarcy.indexOf(folder)));
      viewModel.selectedFolder(folder);
    },
    uploadingImages: ko.pureComputed(function() {
      return allImages().filter(function(image) {
        return !image.uploaded();
      });
    }),
    subFolders: ko.pureComputed(function() {
      var sorted = sortBy(allFolders(), 'title');
      return sorted.filter(function(folder) {
        return folder.parents.some(function(parent) {
          var id = viewModel.selectedFolder().id;
          if (id === 'root') {
            id = auth.rootFolderId();
          }
          return parent.id === id;
        });
      });
    })
  };

  viewModel.selectedFolder.subscribe(function(folder) {
    hierarcy.push(folder);
    // if (poppedState !== folder && folder.id !== 'root') {
    //   history.pushState(folder, folder.title, folder.id);
    // }
  });

  //Load root folders when logged in
  auth.isLoggedIn.subscribe(function(loggedIn) {
    if (loggedIn) {
      service.loadAllRootFolders().then(function(folders) {
        allFolders(folders);
        //then load all folders and replace
        service.loadAllFolders().then(function(folders) {
          allFolders(folders);
        });
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

    window.addEventListener("popstate", function(e) {
      poppedState = e.state;
      if (e.state === null) {
        viewModel.selectedFolder(rootFolder);
      } else {
        viewModel.selectedFolder(e.state);
      }
    });

    ko.applyBindings(viewModel, document.body);
    viewModel.initialized(true);
  }

  function isFullscreen() {
    return document.fullscreenElement || document.webkitFullscreenElement || document.mozFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
  }

  function goFullscreen(data, event) {
    var i = event.srcElement;
    if (!isFullscreen()) {
      if (i.requestFullscreen) {
        i.requestFullscreen();
      } else if (i.webkitRequestFullscreen) {
        i.webkitRequestFullscreen();
      } else if (i.mozRequestFullScreen) {
        i.mozRequestFullScreen();
      } else if (i.msRequestFullscreen) {
        i.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
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
