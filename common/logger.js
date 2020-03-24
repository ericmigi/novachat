// Log at dev console, at running node console instance, and to disk potentially
const { isDev } = require("./env");
const { ipcRenderer } = require("electron");
// See docs of following module to see where log file is
const electronLog = require("electron-log");

let mainWindow;

const preprocessMessage = message =>
  typeof message === "string" ? message : JSON.stringify(message, null, 2);

const setMainWindow = function(win) {
  mainWindow = win;
};

const log = function(source, ...messages) {
  if (!messages.length) {
    const badParametersMessage = `console.log("[logger]: ! Message omitted. Source: ${source}")`;
    console.log(badParametersMessage);
    mainWindow.webContents.executeJavaScript(badParametersMessage);
    return;
  }

  let messageToLog = `[${source}]: ${preprocessMessage(messages[0])}`;
  if (messages.length > 1) {
    const prefix = "  \n- ";
    messageToLog += `${prefix}${messages
      .slice(1)
      .map(preprocessMessage)
      .join(prefix)}`;
  }

  // Write to log on disk, standard output, and renderer console (only in dev)
  if (source === "preload" && !isDev) {
    electronLog.transports.console.level = false;
  }
  electronLog.info(messageToLog);
  if (source === "preload" && !isDev) {
    electronLog.transports.console.level = true;
  }

  if (source === "preload") {
    // Log to standard output
    ipcRenderer.invoke("log-from-preload", messageToLog);
  } else if (source === "main") {
    // Don't send logs from main to renderer side in production
    if (!isDev) {
      return;
    }

    if (!mainWindow || mainWindow.isDestroyed()) {
      return;
    }

    mainWindow.webContents.executeJavaScript(
      `console.log(${JSON.stringify(messageToLog)})`
    );
  }
};

module.exports = { setMainWindow, log };
