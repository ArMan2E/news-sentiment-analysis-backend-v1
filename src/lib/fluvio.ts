import Fluvio, { SmartModuleType, Offset, FluvioClient } from "@fluvio/client";
// connect to fluvio cluster fluvio.connect()
// const fluvioClient = async () => await fluvio.connect();

// const fluvioAdmin = async () => {
//   await fluvio.connect();
//   return await fluvio.admin();
// };

// const createTopic = async (topic: string) => {
//   try {
//     // 1st connects to fluvio and returns fluvio.admin()
//     const admin = await fluvioAdmin(); // admin creates topic

//     // create-topic
//     await admin.createTopic(topic); // create the topic with the param topic name
//   } catch (error) {
//     console.error("Topic already exists ", error);
//   }
// };

const connectAndStream = async (topic: string) => {
  console.log("Connecting to Fluvio...", topic);
  // console.log(`Fluvio debug...${Fluvio} `)
  const client: FluvioClient = await Fluvio.connect();
  const consumer = await client.partitionConsumer(topic, 0);

  const jsonStreamRecord = await consumer.streamWithConfig(Offset.FromEnd(), {
    smartmoduleType: SmartModuleType.Map,
    smartmoduleName: "fluvio/rss-json@0.1.0", // Make sure this SmartModule is registered/ present
  });

  console.log("Connected and streaming")
  console.log(jsonStreamRecord);
  return jsonStreamRecord
}
export { connectAndStream };
