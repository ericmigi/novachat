const appOptions = require("../../appConfig.json");
const { BrowserWindow } = require("electron");

module.exports = menubar => {
  if (appOptions.appType === "menubar") {
    menubar.hideWindow();
  }
  windows = BrowserWindow.getAllWindows()
    .filter(({ isDestroyed }) => !isDestroyed())
    .forEach(({ hide, isVisible }) => {
      if (isVisible) {
        hide();
      }
    });
};
