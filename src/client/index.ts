import amqp from "amqplib";
import { clientWelcome, getInput, commandStatus, printClientHelp, printQuit } from "../internal/gamelogic/gamelogic.js";
import { SimpleQueueType, declareAndBind, subscribeJSON} from "../internal/pubsub/consume.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
import { handleError } from "../internal/lib/errorHandler.js";
import { GameState } from "../internal/gamelogic/gamestate.js";
import { commandSpawn } from "../internal/gamelogic/spawn.js";
import { commandMove } from "../internal/gamelogic/move.js";
import { constrainedMemory } from "process";
import { handlerPause } from "./handlers.js";

async function main() {
  const rabbitConnString = "amqp://guest:guest@localhost:5672/";
  const conn = await amqp.connect(rabbitConnString);
  const username = await clientWelcome();
  const queueName = `pause.${username}`;
  
  const queueChannelTuple = await declareAndBind(conn, 
                                    ExchangePerilDirect, 
                                    queueName, 
                                    PauseKey,
                                    SimpleQueueType.Transient);


  const state = new GameState(username);

  try {
    await subscribeJSON(conn, 
    ExchangePerilDirect, 
    queueName, 
    PauseKey, 
    SimpleQueueType.Transient, 
    handlerPause(state));
  } catch (err) {
    handleError(err);
  }
  

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

