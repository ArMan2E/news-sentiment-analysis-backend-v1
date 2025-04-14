import Fluvio from "@fluvio/client"

const fluvio = new Fluvio();
const fluvioClient = async () => await fluvio.connect();

export {fluvio, fluvioClient};