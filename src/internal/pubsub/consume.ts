import amqp from "amqplib";
import { type Channel } from "amqplib";
import { TextDecoder } from "node:util";

export enum SimpleQueueType {
    Durable,
    Transient,
}

export async function declareAndBind(
    conn: amqp.ChannelModel,
    exchange: string,
    queueName: string,
    key: string,
    queueType: SimpleQueueType,
): Promise<[Channel, amqp.Replies.AssertQueue]> {
    const channel = await conn.createChannel();

    let options: Object;

    switch (queueType) {
        case SimpleQueueType.Durable: 
            options = { durable: true };
            break;
        case SimpleQueueType.Transient: 
            options = { autoDelete: true, exclusive: true };
            break;
    }

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
    handler: (data: T) => void,
): Promise<void> {
    const [channel, queue] = await declareAndBind(conn, exchange, queueName, key, queueType);

    channel.consume(queueName, (message: amqp.ConsumeMessage | null) => {
        if (message === null) return;
        const parsedMessage = JSON.parse(message.content.toString("utf-8"));
        handler(parsedMessage);
        channel.ack(message);
    });
}