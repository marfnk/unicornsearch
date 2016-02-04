'use strict';

module.exports = function (grunt) {

    require('load-grunt-tasks')(grunt);

	grunt.initConfig({

		// Empties folders to start fresh
		clean: ["dist/*.*"],

		compass: {
			dist: {
				options: {
					sassDir: 'src',
					cssDir: 'dist',
					//importPath: 'app/bower_components/'
				}
			}
		},

		copy: {
			dist: {
                src: 'src/unicornsearch.js',
                dest: 'dist/unicornsearch.js'
            }
		},

		ngtemplates: {
			app: {
				cwd: 'src/',
				src: [
					'*.html'
				],
				dest: 'dist/unicornsearch.js',
				options: {
					append: true,
					module: 'unicornsearchModule',
					htmlmin: {collapseWhitespace: true}
				}
			}
		}
	});

	grunt.registerTask('build', function () {
		return grunt.task.run([
			'clean',
			'copy:dist',
			'ngtemplates',
			'compass:dist'
		]);
	});

};
