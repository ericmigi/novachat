const areNativeTabsSupported = require("../../utilities/areNativeTabsSupported");
const getEditMenuItem = require("./getEditMenuItem");
const getFileMenuItem = require("./getFileMenuItem");
const getMacAppMenuItem = require("./getMacAppMenuItem");
const getSettingsMenuItem = require("./getSettingsMenuItem");
const getTabMenuItem = require("./getTabMenuItem");
const getViewMenuItem = require("./getViewMenuItem");
const getWindowMenuItem = require("./getWindowMenuItem");
const {
  get: getLaunchAtStartupSetting,
  set: setLaunchAtLoginSetting,
  subscribe: subscribeToLaunchAtStartupChanges
} = require("../../launchAtStartup");
const shouldUseNativeTabsWhenPossible = require("../../utilities/shouldUseNativeTabsWhenPossible");
const { Menu } = require("electron");

module.exports = async function(windowManagement) {
  let menu;

  const launchAtStartupItem = {
    id: "launch-at-startup",
    label: `Launch at startup`,
    type: "checkbox",
    checked: await getLaunchAtStartupSetting(),
    click: function() {
      setLaunchAtLoginSetting(
        menu.getMenuItemById("launch-at-startup").checked,
        "application menu"
      );
    }
  };

  const template = [];

  if (process.platform === "darwin") {
    template.push(getMacAppMenuItem(launchAtStartupItem));
  }

  template.push(
    getFileMenuItem(windowManagement),
    getEditMenuItem(),
    getViewMenuItem()
  );

  if (
    // The menu item roles used so far are only supported on Mac
    process.platform === "darwin" &&
    areNativeTabsSupported() &&
    shouldUseNativeTabsWhenPossible()
  ) {
    template.push(getTabMenuItem());
  }

  template.push(getWindowMenuItem());

  if (process.platform !== "darwin") {
    template.push(getSettingsMenuItem(launchAtStartupItem));
  }

  menu = Menu.buildFromTemplate(template);

  subscribeToLaunchAtStartupChanges(
    willLaunchAtStartup =>
      (menu.getMenuItemById("launch-at-startup").checked = willLaunchAtStartup)
  );
  Menu.setApplicationMenu(menu);
};
