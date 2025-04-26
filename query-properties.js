const sqlite3 = require('sqlite3').verbose();

// Abrir conexão com o banco de dados
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
        process.exit(1);
    }
    console.log('Conectado ao banco de dados SQLite');
});

// Consultar todas as propriedades
db.all(`SELECT * FROM properties LIMIT 10`, [], (err, rows) => {
    if (err) {
        console.error('Erro ao consultar propriedades:', err.message);
        process.exit(1);
    }

    console.log('=== Imóveis ===');
    if (rows.length === 0) {
        console.log('Nenhum imóvel encontrado no banco de dados.');
    } else {
        rows.forEach(row => {
            console.log(`\nID: ${row.id}`);
            console.log(`Código: ${row.code}`);
            console.log(`Título: ${row.title}`);
            console.log(`Tipo: ${row.type}`);
            console.log(`Tipo de Propriedade: ${row.property_type}`);
            console.log(`Preço: R$ ${row.price.toLocaleString('pt-BR')}`);
            console.log(`Status: ${row.status}`);
            console.log(`Bairro: ${row.neighborhood}`);
            console.log(`Cidade: ${row.city}`);
            console.log('---');
        });
    }

    // Fechar conexão
    db.close((err) => {
        if (err) {
            console.error('Erro ao fechar conexão:', err.message);
        }
        console.log('Conexão com o banco de dados fechada');
    });
});