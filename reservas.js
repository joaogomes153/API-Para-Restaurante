const express = require("express");
const router = express.Router();

module.exports = (db) => {

  router.post("/", (req, res) => {
    const { data, hora, numero_mesa, qtde_pessoas, nome_responsavel } = req.body;

    if (!data || !hora || !numero_mesa || !qtde_pessoas || !nome_responsavel) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios: data, hora, numero_mesa, qtde_pessoas, nome_responsavel." });
    }

    if (!/^\d{2}:\d{2}$/.test(hora)) {
        return res.status(400).json({ error: "Formato de hora inválido. Use HH:MM." });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        return res.status(400).json({ error: "Formato de data inválido. Use YYYY-MM-DD." });
    }

    db.get("SELECT id, capacidade, status FROM mesas WHERE numero_mesa = ?", [numero_mesa], (err, mesa) => {
      if (err) {
        console.error("Error finding table:", err.message);
        return res.status(500).json({ error: "Erro ao verificar a mesa." });
      }
      if (!mesa) {
        return res.status(404).json({ error: `Mesa com número ${numero_mesa} não encontrada.` });
      }
      if (qtde_pessoas > mesa.capacidade) {
        return res.status(400).json({ error: `Quantidade de pessoas (${qtde_pessoas}) excede a capacidade da mesa ${numero_mesa} (${mesa.capacidade}).` });
      }

      db.get("SELECT id FROM reservas WHERE mesa_id = ? AND data = ? AND hora = ? AND status = 'pendente'", [mesa.id, data, hora], (err, existingReservation) => {
        if (err) {
          console.error("Error checking existing reservation:", err.message);
          return res.status(500).json({ error: "Erro ao verificar reservas existentes." });
        }
        if (existingReservation) {
          return res.status(409).json({ error: `Mesa ${numero_mesa} já está reservada para ${data} às ${hora}.` });
        }

        const insertSql = `INSERT INTO reservas (data, hora, mesa_id, qtde_pessoas, nome_responsavel, status) VALUES (?, ?, ?, ?, ?, 'pendente')`;
        db.run(insertSql, [data, hora, mesa.id, qtde_pessoas, nome_responsavel], function (err) {
          if (err) {
            console.error("Error creating reservation:", err.message);
            if (err.message.includes("UNIQUE constraint failed")) {
                 return res.status(409).json({ error: `Conflito: Já existe uma reserva para a mesa ${numero_mesa} em ${data} às ${hora}.` });
            }
            return res.status(500).json({ error: "Erro ao criar a reserva." });
          }

          const reservaId = this.lastID;
          db.run("UPDATE mesas SET status = 'reservada' WHERE id = ?", [mesa.id], (updateErr) => {
            if (updateErr) {
              console.error(`Error updating table status for mesa_id ${mesa.id}:`, updateErr.message);
            }
            res.status(201).json({ message: "Reserva criada com sucesso!", reservaId: reservaId });
          });
        });
      });
    });
  });

  router.get("/", (req, res) => {
    const sql = `
      SELECT r.id, r.data, r.hora, m.numero_mesa, r.qtde_pessoas, r.nome_responsavel, r.status, g.nome as garcom_atendimento
      FROM reservas r
      JOIN mesas m ON r.mesa_id = m.id
      LEFT JOIN garcons g ON r.garcom_atendimento_id = g.id
      ORDER BY r.data, r.hora;
    `;
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error("Error fetching reservations:", err.message);
        return res.status(500).json({ error: "Erro ao buscar reservas." });
      }
      res.status(200).json(rows);
    });
  });

  router.get("/:id", (req, res) => {
    const { id } = req.params;
    const sql = `
      SELECT r.id, r.data, r.hora, m.numero_mesa, r.qtde_pessoas, r.nome_responsavel, r.status, g.nome as garcom_atendimento
      FROM reservas r
      JOIN mesas m ON r.mesa_id = m.id
      LEFT JOIN garcons g ON r.garcom_atendimento_id = g.id
      WHERE r.id = ?;
    `;
    db.get(sql, [id], (err, row) => {
      if (err) {
        console.error("Error fetching reservation:", err.message);
        return res.status(500).json({ error: "Erro ao buscar a reserva." });
      }
      if (!row) {
        return res.status(404).json({ error: `Reserva com ID ${id} não encontrada.` });
      }
      res.status(200).json(row);
    });
  });

  router.put("/:id", (req, res) => {
    const { id } = req.params;
    const { data, hora, numero_mesa, qtde_pessoas, nome_responsavel } = req.body;

    if (!data || !hora || !numero_mesa || !qtde_pessoas || !nome_responsavel) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios para atualização." });
    }

    if (!/^\d{2}:\d{2}$/.test(hora)) {
        return res.status(400).json({ error: "Formato de hora inválido. Use HH:MM." });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        return res.status(400).json({ error: "Formato de data inválido. Use YYYY-MM-DD." });
    }

    db.get("SELECT mesa_id FROM reservas WHERE id = ?", [id], (err, reserva) => {
        if (err) {
            console.error("Error finding reservation for update:", err.message);
            return res.status(500).json({ error: "Erro ao verificar a reserva para atualização." });
        }
        if (!reserva) {
            return res.status(404).json({ error: `Reserva com ID ${id} não encontrada para atualização.` });
        }

        const old_mesa_id = reserva.mesa_id;

        db.get("SELECT id, capacidade FROM mesas WHERE numero_mesa = ?", [numero_mesa], (err, mesa) => {
            if (err) {
                console.error("Error finding table for update:", err.message);
                return res.status(500).json({ error: "Erro ao verificar a mesa para atualização." });
            }
            if (!mesa) {
                return res.status(404).json({ error: `Mesa com número ${numero_mesa} não encontrada para atualização.` });
            }
            if (qtde_pessoas > mesa.capacidade) {
                return res.status(400).json({ error: `Quantidade de pessoas (${qtde_pessoas}) excede a capacidade da mesa ${numero_mesa} (${mesa.capacidade}).` });
            }

            const new_mesa_id = mesa.id;

            db.get("SELECT id FROM reservas WHERE mesa_id = ? AND data = ? AND hora = ? AND status = 'pendente' AND id != ?",
                   [new_mesa_id, data, hora, id],
                   (err, existingReservation) => {
                if (err) {
                    console.error("Error checking existing reservation for update:", err.message);
                    return res.status(500).json({ error: "Erro ao verificar conflitos de reserva para atualização." });
                }
                if (existingReservation) {
                    return res.status(409).json({ error: `Conflito: Mesa ${numero_mesa} já está reservada para ${data} às ${hora}.` });
                }

                const updateSql = `UPDATE reservas SET data = ?, hora = ?, mesa_id = ?, qtde_pessoas = ?, nome_responsavel = ? WHERE id = ?`;
                db.run(updateSql, [data, hora, new_mesa_id, qtde_pessoas, nome_responsavel, id], function (err) {
                    if (err) {
                        console.error("Error updating reservation:", err.message);
                         if (err.message.includes("UNIQUE constraint failed")) {
                            return res.status(409).json({ error: `Conflito: Já existe uma reserva para a mesa ${numero_mesa} em ${data} às ${hora}.` });
                        }
                        return res.status(500).json({ error: "Erro ao atualizar a reserva." });
                    }
                    if (this.changes === 0) {
                         return res.status(404).json({ error: `Reserva com ID ${id} não encontrada para atualização (ou dados são idênticos).` });
                    }

                    db.run("UPDATE mesas SET status = 'reservada' WHERE id = ?", [new_mesa_id], (updateErr) => {
                         if (updateErr) console.error(`Error updating new table status ${new_mesa_id}:`, updateErr.message);
                    });

                    if (old_mesa_id !== new_mesa_id) {
                        db.get("SELECT COUNT(*) as count FROM reservas WHERE mesa_id = ? AND status = 'pendente'", [old_mesa_id], (err, result) => {
                            if (!err && result.count === 0) {
                                db.run("UPDATE mesas SET status = 'livre' WHERE id = ? AND status = 'reservada'", [old_mesa_id], (updateOldErr) => {
                                    if (updateOldErr) console.error(`Error updating old table status ${old_mesa_id}:`, updateOldErr.message);
                                });
                            }
                        });
                    }

                    res.status(200).json({ message: `Reserva ${id} atualizada com sucesso.` });
                });
            });
        });
    });
  });

  router.delete("/:id", (req, res) => {
    const { id } = req.params;

    db.get("SELECT mesa_id, status FROM reservas WHERE id = ?", [id], (err, reserva) => {
      if (err) {
        console.error("Error finding reservation for deletion:", err.message);
        return res.status(500).json({ error: "Erro ao buscar reserva para exclusão." });
      }
      if (!reserva) {
        return res.status(404).json({ error: `Reserva com ID ${id} não encontrada.` });
      }

      const { mesa_id, status: reservaStatus } = reserva;

      db.run("DELETE FROM reservas WHERE id = ?", [id], function (err) {
        if (err) {
          console.error("Error deleting reservation:", err.message);
          return res.status(500).json({ error: "Erro ao excluir a reserva." });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: `Reserva com ID ${id} não encontrada para exclusão.` });
        }

        if (reservaStatus === 'pendente') {
            db.get("SELECT COUNT(*) as count FROM reservas WHERE mesa_id = ? AND status = 'pendente'", [mesa_id], (err, result) => {
                if (err) {
                    console.error(`Error checking other reservations for table ${mesa_id} after deletion:`, err.message);
                    res.status(200).json({ message: `Reserva ${id} excluída com sucesso. Erro ao verificar status da mesa.` });
                } else if (result.count === 0) {
                    db.run("UPDATE mesas SET status = 'livre' WHERE id = ? AND status = 'reservada'", [mesa_id], (updateErr) => {
                        if (updateErr) {
                            console.error(`Error updating table status for mesa_id ${mesa_id} after deletion:`, updateErr.message);
                            res.status(200).json({ message: `Reserva ${id} excluída com sucesso. Erro ao atualizar status da mesa.` });
                        } else {
                            res.status(200).json({ message: `Reserva ${id} excluída com sucesso. Status da mesa atualizado para livre.` });
                        }
                    });
                } else {
                    res.status(200).json({ message: `Reserva ${id} excluída com sucesso. Mesa permanece reservada por outras reservas.` });
                }
            });
        } else {
             res.status(200).json({ message: `Reserva ${id} excluída com sucesso.` });
        }
      });
    });
  });

  router.patch("/:id/atender", (req, res) => {
    const { id } = req.params;
    const { garcom_nome } = req.body;

    if (!garcom_nome) {
      return res.status(400).json({ error: "Nome do garçom é obrigatório." });
    }

    db.get("SELECT id FROM garcons WHERE nome = ?", [garcom_nome], (err, garcom) => {
      if (err) {
        console.error("Error finding waiter:", err.message);
        return res.status(500).json({ error: "Erro ao verificar o garçom." });
      }
      if (!garcom) {
        return res.status(404).json({ error: `Garçom com nome '${garcom_nome}' não encontrado.` });
      }

      const garcom_id = garcom.id;

      db.get("SELECT r.id as reserva_id, r.status as reserva_status, r.mesa_id, m.status as mesa_status FROM reservas r JOIN mesas m ON r.mesa_id = m.id WHERE r.id = ?", [id], (err, reservaInfo) => {
        if (err) {
          console.error("Error finding reservation for attendance:", err.message);
          return res.status(500).json({ error: "Erro ao buscar reserva para atendimento." });
        }
        if (!reservaInfo) {
          return res.status(404).json({ error: `Reserva com ID ${id} não encontrada.` });
        }
        if (reservaInfo.reserva_status !== 'pendente') {
          return res.status(400).json({ error: `Reserva ${id} não está pendente (status atual: ${reservaInfo.reserva_status}). Não pode ser marcada como atendida.` });
        }

        const { mesa_id } = reservaInfo;

        const updateReservaSql = "UPDATE reservas SET status = 'atendida', garcom_atendimento_id = ? WHERE id = ?";
        db.run(updateReservaSql, [garcom_id, id], function (err) {
          if (err) {
            console.error("Error updating reservation status to attended:", err.message);
            return res.status(500).json({ error: "Erro ao marcar reserva como atendida." });
          }
          if (this.changes === 0) {
             return res.status(404).json({ error: `Reserva com ID ${id} não encontrada para marcar como atendida.` });
          }

          db.run("UPDATE mesas SET status = 'ocupada' WHERE id = ?", [mesa_id], (updateErr) => {
            if (updateErr) {
              console.error(`Error updating table status to occupied for mesa_id ${mesa_id}:`, updateErr.message);
              res.status(200).json({ message: `Reserva ${id} marcada como atendida por ${garcom_nome}. Erro ao atualizar status da mesa.` });
            } else {
              res.status(200).json({ message: `Reserva ${id} marcada como atendida por ${garcom_nome}. Status da mesa atualizado para ocupada.` });
            }
          });
        });
      });
    });
  });

  return router;
};
