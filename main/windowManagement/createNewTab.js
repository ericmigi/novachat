const { BrowserWindow } = require("electron");

const withFocusedWindow = block => {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow) {
    return block(focusedWindow);
  }
  return undefined;
};

module.exports = ({ isForeground, newUrl, windowManagement }) => {
  withFocusedWindow(focusedWindow => {
    const newTab = windowManagement.createNewWindow({
      newUrl,
      windowManagement
    });
    focusedWindow.addTabbedWindow(newTab);
    if (!isForeground) {
      focusedWindow.focus();
    }
    return newTab;
  });
  return undefined;
};
