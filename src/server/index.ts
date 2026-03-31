import amqp from "amqplib";
import { publishJSON } from "../internal/pubsub/publish.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
import { type PlayingState } from "../internal/gamelogic/gamestate.js";

async function main() {
  const rabbitConnString = "amqp://guest:guest@localhost:5672/";
  const conn = await amqp.connect(rabbitConnString);
  const confirmChannel1 = await conn.createConfirmChannel();
  
  const playingStateObj: PlayingState = { isPaused: true };

  await publishJSON<PlayingState>(confirmChannel1, ExchangePerilDirect, PauseKey, playingStateObj);

  console.log("Connection successfull");



  process.on("SIGINT", () => {
    console.log("Game server is now shutting down");
    conn.close();
  });

  console.log("Starting Peril server...");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
