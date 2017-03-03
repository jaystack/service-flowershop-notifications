const { transports } = require('winston')

module.exports = {

  logger: {
    transportFactories: []
  },

  messaging: {
    requestQueue: 'service-flowershop-notifications-test-requests',
    deadLetterExchange: 'service-flowershop-notifications-test-dlx',
    deadLetterQueue: 'service-flowershop-notifications-dlq'
  }

}