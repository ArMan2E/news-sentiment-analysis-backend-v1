import Fluvio from "@fluvio/client";

async function main() {
  try {
    console.log("Attempting Fluvio.connect()...");
    const fluvio = await Fluvio.connect(); // Use static connect
    console.log("Successfully connected via Fluvio.connect()!");

    // Test further: get a consumer
    const consumer = await fluvio.partitionConsumer(
      "google-trends-rss-topic",
      0
    ); // Use your topic/partition
    console.log("Successfully got partition consumer!");

    // You can add streaming logic here if needed for further testing
  } catch (error) {
    console.error("Error during Fluvio connection/usage:", error);
  }
}

main();
