i18n = require("i18n");

i18n.configure({
  locales: ["en", "fa"],
  defaultLocale: "fa",
  register: global,
  directory: __dirname + "/../locales"
});
