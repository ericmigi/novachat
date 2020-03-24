/*
  Sentry will be auto-initialized when this required. This can be
  required from the main or renderer process. Crash reports are
  automatically caught. Errors are in general but use reportError() 
  when manually catching.
*/

const appOptions = require("../appConfig.json");
const { isDev } = require("./env");
const { log } = require("./logger");
const pkgJson = require("../package.json");
const { machineIdSync: getAnonymousId } = require("node-machine-id");
const Sentry = require("@sentry/electron");

if (!isDev) {
  Sentry.init({
    dsn: "https://3f70b4c842dd4eeda545b01171b0d666@sentry.io/1889009",
    /*
      Auto-capturing crash reports would be nice but it seems to crash windows
      on the launch following a crash (when it finds dump files)
    */
    enableNative: false,
    beforeSend(event, hints) {
      // Don't send errors that come from the customer's web app
      let hasComeFromCustomersApp = false;
      // crashed_process is "browser" when the origin was the main process
      if (!event.extra || event.extra.crashed_process !== "browser") {
        hasComeFromCustomersApp = event.exception.values.some(
          ({ stacktrace }) =>
            stacktrace.frames.some(frame => frame.filename.startsWith("http"))
        );
      }

      if (hasComeFromCustomersApp) {
        return null;
      }
      return event;
    },
    release: pkgJson.desktopifyVersion
  });

  Sentry.setUser("id", getAnonymousId());
  Sentry.setExtra("appOptions", appOptions);
}

const reportError = (source, error) => {
  log(source, error.stack);

  if (isDev) {
    return;
  }
  Sentry.captureException(error);
};

module.exports = {
  reportError
};
