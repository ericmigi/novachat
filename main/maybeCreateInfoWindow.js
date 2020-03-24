const appOptions = require("../appConfig.json");
const { log } = require("../common/logger");
const https = require("https");
const { BrowserWindow } = require("electron");

module.exports = function maybeCreateInfoWindow(appId) {
  if (appOptions.shouldOnlySendAbsolutelyNecessaryRequests) {
    return;
  }

  // If URL returns a 200 then show window with {nodeIntegration: true}
  const tdHost = appOptions.customDomain
    ? appOptions.customDomain
    : "us-central1-todesktop-prod1.cloudfunctions.net";
  const tdUrl = `https://${tdHost}/infoWindowCheck?appId=${appId}`;
  https.get(tdUrl, res => {
    const redirectTo = res.headers["redirect-to"];
    if (res.statusCode === 200 && redirectTo) {
      const windowOptions = res.headers["window-options"]
        ? JSON.parse(res.headers["window-options"])
        : {};
      const toDesktopWindow = new BrowserWindow({
        alwaysOnTop: true,
        webPreferences: {
          nodeIntegration: true
        },
        ...windowOptions
      });
      toDesktopWindow.loadURL(redirectTo);
      log("main", "App showed info window", {
        redirectTo,
        requestUrl: tdUrl,
        windowOptions
      });
    }
  });
};
