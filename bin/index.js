#!/usr/bin/env node

const commandName = 'xd2style';
const meow =  require('meow');
const chalk =  require('chalk');
const unzip =  require('extract-zip');
const fileExtension = require('file-extension');
const stripExtension = require('strip-extension');
const tmp = require('tmp');
const fs = require('fs');
const { merge, flattenDeep } = require('lodash');

const { manifestParser } = require('../lib/manifest-parser');
const { artboardToStyleLayers } = require('../lib/artboard-to-style-layers');

const cli = meow(`
  ${chalk.bold('Usage')}
    $ ${commandName} --from <input> --to <input> 
 
  ${chalk.bold('Options')}
    --from, -f  Provide a from input. This is where changes will be read from. Must be a Adobe XD file or Mapbox style template.
    --to, -t  Provide a to input. This is where changes will updated on. Must be a Adobe XD file or Mapbox style template.
 
  ${chalk.bold('Examples')}
    $ ${commandName} --from foo.xd --to foo.json
    $ ${commandName} --from foo.json --to foo.xd
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
  console.log('A --from input must be provided.');
  cli.showHelp();
}

if (!to) {
  console.log('A --to input must be provided.');
  cli.showHelp();
}

let xdFile;
let mbxStyle;

if (fileExtension(from) === 'xd') xdFile = from;
if (fileExtension(from) === 'json') mbxStyle = from;
if (fileExtension(to) === 'xd') xdFile = to;
if (fileExtension(to) === 'json') mbxStyle = to;

// Create a temp directory to dump unzipped .xd contents in.
const directory = tmp.dirSync();
unzip(xdFile, {
  dir: directory.name
}, xdOutput);

const style = JSON.parse(fs.readFileSync(mbxStyle, 'utf-8'));

function xdOutput(err) {
  if (err) {
    return console.log(err);
  }

  const manifest = manifestParser(directory);

  const layersDerivedFromXD = flattenDeep(manifest.artboards.map(d => {
    const json = fs.readFileSync(`${directory.name}/artwork/${d.path}/graphics/graphicContent.agc`, 'utf-8');
    const artboard = JSON.parse(json);
    return artboard.children.map(artboardToStyleLayers);
  }));

  const newLayers = style.layers.map(layer => {
    const { id } = layer;
    const found = layersDerivedFromXD.find(d => d.id === id);

    if (found) {
      return merge(layer, found);
    } else {
      return layer;
    }
  }); 

  style.layers = newLayers;

  fs.writeFile(`${stripExtension(xdFile)}.json`, JSON.stringify(style, null, 2), error => {
    if (error) throw new Error(error);
  });
}
