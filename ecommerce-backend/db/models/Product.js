import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: String,
  description: String,
  image: String,
  stock: Number,
});

export default mongoose.model("Product", productSchema);
