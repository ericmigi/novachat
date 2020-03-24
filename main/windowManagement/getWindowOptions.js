const appOptions = require("../../appConfig.json");
const areNativeTabsSupported = require("../utilities/areNativeTabsSupported");
const { isDev } = require("../../common/env");
const getAppIconPath = require("../utilities/getAppIconPath");
const { log } = require("../../common/logger");
const shouldUseNativeTabsWhenPossible = require("../utilities/shouldUseNativeTabsWhenPossible");
const { BrowserWindow, screen } = require("electron");
const path = require("path");

module.exports = ({ isMainWindow, isMenubarWindow } = {}) => {
  let defaultHeight;
  let defaultWidth;

  // The menubar window
  if (isMenubarWindow) {
    defaultWidth = 400;
    defaultHeight = 600;
  } else {
    // All other windows
    defaultWidth = 1280;
    defaultHeight = 800;
  }

  let windowBoundsToBaseBoundsOn;
  const focusedWindow = BrowserWindow.getFocusedWindow();
  const otherWindows = BrowserWindow.getAllWindows();
  if (focusedWindow) {
    windowBoundsToBaseBoundsOn = focusedWindow.getBounds();
  } else {
    if (otherWindows.length === 1 && !otherWindows[0].isDestroyed) {
      windowBoundsToBaseBoundsOn = otherWindows[0].getBounds();
    }
  }

  const isOpeningInFullScreen =
    appOptions.fullScreen && isMainWindow && !isMenubarWindow;
  const width = isOpeningInFullScreen
    ? undefined
    : (windowBoundsToBaseBoundsOn && windowBoundsToBaseBoundsOn.width) ||
      appOptions.width ||
      defaultWidth;
  const height = isOpeningInFullScreen
    ? undefined
    : (windowBoundsToBaseBoundsOn && windowBoundsToBaseBoundsOn.height) ||
      appOptions.height ||
      defaultHeight;

  // min and max dimensions:

  const defaultMaxWidth = 99999;
  const defaultMinWidth = 0;
  let maxHeight;
  let maxWidth;
  let minHeight;
  let minWidth;
  let isResizable;

  if (appOptions.appType === "menubar") {
    if (isMenubarWindow) {
      // It's unreliable on Windows
      isResizable = process.platform === "darwin" && appOptions.isResizable;
    } else {
      isResizable = true;
    }
  } else {
    isResizable = appOptions.isResizable;
  }

  if (isOpeningInFullScreen) {
    maxHeight = undefined;
    maxWidth = undefined;
    minHeight = undefined;
    minWidth = undefined;
  } else {
    // The menubar window can only ever be resized away from the tray icon
    let isHorizontallyResizable = !isMenubarWindow && isResizable;
    let isVerticallyResizable = isResizable;

    if (isHorizontallyResizable) {
      maxWidth = appOptions.maxWidth || defaultMaxWidth;
      minWidth = appOptions.minWidth || defaultMinWidth;
    } else {
      maxWidth = width;
      minWidth = width;
    }

    if (isVerticallyResizable) {
      maxHeight = appOptions.maxHeight || defaultMaxWidth;
      minHeight = appOptions.minHeight || defaultMinWidth;
    } else {
      maxHeight = height;
      minHeight = height;
    }
  }

  let x;
  let y;

  const numberOfOtherWindows = otherWindows.length;

  /*
    If this isn't the first non-menubar window, open it slightly off center so
    the other windows are still visible behind it. Otherwise it looks
    like the parent window just navigated
  */
  const numberOfWindowsToStartOffsettingAt =
    appOptions.appType === "menubar" ? 2 : 1;
  if (
    !isMenubarWindow &&
    numberOfOtherWindows >= numberOfWindowsToStartOffsettingAt
  ) {
    const offset = 15;
    if (windowBoundsToBaseBoundsOn) {
      x = windowBoundsToBaseBoundsOn.x + offset;
      y = windowBoundsToBaseBoundsOn.y + offset;
    } else {
      const screenBounds = screen.getDisplayNearestPoint(
        screen.getCursorScreenPoint()
      ).bounds;
      const offsetToApply =
        offset *
        (numberOfOtherWindows - (numberOfWindowsToStartOffsettingAt - 1));
      x = Math.floor(screenBounds.width / 2 - width / 2 + offsetToApply);
      y = Math.floor(screenBounds.height / 2 - height / 2 + offsetToApply);
    }
  }

  const result = {
    // Clicking on the menubar icon will hide the menubar window even if this is true
    alwaysOnTop: !!appOptions.alwaysOnTop,
    // Hide the application menu on Windows & Linux until Alt is pressed
    autoHideMenuBar: true,
    frame: !isMenubarWindow,
    // Explicitly give undefined, otherwise fail will enable fullscreen
    fullscreen: isOpeningInFullScreen || undefined,
    // I assume the menubar app handles this but we might as well be safe
    fullscreenable: !isMenubarWindow,
    height,
    icon: getAppIconPath(),
    maxHeight,
    maximizable: !isMenubarWindow,
    maxWidth,
    minHeight,
    // The menubar libary destroys minimized windows anyway
    minimizable: !isMenubarWindow,
    minWidth,
    movable: !isMenubarWindow,
    resizable: isResizable,
    show: !(isMainWindow || isMenubarWindow),
    tabbingIdentifier:
      shouldUseNativeTabsWhenPossible() && areNativeTabsSupported()
        ? appOptions.name
        : undefined,
    // Convert dashes to spaces because on linux the app name is joined with dashes
    title: appOptions.name,
    titleBarStyle: !isMenubarWindow && appOptions.titleBarStyle,
    webPreferences: {
      enableRemoteModule: true,
      /*
        Firebase social login doesn't work without the following. This makes Electron
        use Chromium's window.open that has a certain return value Firebase looks
        for, and maybe it uses other features that the native window.open supports
        like communication between the windows. Also, the new-window event needs to
        default to the URL of the window that called window.open if the URL given is
        an empty string.
        Our preload will not be loaded into any windows opened with window.open.
      */
      nativeWindowOpen: true,
      nodeIntegration: false,
      preload: isDev
        ? path.join(__dirname, "../../preload.js")
        : path.join(__dirname, "preload.js"),
      webSecurity: !appOptions.insecure
    },
    width,
    x,
    y
  };
  return result;
};
