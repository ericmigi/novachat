const store = require("./store");

let wasFirstLaunch;

const init = () => {
  wasFirstLaunch = !store.get("hasLaunchedEver");
  if (wasFirstLaunch) {
    store.set("hasLaunchedEver", true);
  }
};

const isFirstLaunch = () => {
  if (wasFirstLaunch === undefined) {
    throw new Error("Not yet initialized");
  }
  return wasFirstLaunch;
};

module.exports = { isFirstLaunch, init };
