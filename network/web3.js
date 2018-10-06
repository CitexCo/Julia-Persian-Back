const Web3 = require('web3')

// const providerUrl = 'ws://localhost:8545'
const providerUrl = 'wss://ropsten.infura.io/ws'
const web3 = new Web3(new Web3.providers.WebsocketProvider(providerUrl));

module.exports = web3