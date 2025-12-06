import express from "express";
import pool from "../db.js";
const router = express.Router();

/**
 * POST /orders/create
 * body: { user_id, delivery_option_id }
 * creates an order from the user's cart
 */
router.post("/create", async (req, res) => {
  const { user_id, delivery_option_id } = req.body;
  if (!user_id) return res.status(400).json({ error: "user_id required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // get cart
    const cartRes = await client.query(
      "SELECT id FROM carts WHERE user_id = $1;",
      [user_id]
    );
    if (cartRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Cart empty" });
    }
    const cartId = cartRes.rows[0].id;

    const itemsRes = await client.query(
      `SELECT ci.quantity, p.id as product_id, p.price_cents
       FROM cart_items ci JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = $1;`,
      [cartId]
    );

    if (itemsRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Cart empty" });
    }

    // compute total
    let total = 0;
    for (const it of itemsRes.rows) total += it.quantity * it.price_cents;

    // delivery cost
    let deliveryCost = 0;
    if (delivery_option_id) {
      const d = await client.query(
        "SELECT price_cents FROM delivery_options WHERE id = $1;",
        [delivery_option_id]
      );
      if (d.rows.length > 0) deliveryCost = d.rows[0].price_cents;
    }

    const totalWithDelivery = total + deliveryCost;

    // create order
    const orderInsert = await client.query(
      `INSERT INTO orders (user_id, total_cents, delivery_option_id) VALUES ($1, $2, $3) RETURNING id;`,
      [user_id, totalWithDelivery, delivery_option_id]
    );
    const orderId = orderInsert.rows[0].id;

    // insert order items
    for (const it of itemsRes.rows) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents)
         VALUES ($1, $2, $3, $4);`,
        [orderId, it.product_id, it.quantity, it.price_cents]
      );
    }

    // clear cart
    await client.query("DELETE FROM cart_items WHERE cart_id = $1;", [cartId]);

    await client.query("COMMIT");
    res.json({ ok: true, order_id: orderId, total_cents: totalWithDelivery });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Order creation failed" });
  } finally {
    client.release();
  }
});

// GET /orders/:orderId
router.get("/:orderId", async (req, res) => {
  const orderId = parseInt(req.params.orderId, 10);
  try {
    const { rows } = await pool.query("SELECT * FROM orders WHERE id = $1;", [
      orderId,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ error: "Order not found" });

    const items = await pool.query(
      `SELECT oi.*, p.name, p.image
       FROM order_items oi JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = $1;`,
      [orderId]
    );

    res.json({ order: rows[0], items: items.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

export default router;
