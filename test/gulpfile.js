var gulp = require('gulp');
var spriteByExt = require('../index.js');

gulp.task('default', function () {
  return gulp.src('./images/**/*')
      .pipe(spriteByExt())
      .pipe(gulp.dest('./build'));
});
