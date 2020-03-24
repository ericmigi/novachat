const appOptions = require("../../../appConfig.json");
const transformMenuItemLabel = require("./transformMenuItemLabel");

module.exports = () => {
  const submenu = [
    {
      label: "Reload",
      accelerator: "CmdOrCtrl+R",
      click: (item, focusedWindow) => {
        if (focusedWindow) {
          focusedWindow.reload();
        }
      }
    },
    {
      type: "separator"
    },
    {
      label: "Toggle Full Screen",
      accelerator: (() => {
        if (process.platform === "darwin") {
          return "Ctrl+Command+F";
        }
        return "F11";
      })(),
      click: (item, focusedWindow) => {
        if (focusedWindow) {
          focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
        }
      }
    },
    {
      label: "Zoom In",
      accelerator: "CommandOrControl+=",
      role: "zoomin"
    },
    {
      label: "Zoom Out",
      accelerator: "CommandOrControl+-",
      role: "zoomout"
    },
    {
      label: "Reset Zoom",
      accelerator: "CommandOrControl+0",
      role: "resetzoom"
    }
  ];

  if (!appOptions.disableDevTools) {
    // remove last item (dev tools) from menu > view
    submenu.push({
      label: "Toggle Developer Tools",
      accelerator: (() => {
        if (process.platform === "darwin") {
          return "Alt+Command+I";
        }
        return "Ctrl+Shift+I";
      })(),
      click: (item, focusedWindow) => {
        if (focusedWindow) {
          focusedWindow.toggleDevTools();
        }
      }
    });
  }

  return {
    label: transformMenuItemLabel("View"),
    submenu
  };
};
