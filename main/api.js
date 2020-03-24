const appOptions = require("../appConfig.json");
const { log } = require("../common/logger");
const areNativeTabsSupported = require("./utilities/areNativeTabsSupported");
const launchAtStartup = require("./launchAtStartup");
const windowManagement = require("./windowManagement");
const shouldUseNativeTabsWhenPossible = require("./utilities/shouldUseNativeTabsWhenPossible");
const { ipcMain } = require("electron");

const getCurrentWebContents = event => event.sender.webContents;

module.exports = () => {
  ipcMain.handle("can-go-back", event =>
    getCurrentWebContents(event).canGoBack()
  );
  ipcMain.handle("can-go-forward", event =>
    getCurrentWebContents(event).canGoForward()
  );
  ipcMain.handle(
    "are-tabs-supported",
    event => areNativeTabsSupported() && shouldUseNativeTabsWhenPossible()
  );
  ipcMain.handle("create-new-tab", event =>
    windowManagement.createNewTab({
      isForeground: true,
      newUrl: appOptions.targetUrl,
      windowManagement
    })
  );
  ipcMain.handle("go-back", event => getCurrentWebContents(event).goBack());
  ipcMain.handle("go-forward", event =>
    getCurrentWebContents(event).goForward()
  );

  ipcMain.handle("get-launch-settings", async event => {
    return {
      willLaunchAtStartup: await launchAtStartup.get()
    };
  });

  ipcMain.on("set-launch-settings", (event, { willLaunchAtStartup }) =>
    launchAtStartup.set(willLaunchAtStartup, "API")
  );

  ipcMain.handle("create-new-window", event =>
    windowManagement.createNewWindow({
      newUrl: appOptions.targetUrl,
      windowManagement
    })
  );
};
