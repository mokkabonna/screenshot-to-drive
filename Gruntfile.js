'use strict';

module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt); // Load grunt tasks automatically

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      files: ['dist']
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      gruntfile: {
        options: {
          jshintrc: '.jshintrc'
        },
        src: 'Gruntfile.js'
      },
      app: {
        options: {
          jshintrc: 'app/.jshintrc',
          reporter: require('jshint-stylish')
        },
        src: ['app/**/*.js']
      },
    },
    replace: {
        release: {
          files: {
            'dist/index.html': ['index.html'],
          },
          options: {
            patterns: [{
              match: /<script[^]+require\.js\"><\/script>/m,
              replacement: '<script async src="main.js"></script>',
          }]
        }
      }
    },
    copy: {
      release: {
        files: [{
          expand: true,
          src: ['bower_components/bootstrap/dist/**'],
          dest: 'dist/'
        }]
      }
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      src: {
        files: '<%= jshint.app.src %>',
        tasks: ['jshint:app']
      },
      test: {
        files: '<%= jshint.test.src %>',
        tasks: ['jshint:test']
      },
      livereload: {
        files: ['index.html', 'app/**/*'],
        options: {
          livereload: true
        },
      }
    },
    requirejs: {
      compile: {
        options: {
          paths: {
            requireLib: '../bower_components/requirejs/require'
          },
          name: 'config',
          mainConfigFile: 'app/config.js',
          include: ['requireLib'],
          out: 'dist/main.js',
          optimize: 'uglify2'
        }
      }
    },
    connect: {
      development: {
        options: {
          hostname: '0.0.0.0',
          port: process.env.PORT || 9001,
          keepalive: true,
          livereload: false
        }
      },
      production: {
        options: {
          keepalive: true,
          port: 80
        }
      }
    }
  });
  

  // Default task.
  grunt.registerTask('default', ['jshint', 'clean', 'requirejs', 'replace:release', 'copy:release']);
  grunt.registerTask('serve', ['connect:development', 'watch:livereload']);
  grunt.registerTask('serve:production', ['connect:production']);

};
