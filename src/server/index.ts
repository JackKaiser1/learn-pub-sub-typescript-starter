import amqp from "amqplib";
import { publishJSON } from "../internal/pubsub/publish.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
import { type PlayingState } from "../internal/gamelogic/gamestate.js";
import { printServerHelp, getInput } from "../internal/gamelogic/gamelogic.js";
import { handleError } from "../internal/lib/errorHandler.js";

async function main() {
  const rabbitConnString = "amqp://guest:guest@localhost:5672/";
  const conn = await amqp.connect(rabbitConnString);
  const confirmChannel1 = await conn.createConfirmChannel();

  console.log("Connection successfull");

  printServerHelp();

  while (true) {
    const words = await getInput("Enter command");
    if (!words.length) continue; 

    const cmd = words[0];
    if (cmd === "pause") {
      console.log("Sending pause message");
      await publishJSON<PlayingState>(confirmChannel1, ExchangePerilDirect, PauseKey, { isPaused: true }).catch(handleError);
    }
    else if (cmd === "resume") {
      console.log("Sending resume message");
      await publishJSON<PlayingState>(confirmChannel1, ExchangePerilDirect, PauseKey, { isPaused: false }).catch(handleError);
    }
    else if (cmd === "quit") {
      console.log("Exiting...");
      break;
    }
    else {
      console.log("Command not recognized");
    }
  }



  process.on("SIGINT", () => {
    console.log("Game server is now shutting down");
    conn.close().catch(handleError);
  });

  console.log("Starting Peril server...");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});


