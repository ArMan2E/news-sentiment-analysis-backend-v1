import mongoose from "mongoose";
import _ from "dotenv/config"

const MONGO_URI = process.env.MONGO_URI!; // ! -> guarantee ts MONGO_URI is defined 

const connectDb = async () => {
	try {
		await mongoose.connect(MONGO_URI,{
			dbName: 'newsdb',// name of db otherwise it will use from connection string
		});
		console.log(`Connected to MongoDb`);
	}catch(error){
		console.error(`Db connection error ${error}`);
		process.exit(1);// need to exit
	}
}

export default connectDb;