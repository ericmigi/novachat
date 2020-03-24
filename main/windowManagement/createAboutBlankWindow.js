module.exports = windowManagement => {
  const window = windowManagement.createNewWindow({
    newUrl: "about:blank",
    windowManagement
  });
  window.hide();
  window.webContents.once("did-stop-loading", () => {
    if (window.webContents.getURL() === "about:blank") {
      window.close();
    } else {
      window.show();
    }
  });
  return window;
};
