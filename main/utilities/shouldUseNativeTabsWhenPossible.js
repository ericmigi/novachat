const appOptions = require("../../appConfig.json");

module.exports = () =>
  appOptions.appType !== "menubar" &&
  // Don't use tabs when the title bar is hidden
  !["hidden", "hiddenInset", "customButtonsOnHover"].includes(
    appOptions.titleBarStyle
  );
