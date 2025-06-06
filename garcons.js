const express = require("express");
const router = express.Router();

module.exports = (db) => {

  router.get("/", (req, res) => {
    const sql = "SELECT id, nome FROM garcons ORDER BY nome";
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error("Error fetching waiters:", err.message);
        return res.status(500).json({ error: "Erro ao buscar garçons." });
      }
      res.status(200).json(rows);
    });
  });

  return router;
};

