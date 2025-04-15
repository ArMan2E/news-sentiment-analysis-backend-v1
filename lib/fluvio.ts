import Fluvio from "@fluvio/client";

const fluvio = new Fluvio();
// connect to fluvio cluster fluvio.connect()
const fluvioClient = async () => await fluvio.connect();

const fluvioAdmin = async () => {
  await fluvio.connect();
  return await fluvio.admin();
};

const createTopic = async (topic: string) => {
  try {
    // 1st connects to fluvio and returns fluvio.admin()
    const admin = await fluvioAdmin(); // admin creates topic

    // create-topic
    await admin.createTopic(topic); // create the topic with the param topic name
  } catch (error) {
    console.error("Topic already exists ", error);
  }
};
export { fluvio, fluvioClient, createTopic };
