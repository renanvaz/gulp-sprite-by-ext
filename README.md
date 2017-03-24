# gulp-spritebyext

Sprite generator by extension file by [gulp][]

## Installation

Install package with NPM and add it to your development dependencies:

`npm install --save-dev gulp-spritebyext`

## Usage

```js
var spriteByExt = require('../index.js');

gulp.task('default', function () {
    return gulp.src(['./images/**/*'])
    .pipe(spriteByExt())
    .pipe(gulp.dest('./dist'));
});
```
