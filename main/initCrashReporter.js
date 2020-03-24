const appOptions = require("../appConfig.json");
const { log } = require("../common/logger");
const { app, crashReporter } = require("electron");

module.exports = () => {
  if (!appOptions.crashReporter) {
    return;
  }
  app.on("will-finish-launching", () => {
    crashReporter.start({
      companyName: appOptions.companyName || "",
      productName: appOptions.name,
      submitURL: appOptions.crashReporter,
      uploadToServer: true
    });
    log("main", "App crashed");
  });
};
