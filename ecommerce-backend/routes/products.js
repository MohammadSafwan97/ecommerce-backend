import express from "express";

const app = express.Router();

app.get("/", (req, res) => {
  res.send("products");
});

export default app;
