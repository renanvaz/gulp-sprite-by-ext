var through = require('through2');
var gulp = require('gulp');
var spriteByExt = require('../index.js');

gulp.task('default', function () {
  return gulp.src(['./images/**/*', '!./images/**/*.svg'])
      .pipe(spriteByExt({
        path: './',
        preprocessor: 'css'
      }))
      .pipe(gulp.dest('./build'));
});
