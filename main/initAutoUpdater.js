const appOptions = require("../appConfig.json");
const { log } = require("../common/logger");
const { reportError } = require("../common/errorReporting");
const store = require("./stateManagement/store");
const { autoUpdater } = require("electron-updater");

const getEventTraitsFromUpdateInfo = updateInfo => {
  if (!updateInfo) {
    return {};
  }
  return {
    newAppVersion: updateInfo.version,
    newAppVersionReleaseDate: updateInfo.releaseDate,
    newAppVersionReleaseName: updateInfo.releaseName
  };
};

module.exports = async () => {
  const currentAppVersion = appOptions.appVersion;

  autoUpdater.on("error", err => {
    log("main", "App auto-update failed", {
      currentAppVersion,
      ...getEventTraitsFromUpdateInfo(store.get("autoUpdateDownloaded"))
    });
    reportError("main", err);
  });

  autoUpdater.on("update-downloaded", updateInfo => {
    store.set("autoUpdateDownloaded", updateInfo);
    log("main", "App auto-update downloaded", {
      currentAppVersion,
      ...getEventTraitsFromUpdateInfo(updateInfo)
    });
  });

  const oldAppVersion = store.get("lastSeenAppVersion");
  if (oldAppVersion !== currentAppVersion) {
    // Always track the current app version
    store.set("lastSeenAppVersion", currentAppVersion);

    /*
      If (the version has changed) and there was an auto-update downloaded
      last time, then either they auto-updated or re-installed.
      If the auto-updated, track that event. If re-installed, we should
      be able to get that from our current analytics anyway (because we
      use the same anonymous ID for the machine)
    */
    const autoUpdateDownloaded = store.get("autoUpdateDownloaded");
    if (autoUpdateDownloaded) {
      if (currentAppVersion === autoUpdateDownloaded.version) {
        log("main", "App auto-update complete", {
          currentAppVersion,
          oldAppVersion
        });
      }
      // Clean up the store either way
      store.delete("autoUpdateDownloaded");
    }
  }

  autoUpdater.checkForUpdatesAndNotify();
};
