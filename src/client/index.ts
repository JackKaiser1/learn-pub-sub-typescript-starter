import amqp from "amqplib";
import { clientWelcome } from "../internal/gamelogic/gamelogic.js";
import { SimpleQueueType, declareAndBind } from "../internal/pubsub/queue.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
import { handleError } from "../internal/lib/errorHandler.js";

async function main() {
  const rabbitConnString = "amqp://guest:guest@localhost:5672/";
  const conn = await amqp.connect(rabbitConnString);
  const username = await clientWelcome();

  
  const queueChannelTuple = await declareAndBind(conn, 
                                    ExchangePerilDirect, 
                                    `pause.${username}`, 
                                    PauseKey,
                                    SimpleQueueType.Transient);

  process.on("SIGINT", () => {
    console.log("Shutting down game client");
    conn.close().catch(handleError);
  });

  console.log("Starting Peril client...");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

