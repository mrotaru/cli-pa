module.exports.spliceFirst = function spliceFirst(array) {
  return array.splice(0,1)[0];
}

module.exports.errorHandler = function error(err) {
  console.log(err);
  console.log(err.stack);
}

// http://stackoverflow.com/a/1830844/447661
module.exports.isNumeric = function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
