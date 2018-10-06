const Admin = require("../models/admin");
const winston = require("winston");

module.exports = async function(req, res, next) {
  switch (req.baseUrl) {
    case "/admins":
      type = "Admin";
      break;
    case "/users":
      type = "User";
      break;
    case "/exchangers":
      type = "Exchanger";
      break;
  }

  if (type != "Admin") {
    if (req.user.accountType != type) {
      throw new Error("Unauthorized action");
      // winston.error({ message: "Unauthorized action by " + req.user.email + " on " + req.originalUrl, stack: err.stack });

      return res.sendStatus(401);
    } else {
      next();
    }
  } else {
    const adminEmail = req.user.email;
    admin = await Admin.getAdminByEmail(adminEmail);
    switch (req.url) {
      case "/get-kyc":
      case "/listkyc":
      case "/verifykyc":
        role = ["verifyKYC"];
        break;
      case "/listroles":
      case "/changeroles":
        role = ["changeRoles"];
        break;
      case "/enable":
      case "/disable":
      case "/admins":
      case "/exchangers":
      case "/users":
        role = ["userManager"];
        break;
      case "/list-receipt":
      case "/list-approved-receipt":
      case "/list-rejected-receipt":
      case "/list-pending-receipt":
      case "/approve-receipt":
      case "/reject-receipt":
      case "/list-burn":
      case "/list-approved-burn":
      case "/list-rejected-burn":
      case "/list-pending-burn":
      case "/approve-burn":
      case "/reject-burn":
      case "/list-transfer":
      case "/list-approved-transfer":
      case "/list-rejected-transfer":
      case "/list-pending-transfer":
      case "/approve-transfer":
      case "/reject-transfer":
        role = ["financeManager"];
        break;
      case "/tickets/answer":
      case "/tickets/listall":
        role = ["answerTicket"];
        break;
      case "/rpc/token-price":
        role = ["RPCManager"];
        break;
      default:
        role = null;
    }
    hasRole = await Admin.hasRole(admin, role);

    if (!hasRole) {
      throw new Error("Unauthorized action");

      // winston.error({ message: "Unauthorized action by " + req.user.email + " on " + req.originalUrl, stack: err.stack });
      return res.sendStatus(401);
    } else {
      next();
    }
  }
};
