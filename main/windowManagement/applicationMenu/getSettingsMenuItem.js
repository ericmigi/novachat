const transformMenuItemLabel = require("./transformMenuItemLabel");

module.exports = launchAtStartupItem => {
  return {
    label: transformMenuItemLabel("Settings"),
    submenu: [launchAtStartupItem]
  };
};
