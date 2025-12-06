// express,cors,dotenv,productsRoutes,setup app,use cors, use express.json,use /products productsRoutes,seuptport

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import productRoutes from "./routes/products.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/products", productRoutes);

app.listen(process.env.PORT || 3000, () => {
  console.log("App is running on port ", process.env.PORT);
});
