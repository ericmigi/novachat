const { getWindowPosition } = require("menubar/lib/util/getWindowPosition");
const Positioner = require("electron-positioner");

module.exports = ({ height, tray, width }) => {
  const positioner = new Positioner(
    // fake BrowserWindow:
    {
      getSize: () => [width, height]
    }
  );

  return positioner.calculate(getWindowPosition(tray), tray.getBounds());
};
