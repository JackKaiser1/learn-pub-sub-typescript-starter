import type { PlayingState, GameState } from "../internal/gamelogic/gamestate.js";
import { handlePause } from "../internal/gamelogic/pause.js";
import { type ArmyMove } from "../internal/gamelogic/gamedata.js";
import { handleMove } from "../internal/gamelogic/move.js";

export function handlerPause(gs: GameState): (ps: PlayingState) => void {
    return (ps: PlayingState) => {
        handlePause(gs, ps);
        console.log("> ");
    };
}

export function handlerPlayerMove(gs: GameState): (move: ArmyMove) => void {
    return (move: ArmyMove) => {
        const outcome = handleMove(gs, move);
        console.log("> ");
    };
}