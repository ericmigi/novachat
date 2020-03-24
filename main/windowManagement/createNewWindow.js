const appOptions = require("../../appConfig.json");
const { BrowserWindow } = require("electron");
const windowStateKeeper = require("electron-window-state");

module.exports = ({
  isMainWindow,
  newUrl,
  shouldRememberWindowState,
  windowManagement
}) => {
  const windowOptions = windowManagement.getWindowOptions({ isMainWindow });

  let windowState;
  if (shouldRememberWindowState) {
    windowState = windowStateKeeper({
      defaultWidth: appOptions.width || windowOptions.width,
      defaultHeight: appOptions.height || windowOptions.height
    });

    windowOptions.x = windowState.x;
    windowOptions.y = windowState.y;

    if (!appOptions.fullScreen) {
      windowOptions.width = windowState.width;
      windowOptions.height = windowState.height;
    }
  }

  const newWindow = new BrowserWindow(windowOptions);

  if (shouldRememberWindowState) {
    windowState.manage(newWindow);
  }

  newWindow.once("show", () => {
    newWindow.focus();
    windowManagement.equipNewWindow({
      isMainWindow,
      newWindow,
      windowManagement
    });
  });

  newWindow.loadURL(newUrl);
  newWindow.once("ready-to-show", () => {
    newWindow.show();
  });

  return newWindow;
};
