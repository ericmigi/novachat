const areNativeTabsSupported = require("../utilities/areNativeTabsSupported");
const appOptions = require("../../appConfig.json");
const isLinkInternal = require("../utilities/isLinkInternal");
const { log } = require("../../common/logger");
const shouldUseNativeTabsWhenPossible = require("../utilities/shouldUseNativeTabsWhenPossible");
const { shell } = require("electron");

module.exports = function({
  isMainWindow = false,
  isMenubarWindow = false,
  webContents,
  windowManagement
}) {
  webContents.on("will-navigate", (event, newUrl) => {
    const isInternal = isLinkInternal(
      appOptions.targetUrl,
      newUrl,
      appOptions.internalUrls
    );
    if (!isInternal) {
      shell.openExternal(newUrl);
      event.preventDefault();
    }
    log("main", "App attempted to navigate", {
      isLinkInternal: isInternal,
      isMainWindow,
      newUrl: newUrl
    });
  });

  webContents.on(
    "new-window",
    (event, newUrl, frameName, disposition, options) => {
      // Security measure to prevent anyone from creating a new webContents with Node enabled
      options.webPreferences = windowManagement.getWindowOptions().webPreferences;

      /*
        The native browser window.open defaults to about:blank if an empty string
        is given as the url parameter. Electron defaults to about:blank#blocked
        in some cases (e.g. the origins don't match, etc.). In these cases,
        we allow the default behaviour to happen. This, along with using the
        nativeWindowOpen BrowserWindow webPreference allows Firebase social login
        to work.
      */
      if (newUrl === "about:blank#blocked") {
        // By default it'll inherit the frame (false) option from the menubar window
        options.frame = true;
        return;
      }

      const preventDefault = newGuest => {
        event.preventDefault();
        if (newGuest) {
          // eslint-disable-next-line no-param-reassign
          event.newGuest = newGuest;
        }
      };

      if (newUrl === "about:blank") {
        const newWindow = windowManagement.createAboutBlankWindow(
          windowManagement
        );
        preventDefault(newWindow);
      } else if (
        isLinkInternal(appOptions.targetUrl, newUrl, appOptions.internalUrls)
      ) {
        if (
          shouldUseNativeTabsWhenPossible() &&
          areNativeTabsSupported() &&
          // To be safe:
          ["background-tab", "foreground-tab"].includes(disposition)
        ) {
          const isForeground = disposition === "foreground-tab";
          const newTab = windowManagement.createNewTab({
            newUrl,
            isForeground,
            windowManagement
          });
          preventDefault(newTab);

          log("main", "App opened new tab", {
            isForeground,
            newUrl
          });
        } else {
          // open a new window
          const newWindow = windowManagement.createNewWindow({
            windowManagement,
            newUrl
          });

          preventDefault(newWindow);

          log("main", "App opened new window", {
            newUrl
          });
        }
      } else {
        preventDefault();
        // open in default browser
        shell.openExternal(newUrl);

        log("main", "App opened external URL in browser", {
          newUrl
        });
      }
    }
  );

  webContents.on("did-navigate", (event, newUrl) => {
    log("main", `did-navigate (${newUrl})`);
    webContents.send("api-event", {
      event: "did-navigate",
      args: [
        {
          newUrl,
          wasInPageNavigation: false
        }
      ]
    });
  });

  webContents.on("did-navigate-in-page", (event, newUrl, isMainFrame) => {
    if (!isMainFrame) {
      return;
    }

    log("main", `did-navigate-in-page (${newUrl})`);
    webContents.send("api-event", {
      event: "did-navigate",
      args: [
        {
          newUrl,
          wasInPageNavigation: true
        }
      ]
    });
  });
};
