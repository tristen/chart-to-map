const Color = require('color');
const { parseName } = require('./parse-name');

function mapElementToStyleLayer(element, layer) {
  const { zoom, type } = parseName(element);

  if (type === 'symbol') {
    // Properties to update:

    // FONT STYLE
    let font = layer.layout['text-font'];

    if (typeof font.length > 1) {
      if (font.indexOf(zoom) > -1) {
        font = font[font.indexOf(zoom) + 1][1][0];
      } else {
        font = font[2][1][0];
      }
    } else {
      font = font[0];
    }

    element.style.font.family = font.split(' ').slice(0, -1).join(' ');
    element.style.font.style = font.split(' ').pop();

    // TEXT SIZE
    let textSize = layer.layout['text-size']
    if (typeof textSize === 'object') {
      textSize = textSize[textSize.indexOf(zoom) + 1];
    }
    element.style.font.size = textSize;

    // LINE HEIGHT
    let lineHeight = layer.layout['text-line-height'];
    if (typeof lineHeight === 'object') {
      lineHeight = lineHeight[lineHeight.indexOf(zoom) + 1];
    }
    element.style.textAttributes.lineHeight = lineHeight;

    // TEXT COLOR
    let textColor = layer.paint['text-color'];
    if (typeof textColor === 'object') {
      textColor = textColor[textColor.indexOf(zoom) + 1];
    }
    textColor = Color(textColor);
    element.style.fill.color = {
      mode: textColor.model.toUpperCase(),
      value: textColor.object()
    };
  }

  if (type === 'fill') {

    // FILL COLOR
    let fillColor = layer.paint['fill-color'];
    if (typeof fillColor === 'object') {
      fillColor = fillColor[fillColor.indexOf(zoom) + 1];
    }
    fillColor = Color(fillColor);

    element.style.fill.color = {
      mode: fillColor.model.toUpperCase(),
      value: fillColor.object()
    };

    // FILL OUTLINE COLOR
    let fillOutlineColor = layer.paint['fill-outline-color'];
    if (typeof fillOutlineColor === 'object') {
      fillOutlineColor = fillOutlineColor[fillOutlineColor.indexOf(zoom) + 1];
    }
    fillOutlineColor = Color(fillOutlineColor);

    element.style.stroke.color = {
      mode: fillColor.model.toUpperCase(),
      value: fillColor.object()
    };
  }

  if (type === 'line') {

    // LINE COLOR
    let lineColor = layer.paint['line-color'];
    if (typeof lineColor === 'object') {
      lineColor = lineColor[lineColor.indexOf(zoom) + 1];
    }
    lineColor = Color(lineColor);

    element.style.stroke.color = {
      mode: lineColor.model.toUpperCase(),
      value: lineColor.object()
    };

    // LINE WIDTH
    let lineWidth = layer.paint['line-width'];
    if (typeof lineWidth === 'object') {
      lineWidth = lineWidth[lineWidth.indexOf(zoom) + 1];
    }

    element.style.stroke.width = lineWidth;
  }

  if (type === 'background') {

    // BACKGROUND COLOR
    let backgroundColor = layer.paint['background-color'];
    if (typeof backgroundColor === 'object') {
      backgroundColor = backgroundColor[backgroundColor.indexOf(zoom) + 1];
    }
    backgroundColor = Color(backgroundColor);

    element.style.fill.color = {
      mode: backgroundColor.model.toUpperCase(),
      value: backgroundColor.object()
    };
  }

  return element;
}

module.exports = { mapElementToStyleLayer };
