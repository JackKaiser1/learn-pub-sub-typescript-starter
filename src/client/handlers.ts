import type { PlayingState, GameState } from "../internal/gamelogic/gamestate.js";
import { handlePause } from "../internal/gamelogic/pause.js";
import { type ArmyMove, type Player } from "../internal/gamelogic/gamedata.js";
import { handleMove, MoveOutcome } from "../internal/gamelogic/move.js";
import { Acktype, declareAndBind, SimpleQueueType } from "../internal/pubsub/consume.js";
import { publishJSON, publishMsgPack } from "../internal/pubsub/publish.js";
import { type Channel } from "amqplib";
import amqp from "amqplib";
import { channel } from "diagnostics_channel";
import { ExchangePerilTopic, GameLogSlug, WarRecognitionsPrefix } from "../internal/routing/routing.js";
import { WarOutcome, type WarResolution, handleWar } from "../internal/gamelogic/war.js";
import { handleError } from "../internal/lib/errorHandler.js";
import { publishGameLog } from "./index.js";
import { type GameLog, writeLog } from "../internal/gamelogic/logs.js";

export type RecognitionOfWar = {
    attacker: Player;
    defender: Player;
}

export function handlerPause(gs: GameState): (ps: PlayingState) => Acktype {
    return (ps: PlayingState) => {
        handlePause(gs, ps);
        console.log("> ");
        return Acktype.Ack;
    };
}

export function handlerPlayerMove(gs: GameState, ch: amqp.ConfirmChannel): (move: ArmyMove) => Promise<Acktype> {
    return async (move: ArmyMove) => {
        const outcome = handleMove(gs, move);
        
        console.log("> ");

        const rw: RecognitionOfWar = {
            attacker: move.player,
            defender: gs.getPlayerSnap(),
        };

        if (outcome === MoveOutcome.Safe) {
            return Acktype.Ack;
        }
        else if (outcome === MoveOutcome.MakeWar) {
            try {
                await publishJSON(ch, ExchangePerilTopic, `${WarRecognitionsPrefix}.${gs.getUsername()}`, rw);
                return Acktype.Ack;
            }
            catch (err) {
                return Acktype.NackRequeue;
            }
        }
        else {
            return Acktype.NackDiscard;
        }
    };
}

export function handlerConsumeWarMessage(gs: GameState, ch: amqp.ConfirmChannel) {
    return async (rw: RecognitionOfWar) => {
        const outcome = handleWar(gs, rw);

        console.log("> ");

        if (outcome.result === WarOutcome.NotInvolved) {
            return Acktype.NackRequeue;
        }
        else if (outcome.result === WarOutcome.NoUnits) {
            return Acktype.NackDiscard;
        }
        else if (outcome.result === WarOutcome.OpponentWon) {
            try {
                await publishGameLog(ch, gs.getUsername(), `${outcome.winner} won a war against ${outcome.loser}`);
                return Acktype.Ack;
            } catch (err) {
                return Acktype.NackRequeue;
            }
        }
        else if (outcome.result === WarOutcome.YouWon) {
            try {
                await publishGameLog(ch, gs.getUsername(), `${outcome.winner} won a war against ${outcome.loser}`);
                return Acktype.Ack;     
            } catch (err) {
                return Acktype.NackRequeue;
            }
        }
        else if (outcome.result === WarOutcome.Draw) {
            try {
                await publishGameLog(ch, gs.getUsername(), `${outcome.attacker} and ${outcome.defender} resulted in a draw`);
                return Acktype.Ack;
            } catch (err) {
                return Acktype.NackRequeue;
            }
        }
        else {
            console.log("Outcome not recognized");
            return Acktype.NackDiscard;
        }
    };
}

// export function handlerLogs(): (log: GameLog) => Promise<Acktype> {
//     return async (log: GameLog) => {
//         try {
//             await writeLog(log);
//             console.log("> ");
//             return Acktype.Ack;
//         } catch (err) {
//             return Acktype.NackDiscard;
//         }
//     };
// }