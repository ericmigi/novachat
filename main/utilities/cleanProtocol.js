const appOptions = require("../../appConfig.json");

module.exports = prt => prt.replace(appOptions.appProtocol, "");
