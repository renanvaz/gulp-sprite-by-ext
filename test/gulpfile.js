var through = require('through2');
var gulp = require('gulp');
var spriteByExt = require('../index.js');

gulp.task('default', function () {
  return gulp.src(['./images/**/*'])
      .pipe(spriteByExt({
        path:'./'
      }))
      .pipe(gulp.dest('./build'));
});
