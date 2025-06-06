const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./restaurante.db', (err) => {
    if (err) {
        console.error("❌ Erro ao conectar ao banco:", err.message);
        return;
    }
    console.log("Conectado ao banco SQLite");
    console.log("Iniciando sistema de limpeza/gerenciamento de reservas...");
    console.log("Para implementar no frontend, use as funções de status!");
    verificarReservas();
});

function verificarReservas() {
    console.log("🔍 Verificando reservas atuais...");
    
    db.get(`SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pendente' OR status IS NULL THEN 1 END) as pendentes,
        COUNT(CASE WHEN status = 'atendida' THEN 1 END) as atendidas,
        COUNT(CASE WHEN status = 'cancelada' THEN 1 END) as canceladas
        FROM reservas`, (err, row) => {
        if (err) {
            console.error("❌ Erro ao contar reservas:", err.message);
            return;
        }
        
        console.log(`ESTATÍSTICAS DAS RESERVAS:`);
        console.log(`Total: ${row.total}`);
        console.log(`Pendentes: ${row.pendentes}`);
        console.log(` Atendidas: ${row.atendidas}`);
        console.log(` Canceladas: ${row.canceladas}`);
        
        db.get("SELECT seq FROM sqlite_sequence WHERE name='reservas'", (err, seqRow) => {
            if (seqRow) {
                console.log(` Próximo ID seria: ${seqRow.seq + 1}`);
            }
            
            escolherOpcao();
        });
    });
}

function escolherOpcao() {
    console.log("\n OPÇÕES DISPONÍVEIS:");
    console.log("1️⃣ - Resetar apenas o contador de IDs (manter reservas)");
    console.log("2️⃣ - Deletar todas as reservas E resetar IDs");
    console.log("3️⃣ - Marcar todas as pendentes como atendidas");
    console.log("4️⃣ - Marcar todas as atendidas como pendentes");
    console.log("5️⃣ - Deletar apenas reservas atendidas");
    console.log("6️⃣ - Ver detalhes de todas as reservas");
    console.log("7️⃣ - Testar sistema de status");
    
    const opcao = 6;
    
    switch(opcao) {
        case 1:
            opcaoResetarIDs();
            break;
        case 2:
            opcaoDeletarTudo();
            break;
        case 3:
            opcaoMarcarTodasAtendidas();
            break;
        case 4:
            opcaoMarcarTodasPendentes();
            break;
        case 5:
            opcaoDeletarAtendidas();
            break;
        case 6:
            opcaoVerDetalhes();
            break;
        case 7:
            opcaoTestarSistema();
            break;
        default:
            console.log("❌ Opção inválida!");
            fecharBanco();
    }
}

function opcaoResetarIDs() {
    console.log("🔄 Resetando contador de IDs...");
    db.run("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'reservas'", (err) => {
        if (err) {
            console.error("❌ Erro:", err.message);
        } else {
            console.log("✅ IDs resetados! Próxima reserva será ID = 1");
        }
        fecharBanco();
    });
}

function opcaoDeletarTudo() {
    console.log("🗑️ Deletando todas as reservas...");
    db.run("DELETE FROM reservas", (err) => {
        if (err) {
            console.error("❌ Erro ao deletar:", err.message);
            fecharBanco();
            return;
        }
        
        console.log("✅ Reservas deletadas");
        
        db.run("DELETE FROM sqlite_sequence WHERE name='reservas'", (err) => {
            if (err) {
                console.error("❌ Erro ao resetar sequência:", err.message);
            } else {
                console.log("✅ IDs resetados! Próxima reserva será ID = 1");
            }
            fecharBanco();
        });
    });
}

function opcaoMarcarTodasAtendidas() {
    console.log("✅ Marcando todas as reservas pendentes como atendidas...");
    db.run(
        "UPDATE reservas SET status = 'atendida' WHERE status = 'pendente' OR status IS NULL",
        function(err) {
            if (err) {
                console.error("❌ Erro:", err.message);
            } else {
                console.log(`✅ ${this.changes} reservas marcadas como atendidas!`);
                console.log("🎉 Agora elas não aparecerão mais na área do gerente!");
            }
            fecharBanco();
        }
    );
}

function opcaoMarcarTodasPendentes() {
    console.log("🔄 Marcando todas as reservas atendidas como pendentes...");
    db.run(
        "UPDATE reservas SET status = 'pendente' WHERE status = 'atendida'",
        function(err) {
            if (err) {
                console.error("❌ Erro:", err.message);
            } else {
                console.log(`🔄 ${this.changes} reservas voltaram para pendentes!`);
                console.log("📋 Agora elas aparecerão na área do gerente novamente!");
            }
            fecharBanco();
        }
    );
}

