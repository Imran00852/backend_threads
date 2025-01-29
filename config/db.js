import mongoose from "mongoose";

export const connectDB = async () => {
  await mongoose
    .connect(process.env.MONGO_URI, {
      dbName: "Threads",
    })
    .then((e) => {
      console.log(`DB connected at localhost ${e.connection.host}`);
    })
    .catch((err) => {
      console.log(err);
    });
};
