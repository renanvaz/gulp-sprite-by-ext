var gulp = require('gulp');
var spriteByExt = require('../index.js');

gulp.task('default', function () {
  return gulp.src(['./images/**/*.{png,jpg,svg}'])
      .pipe(spriteByExt({
        css: {
            imagePath:  './',
        }
      }))
      .pipe(gulp.dest('./build'));
});
