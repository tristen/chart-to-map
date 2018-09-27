'use strict';

function parseName(layer) {
  let type;
  let valid = true;

  const parts = layer.name.split(/__/);
  const name = parts[0];
  const zoom = parts[1] === 'all' ? 'all' : parseInt(parts[1], 10);

  // Name does not match our naming convention
  if (parts.length === 1) valid = false;

  if (name === 'background') {
    type = 'background';
  } else if (layer.type === 'text') {
    type = 'symbol';
  } else if (layer.style.fill) {
    type = 'fill';
  } else {
    type = 'line';
  }

  return { name, type, zoom, valid }
}

module.exports = { parseName };
