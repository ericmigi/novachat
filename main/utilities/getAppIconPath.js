const { isDev } = require("../../common/env");
const path = require("path");

module.exports = () =>
  path.join(
    __dirname,
    isDev ? "" : "../..",
    `icon.${process.platform === "win32" ? "ico" : "png"}`
  );
