const appOptions = require("../../appConfig.json");
const { log } = require("../../common/logger");
const areNativeTabsSupported = require("../utilities/areNativeTabsSupported");
const initContextMenu = require("../initContextMenu");
const shouldUseNativeTabsWhenPossible = require("../utilities/shouldUseNativeTabsWhenPossible");
const setDockBadge = require("../utilities/setDockBadge");

module.exports = function({
  isMainWindow,
  isMenubarWindow,
  newWindow,
  windowManagement
}) {
  windowManagement.equipNewWebContents({
    isMainWindow,
    isMenubarWindow,
    windowManagement,
    webContents: newWindow.webContents
  });

  if (shouldUseNativeTabsWhenPossible() && areNativeTabsSupported()) {
    newWindow.on("new-tab", () =>
      windowManagement.createNewTab({
        isForeground: true,
        newUrl: appOptions.targetUrl,
        windowManagement
      })
    );
  }

  if (appOptions.appType !== "menubar") {
    const maybeHideWindow = (window, event) => {
      if (process.platform === "darwin") {
        // this is called when exiting from clicking the cross button on the window
        event.preventDefault();
        window.hide();
      }
      // will close the window on other platforms
    };
    newWindow.on("close", event => {
      if (newWindow.isFullScreen()) {
        if (areNativeTabsSupported() && shouldUseNativeTabsWhenPossible()) {
          newWindow.moveTabToNewWindow();
        }
        newWindow.setFullScreen(false);
        newWindow.once("leave-full-screen", () =>
          maybeHideWindow(newWindow, event)
        );
      }
      maybeHideWindow(newWindow, event);
    });

    newWindow.on("focus", () => setDockBadge(""));
  }

  initContextMenu({ window: newWindow, windowManagement });
};
