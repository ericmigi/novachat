const areNativeTabsSupported = require("./utilities/areNativeTabsSupported");
const shouldUseNativeTabsWhenPossible = require("./utilities/shouldUseNativeTabsWhenPossible");

const { shell } = require("electron");
const contextMenu = require("electron-context-menu");

module.exports = ({ window, windowManagement }) => {
  contextMenu({
    window,
    prepend: (defaultActions, params) => {
      const items = [];
      if (params.linkURL) {
        items.push({
          label: "Open Link in Default Browser",
          click: () => {
            shell.openExternal(params.linkURL);
          }
        });
        items.push({
          label: "Open Link in New Window",
          click: e =>
            windowManagement.createNewWindow({
              newUrl: params.linkURL,
              windowManagement
            })
        });
        if (shouldUseNativeTabsWhenPossible() && areNativeTabsSupported()) {
          items.push({
            label: "Open Link in New Tab",
            click: e =>
              windowManagement.createNewTab({
                newUrl: params.linkURL,
                windowManagement
              })
          });
        }
      }
      return items;
    }
  });
};
