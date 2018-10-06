const rp = require("request-promise");
const winston = require("winston");
const config = require("config");
const Token = require("../models/token");
const CitexToken = require("../contract/token.js");

async function getTimestamp(blockNumber) {
  const apiKey = config.get("etherscanAPIKey");

  var options = {
    method: "GET",
    uri: `https://api-ropsten.etherscan.io/api?module=block&action=getblockreward&blockno=${blockNumber}&apikey=${apiKey}`,
    json: true
  };

  const block = await rp(options);
  return block.result.timeStamp;
}

async function insertEvent(event) {
  const blockNumber = event.blockNumber;
  const timestamp = await getTimestamp(blockNumber);

  const token = Token(event);
  token.timestamp = timestamp;
  await token.save();
}

function getAllEvents() {
  CitexToken().then(token => {
    token.events.allEvents({ filter: {}, fromBlock: 0, toBlock: "latest" }, async function(error, events) {
      if (events.event === "Transfer") {
        const token = await Token.findOne({ transactionHash: events.transactionHash });
        if (!token) {
          const blockNumber = events.blockNumber;
          const timestamp = await getTimestamp(blockNumber);

          winston.debug(events.transactionHash);
          const token = Token(events);
          token.timestamp = timestamp;
          await token.save();
        }
      }
    });
  });
}

module.exports.subscribeEvents = function() {
  CitexToken().then(token => {
    token.getPastEvents("Transfer", { filter: {}, fromBlock: 0, toBlock: "latest" }, async function(error, events) {
      if (events) {
        for (event of events) {
          const token = await Token.findOne({ transactionHash: event.transactionHash });
          if (!token) {
            winston.debug(event.transactionHash);

            await insertEvent(event);
          }
        }
      }
    });

    token.events.Transfer({ filter: {}, fromBlaock: 0, toBlock: "latest" }, async function(error, event) {
      winston.debug(event.transactionHash);

      await insertEvent(event);
    });
  });
};

module.exports.syncEvents = function() {
  CitexToken().then(token => {
    token.getPastEvents("Transfer", { filter: {}, fromBlock: 0, toBlock: "latest" }, async function(error, events) {
      if (events) {
        for (event of events) {
          const token = await Token.findOne({ transactionHash: event.transactionHash });
          if (!token) {
            winston.debug(event.transactionHash);
            await insertEvent(event);
          }
        }
      }
    });
  });
};
