#!/usr/bin/env node

'use strict';

const unzip =  require('extract-zip');
const tmp = require('tmp');
const fs = require('fs');
const { merge, flattenDeep } = require('lodash');

const { manifestParser } = require('./lib/manifest-parser');
const { artboardConverter } = require('./lib/artboard-converter');

const xdFile = process.argv[2];
const mbxStyle = process.argv[3];

if (!xdFile) {
  console.log('An .xd file is required as the first argument');
  return;
}

if (!mbxStyle) {
  console.log('A Mapbox GL style is required as second argument');
  return;
}

// Create a temp directory to dump unzipped .xd contents in.
const directory = tmp.dirSync();
unzip(xdFile, {
  dir: directory.name
}, result);

const style = JSON.parse(fs.readFileSync(mbxStyle, 'utf-8'));

function result(err) {
  if (err) {
    return console.log(err);
  }

  const manifest = manifestParser(directory);

  const layersDerivedFromXD = flattenDeep(manifest.artboards.map(d => {
    const json = fs.readFileSync(`${directory.name}/artwork/${d.path}/graphics/graphicContent.agc`, 'utf-8');
    const artboard = JSON.parse(json);
    return artboard.children.map(artboardConverter);
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

  fs.writeFile(`${__dirname}/xd_style.json`, JSON.stringify(style, null, 2), error => {
    if (error) throw new Error(error);
  });
}
