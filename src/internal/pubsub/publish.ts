import type { ConfirmChannel } from "amqplib";
import { encode } from "@msgpack/msgpack";

export async function publishJSON<T>(
    ch: ConfirmChannel,
    exchange: string,
    routingKey: string,
    value: T,
): Promise<void> {
    const stringifiedValue = JSON.stringify(value);
    const valueBuffer = Buffer.from(stringifiedValue);
    ch.publish(exchange, routingKey, valueBuffer, { "contentType": "application/json" });
}

export async function publishMsgPack<T>(
    ch: ConfirmChannel,
    exchange: string,
    routingKey: string,
    value: T,
): Promise<void> {
    const encodedValue = encode(value);
    const valueBuffer = Buffer.from(encodedValue.buffer, encodedValue.byteOffset, encodedValue.byteLength);
    ch.publish(exchange, routingKey, valueBuffer, { "contentType": "application/x-msgpack" });
}