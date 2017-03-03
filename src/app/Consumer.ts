import amqp = require('amqplib')
import winston = require('winston')
import System from 'corpjs-system'
import { IEmail } from './types'

interface Deps {
  config: any
  channel: amqp.Channel
  logger: winston.LoggerInstance
}

let emails;
let messaging;

export default function (): System.Component {
  return {
    async start(deps: Deps, _, stop) {
      const db = deps['mongodb']
      emails = db.collection('emails')
      const messaging = deps['messaging']
      const requestQueue = await assertQueueAndDlx(deps)
      await deps.channel.consume(requestQueue, receive.bind(null, deps), { consumerTag: 'consumer' })
      this.stop = async () => await deps.channel.cancel('consumer')
    }
  }
}

async function assertQueueAndDlx(deps: Deps): Promise<string> {
  const deadLetterExchange = (deps.config.messaging && deps.config.messaging.deadLetterExchange) || 'dlx'
  const requestQueue = (deps.config.messaging && deps.config.messaging.requestQueue) || 'requests'
  await deps.channel.assertExchange(deadLetterExchange, 'topic', { durable: true })
  await deps.channel.assertQueue(requestQueue, { deadLetterExchange, durable: true })
  return requestQueue
}

async function receive(deps: Deps, msg: amqp.Message) {
  const stringifiedRequest = msg.content.toString()
  deps.logger.info(`Request: ${stringifiedRequest}`)
  try {
    const request = JSON.parse(stringifiedRequest)
    await messageHandler(deps, request)
    deps.channel.ack(msg)
  } catch (err) {
    deps.logger.error(`Rejection: ${stringifiedRequest} with error: ${err}`)
    deps.channel.reject(msg, false)
  }
}

async function messageHandler(deps: Deps, emailRequest: any): Promise<void> {
  // Do what you want ...
  let email = Object.assign({}, emailRequest, { _id: emailRequest['_id'].toHexString() })
  emails.insertOne(email)
    .then(result => {
      console.log(`result: ${result.constructor}, email: ${JSON.stringify(email)}`)
      console.log(`result['ok']: ${result['ok']}`, `${result}`)
      console.log(`email._id: '${email["_id"]}'`)
    })
    .catch(deps.logger.warn)
}