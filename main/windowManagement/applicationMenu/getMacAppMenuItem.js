const appOptions = require("../../../appConfig.json");
const { app } = require("electron");

module.exports = launchAtStartupItem => {
  return {
    label: appOptions.name,
    submenu: [
      // {
      //   role: 'about'
      // },
      {
        type: "separator"
      },
      {
        label: "Services",
        role: "services",
        submenu: []
      },
      {
        type: "separator"
      },
      {
        label: "Hide App",
        accelerator: "Command+H",
        role: "hide"
      },
      {
        label: "Hide Others",
        accelerator: "Command+Shift+H",
        role: "hideothers"
      },
      {
        label: "Show All",
        role: "unhide"
      },
      {
        type: "separator"
      },
      launchAtStartupItem,
      {
        type: "separator"
      },
      {
        label: "Quit",
        accelerator: "Command+Q",
        click: () => {
          setTimeout(() => {
            app.quit();
          });
        }
      }
    ]
  };
};
