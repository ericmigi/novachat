const { Notification, shell } = require("electron");
const { log } = require("../common/logger");
const electronDownload = require("electron-dl");

module.exports = () => {
  electronDownload({
    onStarted(item) {
      const filename = item.getFilename();
      const fullpath = item.getSavePath();

      const downloadingNotification = new Notification({
        title: "Downloading…",
        subtitle: filename,
        silent: true
      });
      downloadingNotification.show();
      item.on("done", (e, state) => {
        downloadingNotification.close();
        if (state === "completed") {
          const finishedNotification = new Notification({
            title: "✅ Download Completed!",
            subtitle: filename
          });
          finishedNotification.show();
          finishedNotification.on("click", () => {
            log("main", "App triggered file download");
            shell.showItemInFolder(fullpath);
          });

          log("main", "App triggered file download");
        } else {
          const errorNotification = new Notification({
            title: "Download Error",
            subtitle: `There was an error downloading ${filename}`
          });
          errorNotification.show();
        }
      });
    }
  });
};
