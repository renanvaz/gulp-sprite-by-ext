# [gulp](http://gulpjs.com)-sprite-by-ext

[![npm version](https://badge.fury.io/js/gulp-sprite-by-ext.svg)](http://badge.fury.io/js/gulp-sprite-by-ext)

> Sprite generator by extension file by gulp.

## Installation

Install with [npm](https://npmjs.org/package/gulp-sprite-generator):
```
npm install --save-dev gulp-sprite-by-ext
```

## Usage
Sprite-By-Ext is a gulp task for generate sprite image and style by type of  file image. below is a simple example for use:

```js
const gulp        = require('gulp');
const spriteByExt = require('gulp-sprite-by-ext');

gulp.task('sprite-by-ext', function () {
    return gulp.src(['./images/**/*'])
    .pipe(spriteByExt())
    .pipe(gulp.dest('./dist'));
});
```

## Options
Sprite-By-Ext can accept some options for use:

```js
const gulp        = require('gulp');
const spriteByExt = require('gulp-sprite-by-ext');

gulp.task('default', function () {
    return gulp.src(['./images/**/*.{png,jpg,svg}'])
    .pipe(spriteByExt({
        css: {
            imagePath: '../images/',    // Path to write on CSS for image address
        },
        slug: (id, ext) => ext + '-' + id, // Pattern of class name and symbols id
        filename: 'sprite',
        filename2x: 'sprite@2x',
    }))
    .pipe(gulp.dest('./build'));
});
```

**Plugin options** are:

Property           | Necessary | Type         | Plugin default value
-------------------|-----------|--------------|-----------
[css.imagePath]    | no        | `String`     | `../images/`
[slug]             | no        | `function`   | `(id, ext) => ext + '-' + id`
[filename]         | no        | `String`     | `sprite`
[filename2x]       | no        | `String`     | `sprite@2x`

More detailed explanation is below.

#### css.imagePath
Type: `String`
Default value: `../images/`

Defines which folder will have the image in css.

#### slug
Type: `function`
Returns: `String`
Default value: `(id, ext) => ext + '-' + id`

Defines class name pattern in css.

#### filename
Type: `String`
Default value: `sprite`

Defines name pattern of sprite output file.

#### filename
Type: `String`
Default value: `sprite@2x`

Defines name pattern of sprite retina output file.
