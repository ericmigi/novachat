module.exports = label => {
  const prefix = process.platform === "darwin" ? "" : "&";

  return prefix + label;
};
