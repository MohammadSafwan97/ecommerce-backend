import express from "express";
import pool from "../db.js";
const router = express.Router();

// GET /payment-summary/:orderId
router.get("/:orderId", async (req, res) => {
  const orderId = parseInt(req.params.orderId, 10);
  try {
    const { rows } = await pool.query(
      "SELECT * FROM payment_summaries WHERE order_id = $1;",
      [orderId]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

export default router;
