import pool from "../db.js";

// GET ALL PRODUCTS
export const getAllProducts = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products;");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
};

// GET PRODUCT BY ID
export const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("SELECT * FROM products WHERE id = $1;", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
};
