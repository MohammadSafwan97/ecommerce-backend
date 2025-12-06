import express from "express";
import {
  getAllProducts,
  getProductById,
} from "../controllers/productsController.js";

const router = express.Router();

router.get("/", getAllProducts);
router.get("/:id", getProductById);

export default router;
