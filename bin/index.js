#!/usr/bin/env node

const COMMAND = 'chart2map';

const meow =  require('meow');
const chalk =  require('chalk');
const fileExtension = require('file-extension');
const stripExtension = require('strip-extension');
const svgson = require('svgson-next').default
const { stringify } = require('svgson-next');
const SVGO = require('svgo');
const fs = require('fs');
const { flattenDeep } = require('lodash');

const { parseName } = require('../lib/parse-name');
const { svgjsonToStyleLayers } = require('../lib/svgjson-to-style-layers');
const { styleLayersToSvgjson } = require('../lib/style-layers-to-svgjson');

const inlineStylesPreserveId = require('../svgo/inline-styles-preserve-id');
const convertStyleToAttrs = require('../svgo/convert-style-to-attrs');
const cleanIllustratorIds = require('../svgo/clean-illustrator-ids');

const svgo = new SVGO({
  plugins : [
    // Custom
    { inlineStylesPreserveId },
    { convertStyleToAttrs },
    { cleanIllustratorIds },

    // Default
    {
      inlineStyles: false
    }
  ]
});

const cli = meow(`
  ${chalk.bold('Usage')}
    $ ${COMMAND} --from <input> --to <input>

  ${chalk.bold('Options')}
    --from, -f  Provide a from input. This is where changes will be read from. Must be a SVG file or Mapbox style template.
    --to, -t  Provide a to input. This is where changes will updated on. Must be a SVG file or Mapbox style template.

  ${chalk.bold('Examples')}
    $ ${COMMAND} --from foo.svg --to style.json
    $ ${COMMAND} --from style.json --to foo.svg
`, {
  flags: {
    from: {
      type: 'string',
      alias: 'f'
    },
    to: {
      type: 'string',
      alias: 't'
    }
  }
});

const { from, to } = cli.flags;

if (!from) {
  console.log(`${chalk.yellow('A --from input must be provided.')}`);
  cli.showHelp();
}

if (!to) {
  console.log(`${chalk.yellow('A --to input must be provided.')}`);
  cli.showHelp();
}

let svgFile;
let mbxStyle;

if (fileExtension(from) === 'svg') svgFile = from;
if (fileExtension(from) === 'json') mbxStyle = from;
if (fileExtension(to) === 'svg') svgFile = to;
if (fileExtension(to) === 'json') mbxStyle = to;

// Get the map style json
const style = JSON.parse(fs.readFileSync(mbxStyle, 'utf-8'));

// Get the svg as json
svgo.optimize(fs.readFileSync(svgFile, 'utf-8'))
  .then(result => svgson(result.data))
  .then(svgCleanOutput)
  .catch(err => {
    console.log(err);
    console.log(`${chalk.red(`Error reading SVG: ${err.message}`)}`);
    cli.showHelp();
});

// Collect all the attribute objects from children arrays and 
// flatten the result.
function traverse(node, path = [], result = []) {
  if (!node.children.length) {
    result.push(path.concat(node.attributes));
  }

  for (const child of node.children) {
    traverse(child, path.concat(node.attributes), result);
  }

  return flattenDeep(result);
}

function walk(children) {
  return children.map(child => {
    if (child.attributes && child.attributes.id) {
      const { id } = parseName(child.attributes.id);
      const matchingStyleLayer = style.layers.find(l => l.id === id);

      if (matchingStyleLayer) {
        child.attributes = styleLayersToSvgjson(matchingStyleLayer, child.attributes);
      }
    }

    if (child.children.length) {
      walk(child.children);
    }

    return child;
  });
}

function svgCleanOutput(svgJson) {
  // console.log(JSON.stringify(childAttributes, null, 2));

  if (fileExtension(from) === 'svg') {
    const childAttributes = traverse(svgJson);

    const newLayers = style.layers.map(layer => {
      const { id } = layer;

      const attributesToApply = childAttributes
        .filter(attr => (attr.id && parseName(attr.id).id === id))
        .sort((a, b) => (parseName(a.id).zoom - parseName(b.id).zoom));

      return attributesToApply.length 
        ? svgjsonToStyleLayers(attributesToApply, layer)
        : layer;
    });

    style.layers = newLayers;

    fs.writeFile(`${stripExtension(svgFile)}.json`, JSON.stringify(style, null, 2), e => {
      if (e) throw new Error(e);
    });

  } else if (fileExtension(from) === 'json') {

    svgJson.children = walk(svgJson.children);

    fs.writeFile(`${stripExtension(mbxStyle)}.svg`, stringify(svgJson), e => {
      if (e) throw new Error(e);
    });

  } else {
    console.log(`${chalk.red('A valid --from input must be provided.')}`);
    cli.showHelp();
  }
}
