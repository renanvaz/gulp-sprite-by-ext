var through     = require('through2');
var Spritesmith = require('spritesmith');
var fs          = require('fs');
var path        = require('path')
var mkdirp      = require('mkdirp');
var Jimp        = require("jimp");
var templater   = require('spritesheet-templates');
var gutil       = require('gulp-util');
var PluginError = gutil.PluginError;

const PLUGIN_NAME = 'gulp-spriteluego';

// generate style
// ===================================================================================================================================
function createCss(result){
  var count         = 0;
  var extension     = null;
  var cssRetina     = {};
  var css           = {};

  cssRetina["sprites"] = [];
  cssRetina["retina_sprites"] = [];
  cssRetina["retina_groups"] = [];
  css["sprites"] = [];

  for (var key in result.coordinates){

    count += 1;
    extension = path.extname(key);

    if (extension === ".png") {

      cssRetina["sprites"].push({
        name: nameSelector (extension,count),
        x: result.coordinates[key].x / 2,
        y: result.coordinates[key].y / 2,
        width: result.coordinates[key].width / 2,
        height: result.coordinates[key].height / 2
      });

      cssRetina["retina_sprites"].push({
        name: nameSelector (extension,count) + '@2x',
        x: result.coordinates[key].x,
        y: result.coordinates[key].y,
        width: result.coordinates[key].width,
        height: result.coordinates[key].height
      });

      cssRetina["spritesheet"] = { width: result.properties.width / 2, height: result.properties.height / 2, image: 'sprite'+extension };
      cssRetina["retina_spritesheet"] = { width: result.properties.width, height: result.properties.height, image: 'sprite@2x'+extension };

      cssRetina["retina_groups"].push({
        name: nameSelector (extension,count), index: (count -1)
      });

    }else{

      css["sprites"].push({
        name: nameSelector (extension,count),
        x: result.coordinates[key].x,
        y: result.coordinates[key].y,
        width: result.coordinates[key].width,
        height: result.coordinates[key].height
      });
      css["spritesheet"] = { width: result.properties.width , height: result.properties.height, image: 'sprite'+extension };

    }

  };

  // naming css
  function nameSelector (data,index){
    return data.replace(".", "")+ '-' +'sprite' + index;
  };

  if (extension === ".png") {
    return cssRetina;
  }else{
    return css;
  }
};

// generate sprite
// ===================================================================================================================================
function generateSprite(fileImage,pathExtension,extName){

  Spritesmith.run({src: fileImage}, function handleResult (err, result) {

    var stylePath        = pathExtension + 'sprite.css';
    var spritePath       = pathExtension + 'sprite' + extName;
    var spriteRetinaPath = pathExtension + 'sprite@2x' + extName;

    if (extName === ".png"){

      // resize image
      Jimp.read(result.image).then(function (retina) {
        retina.resize(result.properties.width/2, result.properties.height/2).write(spritePath);
      });

      mkdirp(pathExtension, function () {
        makeImage(spriteRetinaPath,result);
        makeCss(stylePath,result,'css_retina');
      });

    }else{

      mkdirp(pathExtension, function () {
        makeImage(spritePath,result);
        makeCss(stylePath,result,'css');
      });

    };

  });

  // create file Image
  function makeImage(urlImage,generate){
    return fs.writeFileSync(urlImage, generate.image);
  }

  // create file style
  function makeCss(urlStyle,generate,preprocessor){
    return fs.writeFileSync(urlStyle, templater(createCss(generate), {'format': preprocessor}));
  }

};

// main plugin
// ===================================================================================================================================
function spriteluego() {

  // init variables
  var imagesPng = [];
  var imagesJpg = [];
  var baseOutput = __dirname + '/test/sprite/';

  // init transform
  var onBegin = function(file, encoding, callback) {
    var extension = path.extname(file.path);
    if(extension === ".png"){
      imagesPng.push(file);
    }
    if(extension === ".jpg"){
      imagesJpg.push(file);
    }
    callback();
  };

  // end transform
  var onEnd = function(callback) {
    generateSprite(imagesPng , baseOutput + "PNG/" , ".png");
    generateSprite(imagesJpg , baseOutput + "JPG/" , ".jpg");
    callback();
  };

  return through.obj(onBegin,onEnd);
};

module.exports = spriteluego;
