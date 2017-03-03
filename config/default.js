const { transports } = require('winston')

module.exports = {

  endpoints: {
    endpointsFilePath: 'system-endpoints.json',
    normalize: true
  },

  logger: {
    transportFactories: [
      () => new transports.Console(),
      () => new transports.File({ filename: 'all.log' })
    ]
  },

  mongodb: {
    db: "flowershop"
  },

  rabbit: {
    connection: {
      username: 'guest',
      password: 'guest'
    }
  },

  messaging: {
    requestQueue: 'sendEmailMQ',
    deadLetterExchange: 'service-flowershop-notifications-dlx'
  }

}