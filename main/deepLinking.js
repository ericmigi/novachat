const appOptions = require("../appConfig.json");
const cleanProtocol = require("./utilities/cleanProtocol");
const { log } = require("../common/logger");
const showAllWindows = require("./windowManagement/showAllWindows");
const { app } = require("electron");
const urlJoin = require("url-join");

let isWindowReady = false;
let mainWindow;
let menubar;
let urlThatLaunchedApp;

// This is used by the main file when telling the menubar library / window API what to load
const getUrlThatLaunchedApp = () => urlThatLaunchedApp;

// Windows has to handled differently to other platforms
const getWindowsDeeplink = argv => {
  if (process.platform === "win32") {
    const deeplink = argv.slice(-1)[0];
    if (
      deeplink &&
      deeplink.includes(appOptions.appProtocol) &&
      deeplink.length > 0
    ) {
      return cleanProtocol(deeplink);
    }
  }
};

// All deeplink flows end up triggering this
const onDeeplinkLoaded = (url, wasAppAlreadyRunning = "unknown") => {
  showAllWindows(menubar);
  mainWindow.focus();
  log("main", "App deeplink opened", {
    url,
    wasAppAlreadyRunning
  });
};

// Get a real URL in their app from a deeplink
const resolveDeeplink = url => urlJoin(appOptions.targetUrl, url);

/*
  In most cases (after the app is already launched), this is called
  to load the equivalent URL in their web app in the menubar / main window
*/
const loadDeeplink = (mainWindow, deeplink, wasAppAlreadyRunning) => {
  // In some cases, a resolved URL is passed
  const url = resolveDeeplink(deeplink);
  mainWindow.loadURL(url);
  onDeeplinkLoaded(url, wasAppAlreadyRunning);
};

/*
  This is called really early in the app lifecycle so
  the open-url event will be caught. Otherwise, launching
  via deeplink on Mac wouldn't work at all, for example
*/
const init = () => {
  if (!appOptions.appProtocol) {
    return;
  }

  // Register the example:// protocol
  const schema = appOptions.appProtocol.replace("://", "");
  if (!app.isDefaultProtocolClient(schema)) {
    app.setAsDefaultProtocolClient(schema);
  }

  // The docs say to wait for this before listening to open-url 🤷‍♂️
  app.on("will-finish-launching", () => {
    // This is used by Mac on initial launch and later
    app.on("open-url", (event, url) => {
      const deeplink = cleanProtocol(url);
      event.preventDefault();

      // Post-launch
      if (isWindowReady) {
        // TODO: mainWindow
        loadDeeplink(mainWindow, deeplink, true);
      } else {
        // Launched via deeplink
        // Store. Main file will request this when loading initial URL
        urlThatLaunchedApp = resolveDeeplink(deeplink);
      }
    });
  });

  /*
    On Windows, we can check here if the app was launched by deeplink.
    No need for the open-url event, etc.
  */
  const windowsDeeplink = getWindowsDeeplink(process.argv);
  if (windowsDeeplink) {
    urlThatLaunchedApp = resolveDeeplink(windowsDeeplink);
  }
};

// This is called a little later in the app lifecycle
const onWindowReady = (window, mb) => {
  if (!appOptions.appProtocol) {
    return;
  }

  isWindowReady = true;
  mainWindow = window;
  menubar = mb;

  /*
    When the app is launched via deeplink, this file captures and stores it,
    then the main file passes that to the menubar library / window API to 
    load it. Finally, once the window is created, we do some follow up bits 
    (e.g. show the window, etc.)
  */
  if (urlThatLaunchedApp) {
    onDeeplinkLoaded(urlThatLaunchedApp, false);
  }

  // Some post-launch deeplink handling
  if (process.platform === "darwin" || app.requestSingleInstanceLock()) {
    app.on("second-instance", (e, argv) => {
      // Someone tried to run a second instance, we should focus our window.
      const windowsDeeplink = getWindowsDeeplink(argv);
      if (windowsDeeplink) {
        loadDeeplink(window, windowsDeeplink, true);
      }
    });
  } else {
    app.quit();
  }
};

module.exports = {
  getUrlThatLaunchedApp,
  init,
  onWindowReady
};
