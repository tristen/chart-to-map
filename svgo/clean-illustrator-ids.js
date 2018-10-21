'use strict';

exports.type = 'perItem';
exports.active = true;
exports.description = 'Removes erroneous characters from Illustrator ID names';
exports.fn = item => {
  if (item.hasAttr('id')) {
    item.addAttr({
      name: 'id',
      value: item.attr('id').value.replace(/x5F_/g, ''),
      prefix: '',
      local: 'id'
    });
  }
};
