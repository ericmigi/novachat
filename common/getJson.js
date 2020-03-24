const fs = require("fs");
const path = require("path");

module.exports = filePath =>
  JSON.parse(fs.readFileSync(path.join(__dirname, "..", filePath)));
