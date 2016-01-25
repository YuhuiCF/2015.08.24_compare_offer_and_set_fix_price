// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var jshint = require('gulp-jshint');
//var sass = require('gulp-sass');
//var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var minifyHTML = require('gulp-minify-html');
var minifyCSS = require('gulp-minify-css');
var usemin = require('gulp-usemin');
var wrapper = require('gulp-wrapper');
//var rev = require('gulp-rev');

var paths = {
    scripts: {
        all: ['./js/**/*.js'],
        lint: ['./js/*.js','!./js/lib/*']
    },
    css: ['./css/*.css'],
    html: ['./index.html']
};

gulp.task('usemin', function () {
    return gulp.src(paths.html)
        .pipe(usemin({
            css: [minifyCSS()],
            html: [minifyHTML({
                conditionals: true,
                empty: true,
                quotes: true
            })],
            //js: [uglify(), rev()]
            js: ['concat'],
            inlinecss: [ minifyCSS(), 'concat']
        }))
        .pipe(gulp.dest('./dist'));
});

gulp.task('minifyJS', ['usemin'], function(){
    return gulp.src('./dist/js/scripts.js')
        .pipe(wrapper({
            header: '(function(){\n',
            footer: '\n})();'
        }))
        .pipe(uglify())
        .pipe(gulp.dest('./dist/js'));
});

// Lint Task
gulp.task('lint', function() {
    return gulp.src(paths.scripts.lint)
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

// Compile Our Sass
/*
gulp.task('sass', function() {
    return gulp.src('scss/*.scss')
        .pipe(sass())
        .pipe(gulp.dest('css'));
});
*/

// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch(paths.scripts.lint, ['lint']);
    gulp.watch([paths.html, paths.css, paths.scripts.all], ['usemin', 'minifyJS']);
    //gulp.watch('scss/*.scss', ['sass']);
});

// Default Task
gulp.task('default', ['lint', 'usemin', 'minifyJS']);
