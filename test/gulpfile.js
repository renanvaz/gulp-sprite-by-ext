var through = require('through2');
var gulp = require('gulp');
var spriteByExt = require('../index.js');

gulp.task('default', function () {
  return gulp.src(['./images/**/*', '!./images/**/*.svg'])
      .pipe(spriteByExt())
      .pipe(gulp.dest('./build'));
});


function teste() {
  // path.relative(from, to)

  // Create a array list by extenssion
  let prepare = function prepare(file, encoding, callback) {
    console.log(file.path);

    callback();
  };

  return through.obj(prepare);
};
