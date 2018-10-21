'use strict';

const { merge } = require('lodash');
const { parseName } = require('./parse-name');

function interpolatableZoomValue() {
  return [
    'interpolate',
    ['linear'],
    ['zoom']
  ];
}

function stepZoomValue() {
  return [
    'step',
    ['zoom']
  ];
}

function formatFontName(name) {
  // Drop hyphens separating font variant.
  // Space separate camelcase.
  return name
    .replace(/-/g, ' ')
    .replace(/([a-z])([A-Z])/g, ' $1 $2');
}

function has(value) {
  return value && value !== 'none';
}

function containsValue(current, value) {
  if (typeof current === 'object') {
    return current.indexOf(value) >= 0;
  } else {
    return current === value;
  }
}

function getZoom(attributes) {
  const { zoom } = parseName(attributes.id);
  return typeof zoom === 'number' ? zoom : 0;
}

// Return a modified style layer with the changes found in `attributesToApply`.
function svgjsonToStyleLayers(attributesToApply, styleLayer) {

  function determineNewValue(obj, property, value, index) {
    const isFont = property === 'fontFamily';
    const { zoom } = parseName(attributesToApply[index].id);

    if (obj[property]) {

      // If obj already contains the same value, return early.
      if (containsValue(obj[property], value)) return obj;

      // Is this is a zoom value?
      if (typeof zoom === 'number') {
        if (isFont) {
          if (obj[property].length === 1) {
            obj[property] = stepZoomValue()
              .concat([
                getZoom(attributesToApply[index - 1]),
                ['literal', [obj[property]]]
              ])
              .concat([
                zoom,
                ['literal', [value]]
              ]);
          } else {
            obj[property] = obj[property].concat([zoom, value]);
          }
        } else {
          // If its not object, transform it into a zoom expression.
          if (typeof obj[property] !== 'object') {
            obj[property] = interpolatableZoomValue()
              .concat([getZoom(attributesToApply[index - 1]), obj[property]])
              .concat([zoom, value])
          } else {
            obj[property] = obj[property].concat([zoom, value]);
          }
        }
      }
    } else {
      obj[property] = isFont ? [value] : value;
    }

    return obj;
  }

  const formatValues = attributesToApply.reduce((memo, attributes, index) => {
    const {
      fill,
      'font-family': fontFamily,
      'font-size': fontSize,
      stroke,
      'stroke-width': strokeWidth
    } = attributes;

    if (has(fill)) {
      memo = determineNewValue(memo, 'fill', fill, index);
    }

    if (has(fontFamily)) {
      memo = determineNewValue(memo, 'fontFamily', formatFontName(fontFamily), index);
    }

    if (has(fontSize)) {
      memo = determineNewValue(memo, 'fontSize', parseInt(fontSize, 10), index);
    }

    if (has(stroke)) {
      memo = determineNewValue(memo, 'stroke', stroke, index);
    }

    if (has(strokeWidth)) {
      memo = determineNewValue(memo, 'strokeWidth', parseFloat(strokeWidth), index);
    }

    return memo;
  }, {});

  const {
    fill,
    fontFamily,
    fontSize,
    stroke,
    strokeWidth
  } = formatValues;

  let diff;
  switch (styleLayer.type) {
    case 'background':
      if (fill) diff = { paint: { 'background-color': fill }}
      break;
    case 'fill':
      diff = { paint: {} };
      if (fill) diff.paint['fill-color'] = fill;
      if (stroke) diff.paint['fill-outline-color'] = stroke;
      break;
    case 'line':
      diff = { paint: {} };
      if (fill) diff.paint['line-color'] = fill;
      if (stroke) diff.paint['line-color'] = stroke;
      if (strokeWidth) diff.paint['line-width'] = strokeWidth;
      break;
    case 'symbol':
      diff = { paint: {}, layout: {} };
      if (fontFamily) diff.layout['text-font'] = fontFamily;
      if (fontSize) diff.layout['text-size'] = fontSize;
      if (fill) diff.paint['text-color'] = fill;
      break;
  }

  return diff ? merge(styleLayer, diff) : styleLayer;
}

module.exports = { svgjsonToStyleLayers };
