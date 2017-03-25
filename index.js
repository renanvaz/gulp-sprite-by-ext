const path        = require('path');
const Q           = require('q');
const svgSprite   = require('svg2sprite');
const through     = require('through2');
const Spritesmith = require('spritesmith');
const Jimp        = require('jimp');
const templater   = require('spritesheet-templates');
const fs          = require('fs');
const gutil       = require('gulp-util');
const PluginError = gutil.PluginError;

const filename    = 'sprite';
const filename2x  = 'sprite@2x';

let images        = {};

function spriteByExt(params = {}) {
    const ACCEPT = ['.jpg','.png','.svg']; // Define extension acceptable (accept JPG, PNG, SVG)
    const DEFAULTS = {
        css: {
          preprocessor: 'css',        // Define css type output (accept css, less, sass, stylus)
          imagePath: '../images/',    // Path to write on CSS for image address
          className: (id, ext) => {   // Pattern of class name
              return ext+'-'+id;
          },
        },
        filename: 'sprite',
        filename2x: 'sprite@2x',
    };

    const CONFIG = Object.assign({}, DEFAULTS, params);

    // Create a array list by extenssion
    let prepare = function prepare(file, encoding, callback) {
        let ext = path.extname(file.path);

        if (file.isNull()) {
            cb(null, file);
            return;
        }

        if (file.isStream()) {
            this.emit('error', new PluginError('gulp-sprite-by-ext', 'Streaming not supported'));
            return callback();
        }

        if (ACCEPT.indexOf(ext) < 0) {
            this.emit('error', new PluginError('gulp-sprite-by-ext', ext+' extension not supported'));
            return callback();
        }

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
            for (let result of response) {
                if (result.ext != '.svg') {
                    let image2x = new gutil.File({
                        path: CONFIG.filename2x+result.ext,
                        contents: result.image2x
                    });

                    let css2x = new gutil.File({
                        path: result.ext.replace('.', '')+'-'+CONFIG.filename2x+'.'+CONFIG.css.preprocessor,
                        contents: new Buffer(templater({
                                sprites: result.coordinates2x,
                                spritesheet: {width: result.properties2x.width, height: result.properties2x.height, image: CONFIG.css.imagePath+CONFIG.filename2x+result.ext}
                            }, {
                                format: CONFIG.css.preprocessor,
                                formatOpts: {cssSelector: (sprite) => CONFIG.css.className(sprite.name, result.ext)}
                            }
                        ))
                    });

                    let css = new gutil.File({
                        path: result.ext.replace('.', '')+'-'+CONFIG.filename+'.'+CONFIG.css.preprocessor,
                        contents: new Buffer(templater({
                                sprites: result.coordinates,
                                spritesheet: {width: result.properties.width, height: result.properties.height, image: CONFIG.css.imagePath+CONFIG.filename+result.ext}
                            }, {
                                format: CONFIG.css.preprocessor,
                                formatOpts: {cssSelector: (sprite) => CONFIG.css.className(sprite.name, result.ext)}
                            }
                        ))
                    });

                    this.push(image2x);
                    this.push(css2x);
                    this.push(css);
                }

                let image = new gutil.File({
                    path: CONFIG.filename+result.ext,
                    contents: result.image
                });

                this.push(image);
            }
        }).done(() => {
            callback();
        });
    };

    return through.obj(prepare, execute);
};

// generate sprite
// ===================================================================================================================================
function generateSprite(ext) {
    let d = Q.defer();

    if (ext === '.svg') {
        const sprite = svgSprite.collection({clean: {stripAttrs: ['id']}});

        let result = {};

        for (let file of images[ext]) {
            sprite.add(path.basename(file.path).replace(/\./g, '-'), file.contents.toString());
        }

        result.ext = ext;
        result.image = new Buffer(sprite.compile());

        setTimeout(() => d.resolve(result) ,0);
    } else {
        Spritesmith.run({src: images[ext]}, function handle(err, result) {
            if (err) { d.reject(); return false; }

            result.ext = ext;

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
        });
    }

    return d.promise;
};

function convertCoordinates(coordinates, scale = 1) {
    var converted = [];

    for (let name in coordinates) {
        converted.push({
            name:   path.basename(name).split('.')[0],
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
