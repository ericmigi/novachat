module.exports = () => {
  return {
    label: "Tab",
    submenu: [
      {
        label: "Select Next tab",
        accelerator: "Control+Tab",
        role: "selectNextTab"
      },
      {
        label: "Select Previous tab",
        accelerator: "Control+Shift+Tab",
        role: "selectPreviousTab"
      }
    ]
  };
};
