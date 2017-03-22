var gulp = require('gulp');
var plugin = require('../index.js');

gulp.task('default', function () {
  return gulp.src('./images/*')
  .pipe(plugin())
  .pipe(gulp.dest('build'));
});
