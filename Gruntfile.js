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
    concat: {
      dist: {
        src: ['components/requirejs/require.js', '<%= concat.dist.dest %>'],
        dest: 'dist/require.js'
      },
    },
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        src: '<%= concat.dist.dest %>',
        dest: 'dist/require.min.js'
      },
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
          out: '<%= concat.dist.dest %>',
          optimize: 'none'
        }
      }
    },
    connect: {
      development: {
        options: {
          port: 80,
          keepalive: false,
          livereload: true
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
  grunt.registerTask('default', ['jshint', 'clean', 'requirejs', 'concat', 'uglify']);
  grunt.registerTask('serve', ['connect:development', 'watch:livereload']);
  grunt.registerTask('serve:production', ['connect:production']);

};
