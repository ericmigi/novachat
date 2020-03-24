// This file tracks whether the app is in focus and visibile
const { app, BrowserWindow } = require("electron");
const { throttle } = require("lodash");

const state = {
  focus: false,
  visibility: false
};
const subscriptions = [];

const onValueChange = (event, value) => {
  state[event] = value;
  subscriptions
    .filter(subscription => subscription.event === event)
    .forEach(({ callback }) => callback(value));
};

/*
  This started out as listening to events from each individual window, etc.
  but it got too messy so now it checks everything on any event pretty much.
  This is throttled to be safe, not because there was an issue.
*/
const updateStateIfNecessary = throttle(() => {
  const windows = BrowserWindow.getAllWindows().filter(
    ({ isDestroyed }) => !isDestroyed()
  );

  /*
    It's best to call getFocusedWindow(); sometimes .getAllWindows says 
    windows are destroyed when they're not
  */
  const newFocusValue =
    !!BrowserWindow.getFocusedWindow() ||
    windows.some(({ isFocused }) => isFocused());
  if (newFocusValue !== state.focus) {
    onValueChange("focus", newFocusValue);
  }

  const newVisiblityValue = windows.some(({ isVisible }) => isVisible());
  if (newVisiblityValue !== state.visibility) {
    onValueChange("visibility", newVisiblityValue);
  }
}, 10);

const init = () => {
  // NOTE: updateStateIfNecessary is exported and may be called in other files
  app.on("browser-window-created", (event, window) => {
    updateStateIfNecessary();
    window.on("show", updateStateIfNecessary);
    window.on("closed", updateStateIfNecessary);
    window.on("hide", updateStateIfNecessary);
  });

  app.on("browser-window-focus", updateStateIfNecessary);
  app.on("browser-window-blur", updateStateIfNecessary);
};

const get = event => state[event];

// event = focus/visiblity
const subscribe = (event, callback) => {
  subscriptions.push({
    callback,
    event
  });
};

module.exports = { init, get, subscribe, updateStateIfNecessary };
