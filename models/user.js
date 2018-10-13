const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const randToken = require("rand-token");
autoIncrement = require("mongoose-auto-increment");
const Account = require("./account");

// User Schema
const UserSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  referalCode: { type: String, required: true, unique: true, uppercase: true },
  KYCCode: { type: String },
  KYCVerified: { type: Boolean, default: false },
  KYCUpdated: { type: Boolean, default: false },
  SignedContract: { type: Boolean, default: false },
  hasWallet: { type: Boolean, default: false },
  firstName: { type: String },
  lastName: { type: String },
  birthDate: { type: String },
  address: { type: String },
  walletAddress: { type: String, lowercase: true },
  telephone: { type: String },
  passportImageAddress: { type: String },
  imageAddress: { type: String },
  registeredDate: { type: Date, default: Date.now() },
  referal: { type: String },
  contractType: { type: String, enum: ["Risky", "Normal"] },
  balance: { type: Number, default: 0 }
});

UserSchema.index(
  { walletAddress: 1 },
  {
    unique: true,
    partialFilterExpression: { walletAddress: { $type: "string" } }
  }
);

const User = (module.exports = mongoose.model("User", UserSchema));

module.exports.getUserById = function(id, callback) {
  User.findById(id, callback);
};

module.exports.getUserByIdAsync = async function(id) {
  user = await User.findById(id);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

module.exports.getUserByStrId = async function(strId) {
  var id = mongoose.Types.ObjectId;
  if (id.isValid(strId)) {
    id = mongoose.Types.ObjectId(strId);
    user = await User.findById(id);
    if (user) {
      return user;
    }
  }
  throw new Error("UserId not found");
};

module.exports.getUserByEmail = async function(email) {
  const query = { email: email };
  user = await User.findOne(query);

  if (!user) {
    throw new Error("Email not registered");
  }
  return user;
};

module.exports.addUser = async function(email, password, referal) {
  await User.checkReferal(referal);
  var newAccount = new Account({
    email: email,
    password: password,
    emailVerified: false,
    enabled: true,
    registeredDate: new Date(),
    accountType: "User"
  });
  salt = await bcrypt.genSalt(10);
  hash = await bcrypt.hash(newAccount.password, salt);
  newAccount.password = hash;
  var token = randToken.generate(16);
  var referalCode = randToken.generate(8);
  user = await User.findOne({ referalCode: referalCode });
  while (user) {
    referalCode = randToken.generate(8);
    user = await User.findOne({ referalCode: referalCode });
  }
  newAccount.emailVerificationToken = token;
  try {
    var newUser = new User({ email: email, referal: referal.toUpperCase(), referalCode: referalCode });
    await newUser.save();
    return await newAccount.save();
  } catch (ex) {
    if (ex.code == 11000) {
      throw new Error("Email registered before");
    } else {
      throw ex;
    }
  }
};

module.exports.comparePassword = async function(candidatePassword, hash) {
  return await bcrypt.compare(candidatePassword, hash);
};

module.exports.changePassword = async function(user, newPassword) {
  salt = await bcrypt.genSalt(10);
  hash = await bcrypt.hash(newPassword, salt);
  user.password = hash;
  return await user.save();
};

module.exports.checkReferal = async function(referal) {
  if (referal) {
    query = { referalCode: referal.toUpperCase() };

    user = await User.findOne(query);

    if (user) {
      return true;
    } else {
      throw new Error("Invalid Referal");
    }
  } else {
    return true;
  }
};

module.exports.hasRole = async function(roles, requestedRole) {
  var isFound = false;
  requestedRole.push("admin");

  roles.forEach(function(role, index, array) {
    if (requestedRole.includes(role.roleTitle)) {
      isFound = true;
    }
  });
  return await isFound;
};

module.exports.getUserReferals = async function(referal) {
  const query = { referalCode: referal };

  return await User.find(query, { email: 1, _id: 0 });
};

module.exports.getUsersList = async function() {
  const query = {};
  return await User.find(query);
};

module.exports.getUsersListRoles = async function() {
  const query = {};
  return await User.find(query, {
    email: 1,
    firstName: 1,
    lastName: 1,
    roles: 1
  });
};

module.exports.getUsersListKYC = async function() {
  const query = { KYCUpdated: true, KYCVerified: false };
  return await User.find(query, { password: 0 });
};

module.exports.getUserKYC = async function(email) {
  const query = { email: email };

  return await User.findOne(query, { password: 0 });
};
