const path        = require('path');
const Q           = require('q');
const through     = require('through2');
const Spritesmith = require('spritesmith');
const Jimp        = require('jimp');
const templater   = require('spritesheet-templates');
const gutil       = require('gulp-util');
const PluginError = gutil.PluginError;

const filename      = 'sprite';
const filename2x    = 'sprite@2x';

let images        = {};

function spriteByExt(params = {}) {
  const defaults = {
    path: '../images/', // Path to write on CSS for image address
    preprocessor: 'css' // Define css type output (accept css, less, sass, stylus)
  };

  const config = Object.assign({}, defaults, params);

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
          let image2x = new gutil.File({
            path: filename2x+result.ext,
            contents: result.image2x
          });

          let css2x = new gutil.File({
            path: filename2x+result.ext.replace('.', '-')+'.'+config.preprocessor,
            contents: new Buffer(templater({sprites: result.coordinates2x, spritesheet: {width: result.properties2x.width, height: result.properties2x.height, image: config.path+filename2x+result.ext}}, {format: config.preprocessor}))
          });

          this.push(image2x);
          this.push(css2x);
        }

        image = new gutil.File({
          path: filename+result.ext,
          contents: result.image
        });

        css = new gutil.File({
          path: filename+result.ext.replace('.', '-')+'.'+config.preprocessor,
          contents: new Buffer(templater({sprites: result.coordinates, spritesheet: {width: result.properties.width, height: result.properties.height, image: config.path+filename+result.ext}}, {format: config.preprocessor}))
        });

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
      result.properties2x = {width: result.properties.width, height: result.properties.height};

      // Convert coordinates for templater and recalc CSS for 1x
      result.coordinates = convertCoordinates(result.coordinates, .5);
      result.properties = {width: result.properties.width * .5, height: result.properties.height * .5};

      // resize image for 1x
      resizeImage(result.image, result.properties.width, result.properties.height).then((buffer) => { result.image = buffer; d.resolve(result); });
    } else {
      // Convert coordnates for templater
      result.coordinates = convertCoordinates(result.coordinates);
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
