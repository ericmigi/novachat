const wurl = require("wurl");
const { log } = require("../../common/logger");

module.exports = function(targetUrl, newUrl, internalUrlRegex) {
  if (newUrl === "about:blank") {
    return true;
  }

  // If the link is to their own domain
  if (wurl("domain", newUrl) === wurl("domain", targetUrl)) {
    return true;
  }

  // Next, check if matches some known external URLs we want to capture
  const socialLogins = [
    "facebook.com.*oauth.*",
    "linkedin.com.*oauth.*",
    "github.com.*oauth.*",
    "api.twitter.com",
    "accounts.google.com"
  ];
  const catchAll = "http.*(oauth|auth0).*";
  const externalRegex = new RegExp(
    `((.*(${socialLogins.join("|")}).*)|${catchAll})`,
    "i"
  );
  if (externalRegex.test(newUrl)) {
    return true;
  }

  // Check against the regex they supplied. If this is falsey, then the setting is disabled / the value is empty
  if (internalUrlRegex && new RegExp(internalUrlRegex, "i").test(newUrl)) {
    return true;
  }

  return false;
};
