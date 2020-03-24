const createTrayMenu = require("./createTrayMenu");
const { log } = require("../common/logger");
const { reportError } = require("../common/errorReporting");

module.exports = async ({ onClickShow, onClickHide, tray }) => {
  let hasTrayMenuFailed = false;
  let trayMenu;

  try {
    trayMenu = await createTrayMenu({
      onClickShow: () => {
        onClickShow();
        log("main", "main", "App tray show action clicked");
      },
      onClickHide: () => {
        onClickHide();
        log("main", "App tray hide action clicked");
      }
    });
  } catch (e) {
    hasTrayMenuFailed = true;
    reportError("main", e);
  }

  tray.on("click", () => log("main", "App tray icon clicked"));

  /*
    We can"t pass the tray menu when initializing menubar as the docs say. 
    On Mac at least, if you have a context menu, single clicking will show
    the menu, not show your window and there doesn"t seem to be a way around 
    it. Instead, on right click of the tray icon, we call trigger the menu
    to be added and shown
   */
  tray.on("right-click", () => {
    log("main", "App tray icon right-clicked");
    if (hasTrayMenuFailed) {
      return;
    }
    tray.popUpContextMenu(trayMenu);
  });

  if (process.platform === "darwin") {
    tray.setIgnoreDoubleClickEvents(true);
  }
};
