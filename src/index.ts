import * as config from 'config';
import * as rascal from 'rascal';
import * as mongoose from 'mongoose';
import { getServiceAddress } from 'system-endpoints'
import { stringify } from 'querystring'
import Email from './email';
import { IEmail, IOrder } from './types';

function promisifyCreateBroker(rascal: any, rascalConfig: any) {
  return new Promise((resolve, reject) => {
    return rascal.createBroker(rascalConfig, {}, (err: Error, broker: any) => {
      if (err) {
        console.log("ERROR in createBroker: " + err);
        return reject(err);
      }

      return resolve(broker);
    });
  });
}

function subscribe(broker: any, queueName: string): Promise<void> {
  return new Promise<void>((resolve: Function, reject: Function) => {
    broker.subscribe(queueName, (err: Error, subscription: any) => {
      if (err) {
        console.log("ERROR in subscribe");
        return reject(err);
      }

      subscription.on(
        "message",
        (msg: any, content: any, ackOrNack: Function) => messageHandler(msg, content, ackOrNack)
      );

      resolve();
    });
  });
}

function messageHandler(msg: any, content: any, ackOrNack: Function):void {
  const order: IOrder = JSON.parse(content);
  insertToDb(getEmailFromOrder(order));
  return ackOrNack();
}

function getMessage(order: IOrder): string {
  return `Hi ${order.CustomerName}!
Here are your order details:
Total Price: ${order.OrderPrice}
Items ordered:
${order.Orders.map((item) => item.Name).join(', ')}`;
}

function getEmailFromOrder(order: IOrder): IEmail {
  return {
    to: order.EmailAddress,
    subject: 'Order Confirmation',
    date: new Date(),
    message: getMessage(order),
    type: 'order_confirmation'
  }
}

function insertToDb(emailToSend: IEmail) {
  const email = new Email(emailToSend);

  email.save((error: Error) => {
    if (error) return console.log("Error", error);
    return console.log("successful save");
  });
}

function createRascalConnectionString({user, password, vhost, hostname, port, options}, endpointAddress: string) {
  const address = endpointAddress || `${hostname}:${port}`;
  const optionString = stringify(options);
  return `amqp://${user}:${password}@${address}/${vhost}?${optionString}`
}

async function createBroker(rascalConfig) {
  const endpointAddress = getServiceAddress('localhost:5672');
  const connection = createRascalConnectionString(rascalConfig.vhosts.flowershop.connection, endpointAddress);
  const config = { vhosts: { flowershop: { ...rascalConfig.vhosts.flowershop, connection } } };
  return await promisifyCreateBroker(rascal, rascal.withDefaultConfig(config));
}

export default async function main() {
  mongoose.connect(config.get('mongodb.uri'));
  const rascalConfig = config.get('rascal');
  const broker = await createBroker(rascalConfig);
  subscribe(broker, config.get('queuename'));
}