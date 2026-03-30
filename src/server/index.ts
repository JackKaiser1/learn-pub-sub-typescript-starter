import amqp from "amqplib";

async function main() {
  const rabbitConnString = "amqp://guest:guest@localhost:5672/";
  const conn = await amqp.connect(rabbitConnString);
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
