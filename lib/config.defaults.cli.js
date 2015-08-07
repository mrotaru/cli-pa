var _path = require('path');

module.exports = {
  dbOptions: {
    filename: _path.resolve("./default.db")
  },
  dbType: "nedb",
  listsDir: require('os').tmpdir(),
  defaultValue: 10
};
