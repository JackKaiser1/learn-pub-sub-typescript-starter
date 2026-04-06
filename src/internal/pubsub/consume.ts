import amqp from "amqplib";
import { type Channel } from "amqplib";
import { TextDecoder } from "node:util";

export enum SimpleQueueType {
    Durable,
    Transient,
}

export enum Acktype {
    Ack,
    NackRequeue,
    NackDiscard,
}

export async function declareAndBind(
    conn: amqp.ChannelModel,
    exchange: string,
    queueName: string,
    key: string,
    queueType: SimpleQueueType,
): Promise<[Channel, amqp.Replies.AssertQueue]> {
    const channel = await conn.createChannel();

    let options: { [key: string]: any };

    switch (queueType) {
        case SimpleQueueType.Durable: 
            options = { durable: true };
            break;
        case SimpleQueueType.Transient: 
            options = { autoDelete: true, exclusive: true };
            break;
    }

    options.arguments = { "x-dead-letter-exchange": "peril_dlx" };

    const queue = await channel.assertQueue(queueName, options);
    await channel.bindQueue(queueName, exchange, key);

    return [channel, queue];
}

export async function subscribeJSON<T>(
    conn: amqp.ChannelModel, 
    exchange: string,
    queueName: string,
    key: string,
    queueType: SimpleQueueType,
    handler: (data: T) => Acktype,
): Promise<void> {
    const [channel, queue] = await declareAndBind(conn, exchange, queueName, key, queueType);

    channel.consume(queueName, (message: amqp.ConsumeMessage | null) => {
        if (message === null) return;
        const parsedMessage = JSON.parse(message.content.toString("utf-8"));
        const acktype = handler(parsedMessage);

        switch (acktype) {
            case Acktype.Ack:
                channel.ack(message);
                console.log("Message acknowledged");
                return;
            case Acktype.NackRequeue:
                channel.nack(message, false, true);
                console.log("Message negative acknowledged - requeue");
                return;
            case Acktype.NackDiscard:
                channel.nack(message, false, false);
                console.log("Message negative acknowledged - discard");
                return;
        }
    });
}