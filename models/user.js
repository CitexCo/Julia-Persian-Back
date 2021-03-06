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
  referal: { type: String, uppercase: true },
  contractType: { type: String, enum: ["Risky", "Normal"] },
  balance: { type: Number, default: 0 }
});

// walletAddress must be uniqe and create index based on it
UserSchema.index(
  { walletAddress: 1 },
  {
    unique: true,
    partialFilterExpression: { walletAddress: { $type: "string" } }
  }
);

const User = (module.exports = mongoose.model("User", UserSchema));

// get user's email as input and return user's object as output
module.exports.getUserByEmail = async function(email) {
  const query = { email: email };
  user = await User.findOne(query);

  if (!user) {
    throw new Error("Email not registered");
  }
  return user;
};

// add user to Database, check if referals is correct and generate salt and hash password, also create account for user
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
  // generate random uniqe referal code for invitation - 8 chars
  var referalCode = randToken.generate(8);
  user = await User.findOne({ referalCode: referalCode });
  while (user) {
    referalCode = randToken.generate(8);
    user = await User.findOne({ referalCode: referalCode });
  }
  // generate email verification code - 16 chars
  var token = randToken.generate(16);
  newAccount.emailVerificationToken = token;
  try {
    var newUser = new User({ email: email, referal: referal, referalCode: referalCode });
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

// compare input password with stored password in DB, for authentication
module.exports.comparePassword = async function(candidatePassword, hash) {
  return await bcrypt.compare(candidatePassword, hash);
};

// change user's password
module.exports.changePassword = async function(user, newPassword) {
  salt = await bcrypt.genSalt(10);
  hash = await bcrypt.hash(newPassword, salt);
  user.password = hash;
  return await user.save();
};

// check if referal exist in DB
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

// check if requestedRole in roles for authorize admins
module.exports.hasRole = async function(roles, requestedRole) {
  var isFound = false;

  roles.forEach(function(role, index, array) {
    if (requestedRole.includes(role.roleTitle)) {
      isFound = true;
    }
  });
  return await isFound;
};

// return user's referal list
module.exports.getUserReferals = async function(referal) {
  console.log(referal);
  const query = { referal: referal };

  return await User.find(query, { email: 1, _id: 0 });
};

// return all users list
module.exports.getUsersList = async function() {
  const query = {};
  return await User.find(query);
};

// return users information when user updated his KYC and his KYC not verified yet
module.exports.getUsersListKYC = async function() {
  const query = { KYCUpdated: true, KYCVerified: false };
  return await User.find(query, { password: 0 });
};

// get a user KYC information
module.exports.getUserKYC = async function(email) {
  const query = { email: email };

  return await User.findOne(query, { password: 0 });
};
