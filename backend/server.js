const dotenv = require("dotenv");
const connectDB = require("./config/DB");
const express = require("express");
const v1Router = require("./router/v1Router");
const cors = require("cors");

dotenv.config({
  path: "./backend/config.env",
});
const app = express();

app.use(express.json({ limit: "10mb" }));

app.use(cors());
app.use("/api/v1/", v1Router);

const PORT = process.env.PORT || 5000;
app.listen(PORT, console.log(`run server on ${PORT}`));
connectDB();
