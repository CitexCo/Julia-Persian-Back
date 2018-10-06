const token_events = require('../events/token')

module.exports = function () {
    token_events.subscribeEvents()
}