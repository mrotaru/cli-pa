module.exports.errorHandler = function error(err) {
  console.log(err);
  console.log(err.stack);
}
