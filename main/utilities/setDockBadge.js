const { app } = require("electron");
let currentBadgeCount = 0;

module.exports = (count, shouldBounce = false) => {
  if (process.platform !== "darwin") {
    return;
  }

  app.dock.setBadge(count);
  if (shouldBounce && count > currentBadgeCount) {
    app.dock.bounce();
  }
  currentBadgeCount = count;
};
