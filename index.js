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
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

//apis
app.use("/api", userRoutes);
app.use("/api", postRoutes);
app.use("/api", commentRoutes);

app.listen(process.env.PORT, () => {
  console.log(`server is running on port ${process.env.PORT}`);
});
