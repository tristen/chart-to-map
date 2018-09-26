'use strict';

const { reduce, isEqual } = require('lodash');
const namePattern = /__/;

function getType(layer) {
  const name = layer.name.split(namePattern)[0];
  if (name === 'background') return 'background';
  if (layer.type === 'text') return 'symbol';
  if (layer.style.fill) return 'fill';
  return 'line';
}

function getColor(color) {
  const { mode, value } = color;
  if (mode === 'RGB') {
    const { r, g, b } = value;
    return `rgb(${r}, ${g}, ${b})`;
  }
  return '#000'
}

function difference(a, b) {
  // Compare objects to determine which layer qualifies for zoom values.
  return reduce(a, (memo, value, key) => {
    return isEqual(value, b[key])
      ? memo
      : memo.concat(key);
  }, []);
}

function generateBackground(id, styles) {
  const first = styles[0].style;
  let backgroundColor = getColor(first.fill.color);

  return {
    id,
    paint: {
      'background-color': backgroundColor
    }
  }
}

function generateFill(id, styles) {
  const first = styles[0].style;
  let fillColor = getColor(first.fill.color);

  const paint = {
    'fill-color': fillColor
  };

  if (first.stroke.type === 'solid') {
    paint['fill-outline-color'] = getColor(first.stroke.color);
  }

  return { id, paint }
}

function generateLine(id, styles) {
  const first = styles[0].style;
  let lineColor = getColor(first.stroke.color);
  let lineWidth = first.stroke.width;

  // TODO Handle zoom
  /*
  {
    "base": 1,
    "stops": [[8, 1], [16, 8]]
  }
  */
  /*
    if (style.length !== 1) {
      const hasZoom = difference();
    }
  */

  return {
    id,
    paint: {
      'line-color': lineColor,
      'line-width': lineWidth
    }
  }
}

function generateSymbol(id, styles) {
  const first = styles[0].style;
  let textColor = getColor(first.fill.color);
  let textFont = `${first.font.family} ${first.font.style}`;
  let textSize = first.font.size;
  let textLineHeight = first.textAttributes.lineHeight;

  return {
    id,
    layout: {
      'text-font': [textFont],
      'text-size': textSize,
      'text-line-height': textLineHeight
    },
    paint: {
      'text-color': textColor
    }
  }
}

// Return an array of objects closely resembling Mapbox GL Style layer
// objects for diffing.

function artboardConverter(collection) {

  const layers = collection.artboard.children
    // Only grab layers we care about: (names containing "__")
    .filter(obj => {
      return obj.name.split(namePattern).length === 2;
    })
    // Combine numbered layer names for zoom styling
    .reduce((memo, obj) => {
      const name = obj.name.split(namePattern);
      if (name[1] === 'all') {
        memo.push({
          name: name[0],
          type: getType(obj),
          styles: [{
            zoom: 'all',
            style: obj.style
          }]
        });
        return memo;
      }

      const exists = memo.findIndex(d => d.name === name[0]);
      if (exists !== -1) {
        memo[exists].styles.push({
          zoom: parseInt(name[1]),
          style: obj.style
        })
      } else {
        memo.push({
          name: name[0],
          type: getType(obj),
          styles: [{
            zoom: parseInt(name[1]),
            style: obj.style
          }]
        })
      }

      return memo;
    }, []);

  return layers.map(layer => {
    switch (layer.type) {
      case 'background':
        return generateBackground(layer.name, layer.styles);
      case 'symbol':
        return generateSymbol(layer.name, layer.styles);
      case 'fill':
        return generateFill(layer.name, layer.styles);
      case 'line':
        return generateLine(layer.name, layer.styles);
    }
  });
}

module.exports = { artboardConverter };
