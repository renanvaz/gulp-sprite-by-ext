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
    const _this = this;

    for (let ext in images) {
      promises.push(generateSprite(ext));
    }

    Q.all(promises).then(function(response){

      let imageJpg = new gutil.File({
        path:"./JPG/sprite.jpg",
        contents:response[0].image
      });

      _this.push(imageJpg);

      let cssJpg = new gutil.File({
        path:"./JPG/sprite.css",
        contents:new Buffer(response[0].css)
      });

      _this.push(cssJpg);

      let imagePngRetina = new gutil.File({
        path:"./PNG/sprite@2x.png",
        contents:response[1].image2x
      });

      _this.push(imagePngRetina);

      let imagePng = new gutil.File({
        path:"./PNG/sprite.png",
        contents:response[1].image
      });

      _this.push(imagePng);

      let cssPng = new gutil.File({
        path:"./PNG/sprite.css",
        contents:new Buffer(response[1].css)
      });

      _this.push(cssPng);

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

    if (ext === '.png') {
      // Consider the default image as 2x
      result.coordinates2x = convertCoordinates(result.coordinates);
      result.image2x = Buffer.from(result.image);

      // Recalc CSS for 1x
      result.coordinates = convertCoordinates(result.coordinates, .5);

      result.css = templater(createCss(result), {format: 'css'});

      // resize image for 1x
      resizeImage(result.image, result.properties.width / 2, result.properties.height / 2).then((buffer) => { result.image = buffer; d.resolve(result); });

    } else {
      result.css = templater(createCss(result), {format: 'css'});
      d.resolve(result);
    }
  });

  return d.promise;
};

function convertCoordinates(coordinates, scale = 1) {
  var converted = [];

  for (let name in coordinates) {
    converted.push({
      name:   name.replace('.([^.]+)$', '-sprite-$1'),
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

// generate style
// ===================================================================================================================================
function createCss(result) {

  // variable
  let count         = 0;
  let extension     = null;
  let cssRetina     = {};
  let css           = {};

  // init object collections
  cssRetina['sprites']        = [];
  cssRetina['retina_sprites'] = [];
  cssRetina['retina_groups']  = [];
  css['sprites']              = [];

  // retrieve cordinates image and generate css
  for (let key in result.coordinates) {
    count += 1;
    extension = path.extname(key);

    if (extension === '.png') {
      cssRetina['sprites'].push({
        name:   nameSelector(extension,count),
        x:      result.coordinates[key].x / 2,
        y:      result.coordinates[key].y / 2,
        width:  result.coordinates[key].width / 2,
        height: result.coordinates[key].height / 2
      });

      cssRetina['retina_sprites'].push({
        name:   nameSelector(extension,count)+'@2x',
        x:      result.coordinates[key].x,
        y:      result.coordinates[key].y,
        width:  result.coordinates[key].width,
        height: result.coordinates[key].height
      });

      cssRetina['spritesheet'] = {width: result.properties.width / 2, height: result.properties.height / 2, image: 'sprite'+extension};
      cssRetina['retina_spritesheet'] = {width: result.properties.width, height: result.properties.height, image: 'sprite@2x'+extension};

      cssRetina['retina_groups'].push({
        name: nameSelector (extension,count), index: (count -1)
      });
    } else {
      css['sprites'].push({
        name: nameSelector (extension,count),
        x: result.coordinates[key].x,
        y: result.coordinates[key].y,
        width: result.coordinates[key].width,
        height: result.coordinates[key].height
      });
      css['spritesheet'] = {width: result.properties.width , height: result.properties.height, image: 'sprite'+extension};
    }
  }

  // naming css
  function nameSelector(name) {
    return name.replace('.([^.]+)$', '-sprite-$1');
  };

  // return style by extension
  if (extension === '.png') {
    return cssRetina;
  } else {
    return css;
  }
};

module.exports = spriteByExt;
