import 'mocha'
import * as assert from 'assert'
import system from '../app/system'

process.env.NODE_ENV = 'test'

describe('service-flowershop-notifications', () => {

  let resources

  it('start', async () => {
    system.removeAllListeners()
    resources = await system.start()
    assert.ok(resources)
  })

  it('send request and await for response', async () => {
    await produceRequest(resources)
  })

  it('send wrong request and receive it from dead letter queue', async () => {
    await produceWrongRequest(resources)
  })

  it('stop', async () => {
    await system.stop()
  })
})

async function produceRequest({ config, channel }) {
  const requestQueue = (config.messaging && config.messaging.requestQueue) || 'requests'
  await channel.sendToQueue(requestQueue, new Buffer(JSON.stringify({ greeter: 'World' })))
}

function produceWrongRequest({ config, channel }): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    const wrongMessage = 'wrong'
    const requestQueue = (config.messaging && config.messaging.requestQueue) || 'requests'
    const deadLetterExchangeName = (config.messaging && config.messaging.deadLetterExchange) || 'dlx'
    const deadLetterQueueName = (config.messaging && config.messaging.deadLetterQueue) || 'dlq'
    await channel.assertQueue(deadLetterQueueName)
    await channel.bindQueue(deadLetterQueueName, deadLetterExchangeName, 'worker-test-requests')
    await channel.consume(deadLetterQueueName, msg => {
      channel.ack(msg)
      try {
        assert.strictEqual(msg.content.toString(), wrongMessage)
        resolve()
      } catch (err) {
        reject(err)
      }
    })
    await channel.sendToQueue(requestQueue, new Buffer(wrongMessage))
  });
}