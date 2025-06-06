const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const port = 3002;

app.use(express.json());
app.use(express.static('public'));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
  next();
});

const db = new sqlite3.Database("./restaurant.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to the SQLite database.");
  }
});

app.get("/", (req, res) => {
  res.status(200).json({ message: "Restaurant Reservation API is running!" });
});

const reservasRoutes = require("./reservas")(db);
const mesasRoutes = require("./mesas")(db);
const garconsRoutes = require("./garcons")(db);
const relatoriosRoutes = require("./relatorios")(db);

app.use("/reservas", reservasRoutes);
app.use("/mesas", mesasRoutes);
app.use("/garcons", garconsRoutes);
app.use("/relatorios", relatoriosRoutes);

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening at http://0.0.0.0:${port}`);
  console.log("✅ Limpeza automática de reservas configurada");
});

// Função para limpar reservas e resetar contador
function limparReservasAoFechar() {
  // Primeiro limpa as reservas
  db.run("DELETE FROM reservas", function(err) {
    if (err) {
      console.error('❌ Erro ao limpar reservas:', err.message);
    } else {
      console.log(`🧹 Reservas limpas automaticamente: ${this.changes} removidas`);
      
      // Depois reseta o contador para começar do ID 1
      db.run("DELETE FROM sqlite_sequence WHERE name='reservas'", function(err) {
        if (err) {
          console.error('❌ Erro ao resetar contador:', err.message);
        } else {
          console.log('🔄 Contador de reservas resetado - próxima reserva será ID 1');
        }
      });
    }
  });
}

// Modificado para incluir limpeza de reservas
process.on("SIGINT", () => {
  console.log('\n🔄 Servidor encerrando... Limpando reservas...');
  
  limparReservasAoFechar();
  
  // Espera um pouco para a limpeza completar, depois fecha o banco
  setTimeout(() => {
    db.close((err) => {
      if (err) {
        console.error(err.message);
      }
      console.log("Closed the database connection.");
      process.exit(0);
    });
  }, 1000); // Espera 1 segundo
});

// Adiciona suporte para SIGTERM também
process.on("SIGTERM", () => {
  console.log('\n🔄 Aplicação encerrando... Limpando reservas...');
  
  limparReservasAoFechar();
  
  setTimeout(() => {
    db.close((err) => {
      if (err) {
        console.error(err.message);
      }
      console.log("Closed the database connection.");
      process.exit(0);
    });
  }, 1000);
});