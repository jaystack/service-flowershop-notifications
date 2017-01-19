import * as config from 'config';
import * as rascal from 'rascal';
import * as mongoose from 'mongoose';
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

function messageHandler(msg: any, content: any, ackOrNack: Function) {
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

export default async function main() {
  mongoose.connect(config.get('mongodb.uri'));
  const broker = await promisifyCreateBroker(rascal, rascal.withDefaultConfig(config.get('rascal')));
  subscribe(broker, config.get('queuename'));
}