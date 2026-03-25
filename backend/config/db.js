import mongoose from 'mongoose';

export const connectionDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error('Make sure MongoDB Atlas cluster is accessible and credentials are correct.');
    console.error('Connection details:', process.env.MONGO_URI?.replace(/:[^@]*@/, ':****@'));
    process.exit(1);
  }
};