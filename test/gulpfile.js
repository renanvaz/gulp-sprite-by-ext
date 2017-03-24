var gulp = require('gulp');
var spriteByExt = require('../index.js');

gulp.task('default', function () {
  return gulp.src(['./images/**/*'])
      .pipe(spriteByExt({
        path:'./',
        suffix: '.icon'
      }))
      .pipe(gulp.dest('./build'));
});
