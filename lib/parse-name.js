'use strict';

function parseName(name) {
  const parts = name.split(/__/);
  return {
    id: parts[0],
    zoom: parts[1] === 'all' ? 'all' : parseFloat(parts[1])
  }
}

module.exports = { parseName };
