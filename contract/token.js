const fs = require("fs");
const path = require("path");
const web3 = require("../network/web3");

const tokenABI = JSON.parse(fs.readFileSync(path.join(__dirname, "../build/contracts/citexToken.json")));
const abi = tokenABI.abi;

async function getNetworkId() {
  const networkId = await web3.eth.net.getId();
  return networkId;
}

module.exports = function() {
  return new Promise((resolve, reject) => {
    try {
      getNetworkId().then(id => {
        const address = tokenABI.networks[id].address;
        const CitexToken = new web3.eth.Contract(abi, address);
        resolve(CitexToken);
      });
    } catch (ex) {
      reject(ex);
    }
  });
};
