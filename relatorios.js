const express = require("express");
const router = express.Router();

module.exports = (db) => {

  router.get("/periodo", (req, res) => {
    const { data_inicio, data_fim } = req.query;

    if (!data_inicio || !data_fim) {
      return res.status(400).json({ error: "Parâmetros data_inicio e data_fim são obrigatórios." });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data_inicio) || !/^\d{4}-\d{2}-\d{2}$/.test(data_fim)) {
        return res.status(400).json({ error: "Formato de data inválido. Use YYYY-MM-DD." });
    }

    const sql = `
      SELECT r.id, r.data, r.hora, m.numero_mesa, r.qtde_pessoas, r.nome_responsavel, r.status, g.nome as garcom_atendimento
      FROM reservas r
      JOIN mesas m ON r.mesa_id = m.id
      LEFT JOIN garcons g ON r.garcom_atendimento_id = g.id
      WHERE r.data BETWEEN ? AND ?
      ORDER BY r.data, r.hora;
    `;

    db.all(sql, [data_inicio, data_fim], (err, rows) => {
      if (err) {
        console.error("Error fetching report by period:", err.message);
        return res.status(500).json({ error: "Erro ao gerar relatório por período." });
      }
      if (rows.length === 0) {
          return res.status(404).json({ message: `Nenhuma reserva encontrada entre ${data_inicio} e ${data_fim}.` });
      }
      res.status(200).json(rows);
    });
  });

  router.get("/mesa", (req, res) => {
    const { numero_mesa, data_inicio, data_fim } = req.query;

    if (!numero_mesa) {
      return res.status(400).json({ error: "Parâmetro numero_mesa é obrigatório." });
    }

    let sql = `
      SELECT r.id, r.data, r.hora, m.numero_mesa, r.qtde_pessoas, r.nome_responsavel, r.status, g.nome as garcom_atendimento
      FROM reservas r
      JOIN mesas m ON r.mesa_id = m.id
      LEFT JOIN garcons g ON r.garcom_atendimento_id = g.id
      WHERE m.numero_mesa = ?
    `;
    const params = [numero_mesa];

    if (data_inicio && data_fim) {
       if (!/^\d{4}-\d{2}-\d{2}$/.test(data_inicio) || !/^\d{4}-\d{2}-\d{2}$/.test(data_fim)) {
            return res.status(400).json({ error: "Formato de data inválido para filtro. Use YYYY-MM-DD." });
       }
      sql += " AND r.data BETWEEN ? AND ?";
      params.push(data_inicio, data_fim);
    }

    sql += " ORDER BY r.data, r.hora;";

    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error("Error fetching report by table:", err.message);
        return res.status(500).json({ error: "Erro ao gerar relatório por mesa." });
      }
       if (rows.length === 0) {
          let message = `Nenhuma reserva encontrada para a mesa ${numero_mesa}`;
          if(data_inicio && data_fim) message += ` entre ${data_inicio} e ${data_fim}`;
          message += ".";
          return res.status(404).json({ message: message });
      }
      res.status(200).json(rows);
    });
  });

  router.get("/garcom", (req, res) => {
    const { nome, data_inicio, data_fim } = req.query;

    if (!nome) {
      return res.status(400).json({ error: "Parâmetro nome (do garçom) é obrigatório." });
    }

    db.get("SELECT id FROM garcons WHERE nome = ?", [nome], (err, garcom) => {
        if (err) {
            console.error("Error finding waiter for report:", err.message);
            return res.status(500).json({ error: "Erro ao verificar o garçom para o relatório." });
        }
        if (!garcom) {
            return res.status(404).json({ error: `Garçom com nome '${nome}' não encontrado.` });
        }

        const garcom_id = garcom.id;
        let sql = `
          SELECT r.id, r.data, r.hora, m.numero_mesa, r.qtde_pessoas, r.nome_responsavel, r.status, g.nome as garcom_atendimento
          FROM reservas r
          JOIN mesas m ON r.mesa_id = m.id
          JOIN garcons g ON r.garcom_atendimento_id = g.id
          WHERE r.garcom_atendimento_id = ? AND r.status = 'atendida'
        `;
        const params = [garcom_id];

        if (data_inicio && data_fim) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(data_inicio) || !/^\d{4}-\d{2}-\d{2}$/.test(data_fim)) {
                return res.status(400).json({ error: "Formato de data inválido para filtro. Use YYYY-MM-DD." });
            }
            sql += " AND r.data BETWEEN ? AND ?";
            params.push(data_inicio, data_fim);
        }

        sql += " ORDER BY r.data, r.hora;";

        db.all(sql, params, (err, rows) => {
          if (err) {
            console.error("Error fetching report by waiter:", err.message);
            return res.status(500).json({ error: "Erro ao gerar relatório por garçom." });
          }
          if (rows.length === 0) {
              let message = `Nenhuma reserva atendida encontrada para o garçom ${nome}`;
              if(data_inicio && data_fim) message += ` entre ${data_inicio} e ${data_fim}`;
              message += ".";
              return res.status(404).json({ message: message });
          }
          res.status(200).json(rows);
        });
    });
  });

  return router;
};
