const appOptions = require("../../../appConfig.json");
const areNativeTabsSupported = require("../../utilities/areNativeTabsSupported");
const { log } = require("../../../common/logger");
const shouldUseNativeTabsWhenPossible = require("../../utilities/shouldUseNativeTabsWhenPossible");
const transformMenuItemLabel = require("./transformMenuItemLabel");

module.exports = windowManagement => {
  const submenu = [];

  if (shouldUseNativeTabsWhenPossible() && areNativeTabsSupported()) {
    submenu.push({
      label: "New Tab",
      accelerator: "CommandOrControl+T",
      click: () => {
        log(
          "main",
          "New tab application menu item clicked or keyboard shortcut used"
        );
        windowManagement.createNewTab({
          isForeground: true,
          newUrl: appOptions.targetUrl,
          windowManagement
        });
      }
    });
  }

  submenu.push({
    label: "New Window",
    accelerator: "CommandOrControl+N",
    click: () => {
      log(
        "main",
        "New window application menu item clicked or keyboard shortcut used"
      );
      windowManagement.createNewWindow({
        isForeground: true,
        newUrl: appOptions.targetUrl,
        windowManagement
      });
    }
  });
  return {
    label: transformMenuItemLabel("File"),
    submenu
  };
};
