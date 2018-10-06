const mongoose = require("mongoose"),
  Schema = mongoose.Schema,
  autoIncrement = require("mongoose-auto-increment");
const config = require("../config/setting");

mongoose.connect(
  config.database,
  { useNewUrlParser: true }
);
mongoose.set("useCreateIndex", true);
autoIncrement.initialize(mongoose.connection);

mongoose.connection.on("connected", () => {
  console.log("Connetcted to DataBase");
});
