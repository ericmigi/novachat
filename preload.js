// Preload file that will be executed in the renderer process
const { reportError } = require("./common/errorReporting");
const { log } = require("./common/logger");
const appOptions = require("./appConfig.json");
const pkgJson = require("./package.json");
const { ipcRenderer, remote } = require("electron");
const fs = require("fs");
const os = require("os");
const path = require("path");

const INJECT_CSS_PATH = path.join(__dirname, "inject/inject.css");
const INJECT_JS_PATH = path.join(__dirname, "inject/inject.js");

// Cookies in preload scripts are broken so lets disable them
// https://github.com/electron/electron/issues/21256
const origCookieGetter = document.__lookupGetter__("cookie");
const origCookieSetter = document.__lookupSetter__("cookie");
// tslint:disable-next-line: no-empty
document.__defineGetter__("cookie", function() {});
// tslint:disable-next-line: no-empty
document.__defineSetter__("cookie", function() {});

// For some reason, Sentry doesn't auto-capture in this file so we use try-catch
try {
  const osPlatform = os.platform();
  const osArch = os.arch();
  const osRelease = os.release();
  const osType = os.type();

  /*
    This is for us to inject CSS in customers apps. Only done if a certain file
    exists on disk at build-time. We don't use Electron APIs for this because
    we need to make sure it happens before our custom JS is executed
  */
  function injectStyles() {
    if (
      document.getElementById("todesktop__customcss") ||
      !fs.existsSync(INJECT_CSS_PATH)
    ) {
      return;
    }
    const style = document.createElement("style");
    style.id = "todesktop__customcss";
    style.innerHTML = fs.readFileSync(INJECT_CSS_PATH);
    document.head.appendChild(style);
    log("preload", "App injected CSS");
  }

  // This is for us to inject JS in customers apps. Only done if a certain file exists on disk at build-time
  function injectScript() {
    if (
      document.getElementById("todesktop__customjs") ||
      !fs.existsSync(INJECT_JS_PATH)
    ) {
      return;
    }
    // Inject a <script> so it doesn't have access to Node, etc.
    const script = document.createElement("script");
    script.id = "todesktop__customjs";
    script.innerHTML = fs.readFileSync(INJECT_JS_PATH);
    script.setAttribute("defer", "defer");
    document.body.appendChild(script);
    log("preload", "App injected JavaScript");
  }

  /**
   * Patches window.Notification to set a callback on a new Notification
   * @param callback
   */
  function setNotificationCallback(callback) {
    const OldNotify = Notification;
    class NewNotification {
      constructor(title, opt) {
        callback(title, opt);
        return new OldNotify(title, opt);
      }
    }
    NewNotification.requestPermission = OldNotify.requestPermission.bind(
      OldNotify
    );
    Object.defineProperty(NewNotification, "permission", {
      get: () => OldNotify.permission
    });

    Notification = NewNotification;
  }

  setNotificationCallback((title, opt) => {
    ipcRenderer.send("notification", title, opt);
    log("preload", "App notification created", {
      title,
      opt
    });
  });

  document.addEventListener("DOMContentLoaded", () => {
    document.documentElement.classList.add(
      "todesktop",
      `todesktop-${appOptions.appType}`,
      `todesktop-platform-${osPlatform}`
    );
    injectStyles();
    // We need to make sure the JS is executed after the CSS is applied
    setTimeout(injectScript, 100);
  });

  const subscriptions = [];

  window.todesktop = {
    version: pkgJson.version,
    desktopifyVersion: pkgJson.desktopifyVersion,
    electronVersion: pkgJson.electronVersion,
    os: {
      platform: osPlatform,
      arch: osArch,
      release: osRelease,
      type: osType
    },
    contents: {
      canGoBack: () => {
        log("preload", "App canGoBack called");
        return ipcRenderer.invoke("can-go-back");
      },
      canGoForward: () => {
        log("preload", "App canGoForward called");
        return ipcRenderer.invoke("can-go-forward");
      },
      getPrinters: () => {
        log("preload", "App getPrinters called");
        return remote.getCurrentWebContents().getPrinters();
      },
      goBack: () => {
        log("preload", "App goBack called");
        return ipcRenderer.invoke("go-back");
      },
      goForward: () => {
        log("preload", "App goForward called");
        return ipcRenderer.invoke("go-forward");
      },
      print: (...args) => {
        log("preload", "App print called");
        return remote.getCurrentWebContents().print(...args);
      }
    },
    menubar: {
      enlarge: ({ height, width } = {}) => {
        ipcRenderer.invoke("enlarge", { height, width });
      },
      shrink: () => {
        ipcRenderer.invoke("shrink");
      }
    },
    on(event, callback) {
      log("preload", `User app subscribed to ${event}`);
      subscriptions.push({ event, callback });
    },
    window: {
      areTabsSupported: () => ipcRenderer.invoke("are-tabs-supported"),
      createNewTab: () => ipcRenderer.invoke("create-new-tab"),
      setProgressBar: (...args) =>
        remote.getCurrentWindow().setProgressBar(...args)
    },
    app: {
      createNewWindow: () => ipcRenderer.invoke("create-new-window"),
      dock: {
        bounce: (...args) => remote.app.dock.bounce(...args),
        cancelBounce: (...args) => remote.app.dock.cancelBounce(...args),
        setBadge: (...args) => remote.app.dock.setBadge(...args),
        getBadge: () => remote.app.dock.getBadge(...args)
      },
      setBadgeCount: (...args) => remote.app.setBadgeCount(...args),
      getBadgeCount: () => remote.app.getBadgeCount(),
      hide: () => remote.app.hide(),
      show: () => remote.app.show(),
      focus: () => remote.app.focus(),
      setName: (...args) => remote.app.setName(...args),
      getName: () => remote.app.getName(),
      getLaunchSettings: () => ipcRenderer.invoke("get-launch-settings"),
      setLaunchSettings: (...args) =>
        ipcRenderer.send("set-launch-settings", ...args)
    }
  };

  ipcRenderer.on("api-event", (e, { event, args = [] }) => {
    subscriptions
      .filter(subscription => ["*", event].includes(subscription.event))
      .forEach(({ callback }) => callback(event, ...args));
  });
} catch (e) {
  reportError("preload", e);
}

// Cookies in preload scripts are broken so lets un-disable them
// https://github.com/electron/electron/issues/21256
document.__defineGetter__("cookie", origCookieGetter);
document.__defineSetter__("cookie", origCookieSetter);
