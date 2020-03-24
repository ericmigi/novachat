const appOptions = require("../appConfig.json");
const appState = require("./stateManagement/appState");
const { isDev } = require("../common/env");
const hideAllWindows = require("./windowManagement/hideAllWindows");
const { log } = require("../common/logger");
const showAllWindows = require("./windowManagement/showAllWindows");
const { app, globalShortcut } = require("electron");

const bindConditionalShortcuts = function({
  callback,
  shortcuts,
  appStateConditions = []
}) {
  const bind = () => {
    globalShortcut.registerAll(shortcuts, callback);
  };
  const unbind = () => {
    shortcuts.forEach(shortcut => globalShortcut.unregister(shortcut));
  };

  appStateConditions.forEach(({ event, desiredValue }) => {
    // See if the conditions are met right now
    if (appState.get(event) === desiredValue) {
      bind();
    }

    // Adjust when the conditions change
    appState.subscribe(event, value => {
      if (value === desiredValue) {
        bind();
        return;
      }

      unbind();
    });
  });
};

module.exports = function(win, menubar) {
  // Always allow in dev. If production, check their settting
  if (isDev || !appOptions.disableDevTools) {
    bindConditionalShortcuts({
      callback: () => {
        win.toggleDevTools();
        log("main", "App DevTools toggled", {
          source: "keyboard shortcut"
        });
      },
      shortcuts: [
        process.platform === "darwin" ? "Alt+Command+I" : "Ctrl+Shift+I"
      ],
      // Only bind when the window is visible and focused
      appStateConditions: [
        { event: "focus", desiredValue: true },
        { event: "visibility", desiredValue: true }
      ]
    });
  }

  if (appOptions.toggleVisibilityKeyboardShortcut) {
    // This has no conditions / is global
    globalShortcut.register(appOptions.toggleVisibilityKeyboardShortcut, () => {
      if (appState.get("visibility")) {
        hideAllWindows(menubar);
        // Put focus back on what was previously focused
        if (process.platform === "darwin") {
          app.hide();
        }
        log("main", "App visibility toggled via keyboard shortcut", {
          wasVisible: true
        });
        return;
      }
      showAllWindows(menubar);
      log("main", "App visibility toggled via keyboard shortcut", {
        wasVisible: false
      });
    });
  }
};
