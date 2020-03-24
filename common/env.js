module.exports = Object.freeze({
  // We can't use electron-is-dev package because we disable remote in the renderer
  isDev: process.env.TODESKTOP_BUILD_SERVER_STAGE === "dev"
});
