const path = require("path");
const winston = require("winston");
const { timestamp, printf } = winston.format;

module.exports = function() {
  const errorFormatter = printf(error => {
    var stack = "";
    if (error.stack) {
      stack = error.stack.replace(/[\r\n]+/g, "");
    }

    return `{"timestamp":"${error.timestamp}", "level":"${error.level}", "message":"${error.message}", "stack":"${stack}"}`;
  });

  const consoleFormatter = printf(error => {
    return `${error.level}: ${error.message}`;
  });

  winston.add(
    new winston.transports.File({
      filename: path.join(__dirname, "../logs/exceptions.log"),
      format: winston.format.combine(timestamp(), errorFormatter),
      level: "error"
    })
  );

  winston.add(
    new winston.transports.File({
      filename: path.join(__dirname, "../logs/info.log"),
      format: winston.format.combine(timestamp(), errorFormatter),
      level: "info"
    })
  );

  winston.add(
    new winston.transports.Console({
      level: "debug",
      format: winston.format.combine(winston.format.colorize(), consoleFormatter)
    })
  );

  process.on("uncaughtException", ex => {
    winston.error({ message: ex.message, stack: ex.stack });
  });

  process.on("unhandledRejection", ex => {
    throw new SyntaxError(ex);
  });
};
