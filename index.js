import express from "express";
import { config } from "dotenv";
import { connectDB } from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import cookieParser from "cookie-parser";
import cors from "cors";

config({ path: "./.env" });
connectDB();

const app = express();

//parse json data
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

//apis
app.use("/api", userRoutes);
app.use("/api", postRoutes);
app.use("/api", commentRoutes);

//home route
app.get("/", (req, res) => {
  res.send("Welcome to the backend server");
});

app.listen(process.env.PORT, () => {
  console.log(`server is running on port ${process.env.PORT}`);
});
