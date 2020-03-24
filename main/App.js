const appOptions = require("../appConfig.json");
const appState = require("./stateManagement/appState");
const bindShortcuts = require("./bindShortcuts");
const { isDev } = require("../common/env");
const { reportError } = require("../common/errorReporting");
const initApi = require("./api");
const initAutoUpdater = require("./initAutoUpdater");
const initCrashReporter = require("./initCrashReporter");
const {
  getUrlThatLaunchedApp,
  init: initDeepLinking,
  onWindowReady: onWindowReadyForDeeplinking
} = require("./deepLinking");
const initDownloadHandler = require("./initDownloadHandler");
const { init: initLaunchState } = require("./stateManagement/launchState");
const { init: initLaunchAtStartup } = require("./launchAtStartup");
const {
  log,
  setMainWindow: setMainWindowForLogger
} = require("../common/logger");
const maybeCreateInfoWindow = require("./maybeCreateInfoWindow");
const setDockBadge = require("./utilities/setDockBadge");
const shouldUseNativeTabsWhenPossible = require("./utilities/shouldUseNativeTabsWhenPossible");
const store = require("./stateManagement/store");
const windowManagement = require("./windowManagement");
const { app, ipcMain } = require("electron");
const todesktop = require("@todesktop/runtime");

todesktop.init();

module.exports = class App {
  /*
    Important properties:
    - mainWindow
    - menubar
    - url
   */

  get url() {
    return getUrlThatLaunchedApp() || appOptions.targetUrl;
  }

  afterCreateMainWindow(window) {
    this.mainWindow = window;
    onWindowReadyForDeeplinking(this.mainWindow, this.menubar);
    setMainWindowForLogger(this.mainWindow);

    // Not visible for Mac menubar apps but the keyboard shortcuts are still usable
    windowManagement.createApplicationMenu(windowManagement);
  }

  createMainWindow() {
    const window = windowManagement.createNewWindow(
      this.getMainWindowOptions()
    );

    window.once("show", () => this.onMainWindowFirstShown(window));
    this.afterCreateMainWindow(window);
    this.onAppTrulyReady();
  }

  getMainWindowOptions() {
    return {
      isMainWindow: true,
      newUrl: this.url,
      shouldRememberWindowState: appOptions.isResizable,
      // This object is passed around to avoid cyclical dependencies
      windowManagement
    };
  }

  init() {
    initLaunchState();
    initDeepLinking(); // Needs to be as early as possible

    if (process.platform === "win32" && !isDev) {
      app.setAppUserModelId(appOptions.appId);
    }

    // Set the user agent for all windows, webContents, etc.
    app.userAgentFallback =
      appOptions.userAgent ||
      /*
      Some sites don't like Electron (especially "sign in with Google"
      https://support.google.com/accounts/thread/22873505)
    */
      app.userAgentFallback.replace(
        "Electron/" + process.versions.electron,
        ""
      );

    app.on("will-finish-launching", () => {
      initAutoUpdater();
      initCrashReporter();
      initDownloadHandler();
    });

    app.on("ready", async () => {
      log("main", "Electron ready");
      initLaunchAtStartup();

      // Stuff that needs to be ready before the URL is loaded
      initApi();
      ipcMain.handle("log-from-preload", (event, message) =>
        console.log(message)
      );

      this.createMainWindow();

      // If this isn't purely a menubar app, set up typical desktop app behaviour
      if (appOptions.appType !== "menubar") {
        if (process.platform === "darwin") {
          app.on("activate", (event, hasVisibleWindows) => {
            // this is called when the dock is clicked
            if (!hasVisibleWindows) {
              windowManagement.createNewWindow(this.getMainWindowOptions());
            }
          });

          app.on("before-quit", () => {
            // need to force a quit as a workaround here to simulate the osx app hiding behaviour
            // Somehow sokution at https://github.com/atom/electron/issues/444#issuecomment-76492576 does not work,
            // e.prevent default appears to persist

            // might cause issues in the future as before-quit and will-quit events are not called
            app.exit(0);
          });
        } else {
          app.on("window-all-closed", () => {
            setTimeout(() => {
              app.quit();
            });
          });
        }

        ipcMain.on("notification", () => {
          if (process.platform !== "darwin" || this.mainWindow.isFocused()) {
            return;
          }
          setDockBadge("•");
        });
      }

      if (shouldUseNativeTabsWhenPossible()) {
        app.on("new-window-for-tab", event => {
          if (!!this.mainWindow) {
            this.mainWindow.emit("new-tab");
          }
        });
      }

      try {
        maybeCreateInfoWindow(appOptions.appId);
      } catch (err) {
        reportError("main", err);
      }

      // Security measure: prevent the creation of webviews
      app.on("web-contents-created", (e, contents) =>
        contents.on("will-attach-webview", event => event.preventDefault())
      );

      // Block most remote usage
      app.on("remote-require", event => event.preventDefault());
      app.on("remote-get-builtin", (event, webContents, moduleName) => {
        if (!["app"].includes(moduleName)) {
          event.preventDefault();
        }
      });
      app.on("remote-get-global", event => event.preventDefault());
    });
  }

  onAppTrulyReady() {
    log("main", "App ready");
  }

  onMainWindowFirstShown() {
    log("main", "Main window shown");

    appState.init();
    bindShortcuts(this.mainWindow, this.menubar);

    // Prevent white flash when navigating (multi-page apps)
    if (appOptions.shouldReuseRendererProcess) {
      app.allowRendererProcessReuse = true;
    }
  }

  onMenubarCreated(mb) {
    this.menubar = mb;
  }
};
