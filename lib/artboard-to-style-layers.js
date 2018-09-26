'use strict';

const namePattern = /__/;

function initializeZoomValue() {
  return [
    'interpolate',
    ['linear'],
    ['zoom']
  ];
}

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

function generateBackground(id, styles) {
  let backgroundColor;

  if (styles.length === 1) {

    // Literal
    const { style } = styles[0];
    backgroundColor = getColor(style.fill.color);
  } else {

    // Zoom expression
    backgroundColor = initializeZoomValue();
 
    styles.forEach(s => {
      backgroundColor.push(s.zoom);
      backgroundColor.push(getColor(s.style.fill.color));
    })
  }

  return {
    id,
    paint: {
      'background-color': backgroundColor
    }
  }
}

function generateFill(id, styles) {
  let fillColor;

  if (styles.length === 1) {

    // Literal
    const { style } = styles[0];
    fillColor = getColor(style.fill.color);
  } else {

    // Zoom expression
    fillColor = initializeZoomValue();
 
    styles.forEach(s => {
      fillColor.push(s.zoom);
      fillColor.push(getColor(s.style.fill.color));
    })
  }

  const paint = {
    'fill-color': fillColor
  };

  // TODO ignore this for now from any potential zoom styling.
  if (styles[0].style.stroke.type === 'solid') {
    paint['fill-outline-color'] = getColor(styles[0].style.stroke.color);
  }

  return { id, paint }
}

function generateLine(id, styles) {
  let lineColor;
  let lineWidth;

  if (styles.length === 1) {

    // Literal
    const { stroke } = styles[0].style;
    lineColor = getColor(stroke.color);
    lineWidth = stroke.width;
  } else {

    // Zoom expression
    lineColor = initializeZoomValue();
    lineWidth = initializeZoomValue();
      
    styles.forEach(s => {
      lineColor.push(s.zoom);
      lineColor.push(getColor(s.style.stroke.color));

      lineWidth.push(s.zoom);
      lineWidth.push(s.style.stroke.width);
    })
  }

  return {
    id,
    paint: {
      'line-color': lineColor,
      'line-width': lineWidth
    }
  }
}

function generateSymbol(id, styles) {
  let textColor;
  let textFont;
  let textSize;
  let textLineHeight;

  if (styles.length === 1) {

    // Literal
    const { style } = styles[0];
    textColor = getColor(style.fill.color);
    textFont = [`${style.font.family} ${style.font.style}`];
    textSize = style.font.size;
    textLineHeight = style.textAttributes.lineHeight;

  } else {

    // Zoom expression
    textColor = initializeZoomValue();
    textFont = {base: 1, stops: []};
    textSize = initializeZoomValue();
    textLineHeight = initializeZoomValue();

    styles.forEach(s => {
      textColor.push(s.zoom);
      textColor.push(getColor(s.style.fill.color));
      textFont.stops.push([s.zoom, [`${s.style.font.family} ${s.style.font.style}`]]);
      textSize.push(s.zoom);
      textSize.push(s.style.font.size);
      textLineHeight.push(s.zoom);
      textLineHeight.push(s.style.textAttributes.lineHeight);
    });
  }

  return {
    id,
    layout: {
      'text-font': textFont,
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

function artboardToStyleLayers(collection) {

  const layers = collection.artboard.children
    // Only grab layers we care about: (names containing "__")
    .filter(obj => {
      return obj.name.split(namePattern).length === 2;
    })
    // Combine numbered layer names for zoom styling
    .reduce((memo, obj) => {
      const name = obj.name.split(namePattern);
      const zoom = name[1];

      if (zoom === 'all') {
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

      // Determine if we have captured the layer in the memo already. If we
      // If we have, add the zoom styling to the existing entry. If we haven't,
      // create a new entry.
      const exists = memo.findIndex(d => d.name === name[0]);
      if (exists !== -1) {

        // TODO Find out what's different between the styles stored and this one.
        // Right now, this will create a zoom expression for all the styling
        // even if its the same across zoom levels.
        memo[exists].styles.push({
          zoom: parseInt(zoom, 10),
          style: obj.style
        })

        // Sort zoom stops in ascending order.
        memo[exists].styles = memo[exists].styles.sort((a, b) => (a.zoom > b.zoom));
      } else {
        memo.push({
          name: name[0],
          type: getType(obj),
          styles: [{
            zoom: parseInt(zoom, 10),
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

module.exports = { artboardToStyleLayers };
