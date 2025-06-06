const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./restaurant.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to the SQLite database.");
    setupDatabase();
  }
});

function setupDatabase() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS mesas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_mesa INTEGER UNIQUE NOT NULL,
      capacidade INTEGER NOT NULL CHECK (capacidade BETWEEN 2 AND 5),
      status TEXT NOT NULL DEFAULT 'livre' CHECK (status IN ('livre', 'reservada', 'ocupada'))
    )`, (err) => {
      if (err) {
        console.error("Error creating mesas table:", err.message);
        closeDb();
        return;
      }
      console.log("Table mesas created or already exists.");
      db.get("SELECT COUNT(*) as count FROM mesas", (err, row) => {
        if (err) {
          console.error("Error checking mesas count:", err.message);
          createGarconsTable();
        } else if (row.count === 0) {
          const insertMesa = db.prepare("INSERT INTO mesas (numero_mesa, capacidade) VALUES (?, ?)");
          const mesas = [
            { numero: 1, capacidade: 2 }, { numero: 2, capacidade: 2 },
            { numero: 3, capacidade: 3 }, { numero: 4, capacidade: 3 },
            { numero: 5, capacidade: 4 }, { numero: 6, capacidade: 4 },
            { numero: 7, capacidade: 4 }, { numero: 8, capacidade: 5 },
            { numero: 9, capacidade: 5 }, { numero: 10, capacidade: 5 },
          ];
          mesas.forEach((m) => insertMesa.run(m.numero, m.capacidade));
          insertMesa.finalize((err) => {
            if (err) console.error("Error populating mesas:", err.message);
            else console.log("Mesas table populated.");
            createGarconsTable();
          });
        } else {
          console.log("Mesas table already populated.");
          createGarconsTable();
        }
      });
    });
  });
}

function createGarconsTable() {
  db.run(`CREATE TABLE IF NOT EXISTS garcons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT UNIQUE NOT NULL
    )`, (err) => {
    if (err) {
      console.error("Error creating garcons table:", err.message);
      closeDb();
      return;
    }
    console.log("Table garcons created or already exists.");
    db.get("SELECT COUNT(*) as count FROM garcons", (err, row) => {
      if (err) {
        console.error("Error checking garcons count:", err.message);
        createReservasTable();
      } else if (row.count === 0) {
        const insertGarcon = db.prepare("INSERT INTO garcons (nome) VALUES (?)");
        const garcons = ["Carlos", "Ana", "Pedro", "Sofia", "Miguel"];
        garcons.forEach((g) => insertGarcon.run(g));
        insertGarcon.finalize((err) => {
          if (err) console.error("Error populating garcons:", err.message);
          else console.log("Garcons table populated.");
          createReservasTable();
        });
      } else {
        console.log("Garcons table already populated.");
        createReservasTable();
      }
    });
  });
}

function createReservasTable() {
  db.run(`CREATE TABLE IF NOT EXISTS reservas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT NOT NULL,
      hora TEXT NOT NULL,
      mesa_id INTEGER NOT NULL,
      qtde_pessoas INTEGER NOT NULL,
      nome_responsavel TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'atendida', 'cancelada')),
      garcom_atendimento_id INTEGER NULL,
      FOREIGN KEY (mesa_id) REFERENCES mesas (id),
      FOREIGN KEY (garcom_atendimento_id) REFERENCES garcons (id),
      UNIQUE (data, hora, mesa_id)
    )`, (err) => {
    if (err) {
      console.error("Error creating reservas table:", err.message);
    } else {
      console.log("Table reservas created or already exists.");
    }
    closeDb();
  });
}

function closeDb() {
  db.close((err) => {
    if (err) {
      console.error("Error closing database:", err.message);
    } else {
      console.log("Database setup complete. Connection closed.");
    }
  });
}
