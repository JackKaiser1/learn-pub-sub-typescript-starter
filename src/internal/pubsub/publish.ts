import type { ConfirmChannel } from "amqplib";

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