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
    console.log(req.url);
    console.log(req.originalUrl);

    switch (req.originalUrl) {
      case "/admins/get-kyc":
      case "/admins/listkyc":
      case "/admins/verifykyc":
        role = ["verifyKYC"];
        break;
      case "/admins/all-roles":
      case "/admins/listroles":
      case "/admins/changeroles":
        role = ["changeRoles"];
        break;
      case "/admins/register-admin":
      case "/admins/register-exchanger":
      case "/admins/enable":
      case "/admins/disable":
      case "/admins/admins":
      case "/admins/exchangers":
      case "/admins/users":
        role = ["userManager"];
        break;
      case "/admins/list-receipt":
      case "/admins/list-approved-receipt":
      case "/admins/list-rejected-receipt":
      case "/admins/list-pending-receipt":
      case "/admins/modify-receipt":
      case "/admins/approve-receipt":
      case "/admins/reject-receipt":
      case "/admins/list-burn":
      case "/admins/list-approved-burn":
      case "/admins/list-rejected-burn":
      case "/admins/list-pending-burn":
      case "/admins/approve-burn":
      case "/admins/reject-burn":
      case "/admins/list-transfer":
      case "/admins/list-approved-transfer":
      case "/admins/list-rejected-transfer":
      case "/admins/list-pending-transfer":
      case "/admins/list-ready-transfer":
      case "/admins/transfer-blockchain":
      case "/admins/approve-transfer":
      case "/admins/reject-transfer":
        role = ["financeManager"];
        break;
      case "/tickets/answer":
      case "/tickets/listall":
        role = ["answerTicket"];
        break;
      case "/rpc/token-price":
        role = ["financeManager"];
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
