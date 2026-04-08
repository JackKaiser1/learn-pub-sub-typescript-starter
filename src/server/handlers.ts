import { type GameLog, writeLog } from "../internal/gamelogic/logs.js";
import { Acktype } from "../internal/pubsub/consume.js";


export function handlerLogs(): (log: GameLog) => Promise<Acktype> {
    return async (log: GameLog) => {
        try {
            await writeLog(log);
            console.log("> ");
            return Acktype.Ack;
        } catch (err) {
            return Acktype.NackDiscard;
        }
    };
}