import amqp from "amqplib";
import { clientWelcome, getInput, commandStatus, printClientHelp, printQuit } from "../internal/gamelogic/gamelogic.js";
import { SimpleQueueType, declareAndBind } from "../internal/pubsub/queue.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
import { handleError } from "../internal/lib/errorHandler.js";
import { GameState } from "../internal/gamelogic/gamestate.js";
import { commandSpawn } from "../internal/gamelogic/spawn.js";
import { commandMove } from "../internal/gamelogic/move.js";

async function main() {
  const rabbitConnString = "amqp://guest:guest@localhost:5672/";
  const conn = await amqp.connect(rabbitConnString);
  const username = await clientWelcome();

  
  const queueChannelTuple = await declareAndBind(conn, 
                                    ExchangePerilDirect, 
                                    `pause.${username}`, 
                                    PauseKey,
                                    SimpleQueueType.Transient);

  // console.log("Starting Peril client...");

  const state = new GameState(username);

  while (true) {
    const words = await getInput();
    if (!words.length) continue;

    const cmd = words[0];

    if (cmd === "spawn") {
      try {
        commandSpawn(state, words);
      } catch (err) {
        handleError(err);
      }
    }
    else if (cmd == "move") {
      try {
        commandMove(state, words);
      } catch (err) {
        handleError(err);
      }
    }
    else if (cmd === "status") {
      await commandStatus(state);
    }
    else if (cmd === "help") {
      printClientHelp();
    } 
    else if (cmd === "spam") {
      console.log("Spamming not allowed yet!");
    }
    else if (cmd === "quit") {
      printQuit();
      break;
    }
    else {
      console.log("Command not recognized");
    }
  }

  process.on("SIGINT", () => {
    console.log("Shutting down game client");
    conn.close().catch(handleError);
  });

}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

