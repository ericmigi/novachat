const appOptions = require("../../appConfig.json");
const { log } = require("../../common/logger");
const { BrowserWindow } = require("electron");

module.exports = menubar => {
  if (appOptions.appType === "menubar") {
    menubar.showWindow();
  }
  /* 
    Handle when a window is minimized. At least on Mac though, the menubar library destroys 
    minimized windows. But let's be safe.
  */
  BrowserWindow.getAllWindows()
    .filter(({ isDestroyed }) => !isDestroyed())
    .forEach(({ isMinimized, isVisible, restore, show }) => {
      if (!isVisible) {
        show();
        return;
      }
      if (isMinimized) {
        restore();
        return;
      }
    });
};
