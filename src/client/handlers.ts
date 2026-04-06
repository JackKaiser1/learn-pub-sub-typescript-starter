import type { PlayingState, GameState } from "../internal/gamelogic/gamestate.js";
import { handlePause } from "../internal/gamelogic/pause.js";
import { type ArmyMove } from "../internal/gamelogic/gamedata.js";
import { handleMove, MoveOutcome } from "../internal/gamelogic/move.js";
import { Acktype } from "../internal/pubsub/consume.js";



export function handlerPause(gs: GameState): (ps: PlayingState) => Acktype {
    return (ps: PlayingState) => {
        handlePause(gs, ps);
        console.log("> ");
        return Acktype.Ack;
    };
}

export function handlerPlayerMove(gs: GameState): (move: ArmyMove) => Acktype {
    return (move: ArmyMove) => {
        const outcome = handleMove(gs, move);
        
        console.log("> ");


        if (outcome === MoveOutcome.Safe || outcome === MoveOutcome.MakeWar) {
            return Acktype.Ack;
        }
        else {
            return Acktype.NackDiscard;
        }
    };
}