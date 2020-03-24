const transformMenuItemLabel = require("./transformMenuItemLabel");

module.exports = () => {
  const submenu = [
    {
      label: "Minimize",
      accelerator: "CmdOrCtrl+M",
      role: "minimize"
    },
    {
      label: "Close",
      accelerator: "CmdOrCtrl+W",
      role: "close"
    }
  ];

  if (process.platform === "darwin") {
    submenu.push(
      {
        type: "separator"
      },
      {
        label: "Bring All to Front",
        role: "front"
      }
    );
  }

  return {
    label: transformMenuItemLabel("Window"),
    role: "window",
    submenu
  };
};
