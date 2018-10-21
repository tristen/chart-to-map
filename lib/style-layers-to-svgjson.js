const { parseName } = require('./parse-name');

function getValue(property, value, zoom) {
  if (property === 'text-font') {
    if (value.length > 1) {
      return value[value.indexOf(zoom) + 1][1];
    } else {
      return value[0];
    }
  } else {
    if (typeof value === 'object') {
      return value[value.indexOf(zoom) + 1];
    } else {
      return value;
    }
  }
}

function styleLayersToSvgjson(styleLayer, attributes) {
  const { zoom } = parseName(attributes.id);

  const {
    fill,
    'font-family': fontFamily,
    'font-size': fontSize,
    stroke,
    'stroke-width': strokeWidth
  } = attributes;

  let nextFill, nextFontFamily, nextFontSize, nextStroke, nextStrokeWidth;

  switch (styleLayer.type) {
    case 'background':
      nextFill = styleLayer.paint['background-color'];
      if (fill && nextFill) {
        attributes.fill = getValue('background-color', nextFill, zoom);
      }
      break;
    case 'fill':
      nextFill = styleLayer.paint['fill-color'];
      nextStroke = styleLayer.paint['fill-outline-color'];
      if (fill && nextFill) {
        attributes.fill = getValue('fill-color', nextFill, zoom);
      }
      if (stroke && nextStroke) {
        attributes.stroke = getValue('fill-outline-stroke', nextStroke, zoom);
      }
      break;
    case 'line':
      nextFill = styleLayer.paint['line-color'];
      nextStroke = styleLayer.paint['line-color'];
      nextStrokeWidth = styleLayer.paint['line-width'];
      if (fill && nextFill) {
        attributes.fill = getValue('line-color', nextFill, zoom);
      }
      if (stroke && nextStroke) {
        attributes.stroke = getValue('line-color', nextStroke, zoom);
      }
      if (strokeWidth && nextStrokeWidth) {
        attributes['stroke-width'] = getValue('line-width', `${nextStrokeWidth}px`, zoom);
      }
      break;
    case 'symbol':
      nextFill = styleLayer.paint['text-color'];
      nextFontFamily = styleLayer.layout['text-font'];
      nextFontSize = styleLayer.layout['text-size'];
      if (fill && nextFill) {
        attributes.fill = getValue('text-color', nextFill, zoom);
      }
      if (fontFamily && nextFontFamily) {
        attributes['font-family'] = getValue('text-font', nextFontFamily, zoom);
      }
      if (fontSize && nextFontSize) {
        attributes['font-size'] = getValue('text-size', nextFontSize, zoom);
      }
      break;
  }

  return attributes;
}

module.exports = { styleLayersToSvgjson };
