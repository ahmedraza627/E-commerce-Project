import mongoose from 'mongoose';

export const connectDB = async (uri) => {
  mongoose.set('strictQuery', true);
  const conn = await mongoose.connect(uri);
  console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
};

export const disconnectDB = () => mongoose.disconnect();