function opcaoDeletarAtendidas() {
    console.log("🗑️ Deletando apenas reservas atendidas...");
    db.run("DELETE FROM reservas WHERE status = 'atendida'", function(err) {
        if (err) {
            console.error("❌ Erro:", err.message);
        } else {
            console.log(`🗑️ ${this.changes} reservas atendidas foram deletadas!`);
            console.log("📋 Reservas pendentes foram mantidas.");
        }
        fecharBanco();
    });
}

function opcaoVerDetalhes() {
    console.log("📋 Carregando detalhes de todas as reservas...");
    
    db.all(
        `SELECT id, nome, telefone, data, hora, pessoas, 
                COALESCE(status, 'pendente') as status,
                observacoes, created_at 
         FROM reservas 
         ORDER BY 
            CASE status 
                WHEN 'pendente' THEN 1 
                WHEN NULL THEN 1 
                WHEN 'atendida' THEN 2 
                WHEN 'cancelada' THEN 3 
            END,
            data ASC, hora ASC`,
        (err, rows) => {
            if (err) {
                console.error("❌ Erro ao carregar reservas:", err.message);
                fecharBanco();
                return;
            }
            
            console.log(`\n📊 TODAS AS RESERVAS (${rows.length} total):`);
            console.log("=".repeat(80));
            
            if (rows.length === 0) {
                console.log("🔍 Nenhuma reserva encontrada.");
            } else {
                rows.forEach(reserva => {
                    const statusIcon = reserva.status === 'atendida' ? '✅' : 
                                     reserva.status === 'cancelada' ? '❌' : '🟡';
                    
                    console.log(`${statusIcon} ID: ${reserva.id} | ${reserva.nome} | ${reserva.telefone}`);
                    console.log(`   📅 Data: ${formatarData(reserva.data)} às ${reserva.hora}`);
                    console.log(`   👥 Pessoas: ${reserva.pessoas} | Status: ${reserva.status.toUpperCase()}`);
                    if (reserva.observacoes) {
                        console.log(`   📝 Obs: ${reserva.observacoes}`);
                    }
                    console.log("   " + "-".repeat(50));
                });
            }
            
            fecharBanco();
        }
    );
}

function opcaoTestarSistema() {
    console.log("🧪 Testando sistema de status...");
    
    console.log("\n🔧 FUNÇÕES DISPONÍVEIS PARA O FRONTEND:");
    
    console.log("1️⃣ marcarComoAtendida(id) - Remove reserva da área do gerente");
    
    console.log("2️⃣ carregarReservasPendentes() - Lista só as que aparecem pro gerente");
    
    console.log("3️⃣ carregarHistorico() - Ver reservas já atendidas");
    
    db.get(
        "SELECT id, nome FROM reservas WHERE status = 'pendente' OR status IS NULL LIMIT 1",
        (err, row) => {
            if (err) {
                console.error("❌ Erro:", err.message);
                fecharBanco();
                return;
            }
            
            if (row) {
                console.log(`\n🎯 TESTE: Marcando reserva "${row.nome}" (ID: ${row.id}) como atendida...`);
                
                db.run(
                    "UPDATE reservas SET status = 'atendida' WHERE id = ?",
                    [row.id],
                    function(err) {
                        if (err) {
                            console.error("❌ Erro no teste:", err.message);
                        } else {
                            console.log("✅ TESTE CONCLUÍDO! Reserva marcada como atendida.");
                            console.log("🎉 Ela não aparecerá mais na área do gerente!");
                            
                            db.get(
                                "SELECT COUNT(*) as count FROM reservas WHERE status = 'pendente' OR status IS NULL",
                                (err, countRow) => {
                                    if (!err) {
                                        console.log(`📊 Restam ${countRow.count} reservas pendentes na área do gerente.`);
                                    }
                                    fecharBanco();
                                }
                            );
                        }
                    }
                );
            } else {
                console.log("ℹ️ Nenhuma reserva pendente encontrada para testar.");
                fecharBanco();
            }
        }
    );
}

function formatarData(data) {
    if (!data) return 'N/A';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

function fecharBanco() {
    db.close((err) => {
        if (err) {
            console.error("❌ Erro ao fechar banco:", err.message);
        } else {
            console.log("🔐 Banco fechado com sucesso!");
        }
        process.exit(0);
    });
}
