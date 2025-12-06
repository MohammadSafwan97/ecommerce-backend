import express from "express";
import pool from "../db.js";
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const category = req.query.category;
    if (category) {
      const { rows } = await pool.query(
        "SELECT * FROM products WHERE category=$1",
        [category]
      );
      return res.json(rows);
    }
    const { rows } = await pool.query(
      "SELECT * FROM products ORDER BY id DESC;"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

// GET /products/:id
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rows } = await pool.query("SELECT * FROM products WHERE id = $1;", [
      id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ error: "Product not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

export default router;
