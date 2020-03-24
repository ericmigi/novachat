const appOptions = require("../appConfig.json");
const {
  get: getLaunchAtStartupSetting,
  set: setLaunchAtLoginSetting,
  subscribe: subscribeToLaunchAtStartupChanges
} = require("./launchAtStartup");
const appState = require("./stateManagement/appState");
const { isDev } = require("../common/env");
const { log } = require("../common/logger");
const { Menu } = require("electron");

module.exports = async ({ onClickShow, onClickHide }) => {
  let trayMenu;
  const trayMenuItems = [
    {
      id: "show-window",
      label: `Show ${appOptions.name}`,
      click: onClickShow
    },
    {
      id: "hide-window",
      label: `Hide ${appOptions.name}`,
      enabled: false,
      click: onClickHide
    },
    {
      type: "separator"
    },
    {
      id: "launch-at-startup",
      label: `Launch at startup`,
      type: "checkbox",
      checked: await getLaunchAtStartupSetting(),
      click: function() {
        setLaunchAtLoginSetting(
          trayMenu.getMenuItemById("launch-at-startup").checked,
          "tray menu"
        );
      }
    },
    {
      type: "separator"
    }
  ];

  /*
    The DevTools option is there during dev even if the setting is disabled.
    It's completely hidden on Mac because this role doesn't work for some reason.
  */
  if (process.platform === "mac" && (!appOptions.disableDevTools || isDev)) {
    trayMenuItems.push({
      click: () =>
        log("main", "App DevTools toggled", {
          source: "Tray menu item"
        }),
      role: "toggleDevTools"
    });
  }
  trayMenuItems.push({
    click: () => log("main", "App quit via tray menu item"),
    role: "quit"
  });

  trayMenu = Menu.buildFromTemplate(trayMenuItems);

  appState.subscribe("visibility", isShown => {
    trayMenu.getMenuItemById("show-window").enabled = !isShown;
    trayMenu.getMenuItemById("hide-window").enabled = isShown;
  });

  subscribeToLaunchAtStartupChanges(
    willLaunchAtStartup =>
      (trayMenu.getMenuItemById(
        "launch-at-startup"
      ).checked = willLaunchAtStartup)
  );

  return trayMenu;
};
