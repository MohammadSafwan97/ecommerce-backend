import express from "express";
import mongoose from "mongoose";
import("./db/config.js");
// Import User model (make sure path is correct)

const User = import("./db/models/User.js");

const app = express();
const port = 9000;

//Routes

app.get("/", (req, res) => {
  res.send("Hello! Your server is working.");
});

app.get("/add-user", async (req, res) => {});

// Start Server
app.listen(port, () => {
  console.log("🚀 Server is running on port " + port);
});
