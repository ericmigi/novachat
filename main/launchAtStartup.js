const appOptions = require("../appConfig.json");
const { log } = require("../common/logger");
const { isDev } = require("../common/env");
const { isFirstLaunch } = require("./stateManagement/launchState");
const AutoLaunch = require("auto-launch");
const { app } = require("electron");

// We'll use node-auto-launch for Linux, because Electron doesn't support it
const isLinux = !["darwin", "win32"].includes(process.platform);
let linuxAutoLauncher;
const subscriptions = [];

const get = () => {
  if (isLinux) {
    return linuxAutoLauncher.isEnabled();
  } else {
    return Promise.resolve(app.getLoginItemSettings().openAtLogin);
  }
};

const set = (shouldLaunchAtStartup, userSource) => {
  if (isDev) {
    log("main", "Ignoring launchAtStartup.set() call in dev");
    return;
  }

  if (isLinux) {
    if (shouldLaunchAtStartup) {
      linuxAutoLauncher.enable();
    } else {
      linuxAutoLauncher.disable();
    }
  } else {
    app.setLoginItemSettings({
      openAtLogin: shouldLaunchAtStartup
    });
  }

  subscriptions.forEach(subscription => subscription(shouldLaunchAtStartup));

  if (userSource) {
    log("main", "App launch at startup setting updated", {
      willLaunchAtStartup: shouldLaunchAtStartup,
      source: userSource
    });
  }
};

/*
  We set the launch on startup default value on first launch only.
  We offer an API to toggle it, as well as actions in the menubar
  and tray menu.
  We do check the current setting on launch for debug purposes.
 */
const init = () => {
  if (isDev) {
    return;
  }

  if (isLinux) {
    linuxAutoLauncher = new AutoLaunch({
      name: appOptions.name
    });
  }

  if (!isFirstLaunch()) {
    // Don't set it
    return;
  }

  // First launch; set the default
  if (appOptions.shouldLaunchAtStartupByDefault) {
    log("main", "Enabling launch at startup (first launch)");
    set(appOptions.shouldLaunchAtStartupByDefault);
  }
  // Otherwise, do nothing. Don't bother checking that it's disabled
};

const subscribe = callback => subscriptions.push(callback);

module.exports = { init, get, set, subscribe };
