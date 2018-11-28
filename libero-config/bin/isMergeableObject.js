const Color = require('color');

module.exports = function isMergeableObject(value) {

  // isNonNullObject and isNonNullObject copied from private deepmerge functions

  function isNonNullObject(value) {
    return !!value && typeof value === 'object'
  }

  function isSpecial(value) {
    const stringValue = Object.prototype.toString.call(value);

    return stringValue === '[object RegExp]'
           || stringValue === '[object Date]';
  }

  return isNonNullObject(value) &&
         !isSpecial(value) &&
         !(value instanceof Color);
};
