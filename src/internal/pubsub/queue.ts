import amqp from "amqplib";
import { type Channel } from "amqplib";

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