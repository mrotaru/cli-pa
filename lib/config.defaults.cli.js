var _path = require('path');

module.exports = {
  dbOptions: {
    filename: _path.resolve("./default.db")
  },
  dbType: "nedb",
  defaultValue: 10
};
