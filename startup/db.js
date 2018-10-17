const config = require("config");
const mongoose = require("mongoose"),
  Schema = mongoose.Schema,
  autoIncrement = require("mongoose-auto-increment");

mongoose.connect(
  config.get("database"),
  { useNewUrlParser: true }
);
mongoose.set("useCreateIndex", true);
autoIncrement.initialize(mongoose.connection);

mongoose.connection.on("connected", () => {
  console.log("Connetcted to DataBase");
});
