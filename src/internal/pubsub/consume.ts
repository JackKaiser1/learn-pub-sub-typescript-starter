import amqp from "amqplib";
import { type Channel } from "amqplib";
import { TextDecoder } from "node:util";
import { decode } from "@msgpack/msgpack";
import { type GameLog } from "../gamelogic/logs.js";

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
    handler: (data: T) => Promise<Acktype> | Acktype,
): Promise<void> {
    const [channel, queue] = await declareAndBind(conn, exchange, queueName, key, queueType);

    await channel.prefetch(10);

    channel.consume(queueName, async (message: amqp.ConsumeMessage | null) => {
        if (message === null) return;
        const parsedMessage = JSON.parse(message.content.toString("utf-8"));
        const acktype = await handler(parsedMessage);

        switch (acktype) {
            case Acktype.Ack:
                channel.ack(message);
                return;
            case Acktype.NackRequeue:
                channel.nack(message, false, true);
                return;
            case Acktype.NackDiscard:
                channel.nack(message, false, false);
                return;
        }
    });
}

export async function subscribeMsgPack<T>(
    conn: amqp.ChannelModel,
    exchange: string,
    queueName: string,
    key: string,
    queueType: SimpleQueueType,
    handler: (data: T) => Promise<Acktype> | Acktype, 
): Promise<void> {
    const [ channel ] = await declareAndBind(conn, exchange, queueName, key, queueType);

    await channel.prefetch(10);

    channel.consume(queueName, async (message: amqp.ConsumeMessage | null) => {
        if (message === null) return;

        const decodedMessage = decode(message.content) as any;
        if (!decodedMessage.username
            || !decodedMessage.message
            || !decodedMessage.currentTime
        ) return;

        const acktype = await handler(decodedMessage);

        switch (acktype) {
            case Acktype.Ack: 
                channel.ack(message);
                return;
            case Acktype.NackRequeue:
                channel.nack(message, false, true);
                return;
            case Acktype.NackDiscard:
                channel.nack(message, false, false);
                return;
        }
    });
}