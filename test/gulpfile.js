var gulp = require('gulp');
var spriteByExt = require('../index.js');

gulp.task('default', function () {
    return gulp.src(['./images/**/*.{png,jpg,svg}'])
    .pipe(spriteByExt({
        css: {
            preprocessor: 'css',
            imagePath: '../image/'
        },
        filename: 'image',
        filename2x: 'image@2x',
    }))
    .pipe(gulp.dest('./build'));
});
