const fs          = require('fs');
const path        = require('path');
const Q           = require('q');
const through     = require('through2');
const Spritesmith = require('spritesmith');
const mkdirp      = require('mkdirp');
const Jimp        = require('jimp');
const templater   = require('spritesheet-templates');
const gutil       = require('gulp-util');
const PluginError = gutil.PluginError;

let images        = {};

function spriteByExt() {
  // path.relative(from, to)

  // Create a array list by extenssion
  let prepare = function prepare(file, encoding, callback) {
    let ext = path.extname(file.path);

    if (typeof images[ext] === 'undefined') images[ext] = [];

    images[ext].push(file);

    callback();
  };

  // Generate an Image and CSS for SpriteSheet
  let execute = function execute(callback) {
    let promises = [];

    for (let ext in images) {
      promises.push(generateSprite(ext));
    }

    Q.all(promises).then((response) => {
      let image, css;

      for (let result of response) {
        if (result.ext == '.png') {
          let image2x = new gutil.File({path: 'sprite@2x'+result.ext, contents: result.image2x});
          let css2x = new gutil.File({path: 'sprite'+result.ext.replace('.', '-')+'.css', contents: result.css2x});

          this.push(image2x);
          this.push(css2x);
        }

        image = new gutil.File({path: 'sprite'+result.ext, contents: result.image});
        css = new gutil.File({path: 'sprite'+result.ext.replace('.', '-')+'.css', contents: result.css});

        this.push(image);
        this.push(css);
      }
    }).done(function(){
      callback();
    });
  };

  return through.obj(prepare, execute);
};

// generate sprite
// ===================================================================================================================================
function generateSprite(ext) {
  let d = Q.defer();

  Spritesmith.run({src: images[ext]}, function handle(err, result) {
    if (err) { d.reject(); return false; }

    result.ext = ext;

    if (ext === '.png') {
      // Consider the default image as 2x
      result.image2x = Buffer.from(result.image);

      // Convert coordnates for templater
      result.coordinates2x = convertCoordinates(result.coordinates);
      result.css2x = new Buffer(templater({sprites: result.coordinates2x, spritesheet: {width: result.properties.width, height: result.properties.height, image: ''}}, {format: 'css'}));

      // Convert coordinates for templater and recalc CSS for 1x
      result.coordinates = convertCoordinates(result.coordinates, .5);
      result.css = new Buffer(templater({sprites: result.coordinates, spritesheet: {width: result.properties.width * .5, height: result.properties.height * .5, image: ''}}, {format: 'css'}));

      // resize image for 1x
      resizeImage(result.image, result.properties.width / 2, result.properties.height / 2).then((buffer) => { result.image = buffer; d.resolve(result); });
    } else {
      // Convert coordnates for templater
      result.coordinates = convertCoordinates(result.coordinates);
      result.css = new Buffer(templater({sprites: result.coordinates, spritesheet: {width: result.properties.width, height: result.properties.height, image: ''}}, {format: 'css'}));
      d.resolve(result);
    }
  });

  return d.promise;
};

function convertCoordinates(coordinates, scale = 1) {
  var converted = [];

  for (let name in coordinates) {
    converted.push({
      name:   path.basename(name).replace(/\./g, '-'),
      x:      coordinates[name].x * scale,
      y:      coordinates[name].y * scale,
      width:  coordinates[name].width * scale,
      height: coordinates[name].height * scale
    });
  }

  return converted;
}

function resizeImage(image, w, h) {
  let d = Q.defer();

  Jimp.read(image).then((jimpImage) => {
    jimpImage.resize(w, h).getBuffer('image/png', (err, buffer) => err ? d.reject(err) : d.resolve(buffer));
  });

  return d.promise;
}

module.exports = spriteByExt;
