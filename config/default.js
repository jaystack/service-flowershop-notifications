const path = require('path')
module.exports = {
  "systemEndpoints": {
    "sync": true,
    "host": path.normalize(__dirname + "/../system-endpoints.json")
  },
  "rascal": {
    "vhosts": {
      "flowershop": {
        "connection": {
          "hostname": "localhost",
          "user": "guest",
          "password": "guest",
          "port": 5672,
          "vhost": "flowershop",
          "options": {
            "heartbeat": 5
          }
        },
        "queues": {
          "sendEmailMQ": {
            "options": {
              "arguments": {
                "x-message-ttl": 60000,
                "x-max-length": 5000
              }
            }
          }
        },
        "subscriptions": {
          "sendEmailMQ": {
            "queue": "sendEmailMQ"
          }
        }
      }
    }
  },
  "defer": 1000,
  "queuename": "sendEmailMQ",
  "mongodb": {
    "uri": "mongodb://localhost/flowershop"
  }
}