import mongoose from 'mongoose';
import { configDotenv } from 'dotenv';
configDotenv();


// connectdb
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://prafullprince3:sdffLNYcHwXR35YD@rent.eyar7.mongodb.net/');
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
};

export default connectDB;
