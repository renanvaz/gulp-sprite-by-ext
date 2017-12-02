// Load in local modules
const fs         = require('fs');
const handlebars = require('handlebars');
const tmpl       = fs.readFileSync(__dirname + '/css.template.handlebars', 'utf8');

// Register the CSS as a partial for extension
handlebars.registerPartial('css', tmpl);

// Define our css template fn ({sprites, options}) -> css
function cssTemplate(data) {
  // Localize parameters
  const sprites = data.sprites;
  const options = data.options;

  // Fallback class naming function
  const selectorFn = options.cssSelector || function defaultCssClass (sprite) {
    return '.icon-' + sprite.name;
  };

  // Add class to each of the options
  sprites.forEach(function saveClass (sprite) {
    sprite.selector = selectorFn(sprite);
  });

  // Render and return CSS
  const css = handlebars.compile(tmpl)(data);
  return css;
}

// Export our CSS template
module.exports = cssTemplate;
