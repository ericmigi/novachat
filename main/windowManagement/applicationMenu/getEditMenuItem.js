const transformMenuItemLabel = require("./transformMenuItemLabel");

module.exports = () => {
  return {
    label: transformMenuItemLabel("Edit"),
    submenu: [
      {
        label: "Undo",
        accelerator: "CmdOrCtrl+Z",
        role: "undo"
      },
      {
        label: "Redo",
        accelerator: "Shift+CmdOrCtrl+Z",
        role: "redo"
      },
      {
        type: "separator"
      },
      {
        label: "Cut",
        accelerator: "CmdOrCtrl+X",
        role: "cut"
      },
      {
        label: "Copy",
        accelerator: "CmdOrCtrl+C",
        role: "copy"
      },
      {
        label: "Paste",
        accelerator: "CmdOrCtrl+V",
        role: "paste"
      },
      {
        label: "Paste and Match Style",
        accelerator: "CmdOrCtrl+Shift+V",
        role: "pasteandmatchstyle"
      },
      {
        label: "Select All",
        accelerator: "CmdOrCtrl+A",
        role: "selectall"
      }
    ]
  };
};
