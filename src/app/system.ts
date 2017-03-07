const {name} = require('../../package.json')
import System from 'corpjs-system'
import Config from 'corpjs-config'
import MongoDb from 'corpjs-mongodb'
import Endpoints from 'corpjs-endpoints'
import Logger from 'corpjs-logger'
import Amqp from 'corpjs-amqp'
import { stringify } from 'querystring'
import Consumer from './Consumer'

const inDevEnv = process.env.NODE_ENV === 'dev'
process.on('unhandledRejection', err => console.error(err))

export default new System({ exitOnError: inDevEnv })
  .add('config', new Config()
    .add(() => Config.loaders.require({ path: 'config/default.js', watch: true }))
    .add(() => Config.loaders.require({ path: 'config/test.js' }))
  )
  .add('endpoints', Endpoints()).dependsOn({ component: 'config', source: 'endpoints', as: 'config' })
  .add('mongodb', MongoDb()).dependsOn('endpoints', { component: 'config', source: 'mongodb', as: 'config' })
  .add('logger', Logger()).dependsOn({ component: 'config', source: 'logger', as: 'config' })
  .add('connection', Amqp.Connection()).dependsOn({ component: 'config', source: 'rabbit', as: 'config' }, 'endpoints', 'mongodb')
  .add('channel', Amqp.Channel()).dependsOn('connection')
  .add('consumer', Consumer()).dependsOn('config', 'logger', 'channel')
  .on('componentStart', (componentName: string) => console.log(`Started component: ${componentName}`))
  .on('componentStop', (componentName: string) => console.log(`Stopped component: ${componentName}`))
  .on('start', resources => console.log(`Started service: ${name}`))
  .on('stop', (err, stopErr) => console.log(`Stopped service: ${name}`, err || '', stopErr || ''))