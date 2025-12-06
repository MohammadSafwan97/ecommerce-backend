import express from "express";
import pool from "../db.js";

const router = express.Router();
const client = await pool.connect();
/*
 Test Route
*/
router.get("/", async (req, res) => {
  let response = await client.query("select * from order_items");
  res.send(response.rows);
});

/*
  Create Order
*/
router.post("/create", async (req, res) => {
  const { user_id, delivery_option_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: "user_id is required" });
  }

  //connect the client

  try {
    await client.query("BEGIN");

    /*
     find user
    */
    const cartRes = await client.query(
      "SELECT id FROM carts WHERE user_id = $1;",
      [user_id]
    );

    if (cartRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Cart is empty" });
    }

    const cartId = cartRes.rows[0].id;

    /*
     cart items with price
    */
    const itemsRes = await client.query(
      `SELECT ci.quantity, p.id as product_id, p.price_cents
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = $1;`,
      [cartId]
    );

    if (itemsRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Cart is empty" });
    }

    /*
      calculate the total
    */
    let total = 0;
    for (const item of itemsRes.rows) {
      total += item.quantity * item.price_cents;
    }

    /*
      
    */
    let deliveryCost = 0;

    if (delivery_option_id) {
      const deliveryRes = await client.query(
        "SELECT price_cents FROM delivery_options WHERE id = $1;",
        [delivery_option_id]
      );

      if (deliveryRes.rows.length > 0) {
        deliveryCost = deliveryRes.rows[0].price_cents;
      }
    }

    const finalTotal = total + deliveryCost;

    /*
      create order
    */
    const orderRes = await client.query(
      `INSERT INTO orders (user_id, total_cents, delivery_option_id)
       VALUES ($1, $2, $3)
       RETURNING id;`,
      [user_id, finalTotal, delivery_option_id]
    );

    const orderId = orderRes.rows[0].id;

    /*
      save order items
    */
    for (const item of itemsRes.rows) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents)
         VALUES ($1, $2, $3, $4);`,
        [orderId, item.product_id, item.quantity, item.price_cents]
      );
    }

    /*
      empty the cart
    */
    await client.query("DELETE FROM cart_items WHERE cart_id = $1;", [cartId]);

    /*
      finish the order
    */
    await client.query("COMMIT");

    res.json({
      ok: true,
      order_id: orderId,
      total_cents: finalTotal,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Order creation error:", err);
    res.status(500).json({ error: "Order creation failed" });
  } finally {
    client.release();
  }
});

/*
fetch the order
*/
router.get("/:orderId", async (req, res) => {
  const orderId = parseInt(req.params.orderId, 10);

  try {
    // Get order main info
    const orderRes = await pool.query("SELECT * FROM orders WHERE id = $1;", [
      orderId,
    ]);

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Get items + product info
    const itemsRes = await pool.query(
      `SELECT oi.*, p.name, p.image
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = $1;`,
      [orderId]
    );

    res.json({
      order: orderRes.rows[0],
      items: itemsRes.rows,
    });
  } catch (err) {
    console.error("Order fetch error:", err);
    res.status(500).json({ error: "DB error" });
  }
});

export default router;
