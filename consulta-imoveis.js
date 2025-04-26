const sqlite3 = require('sqlite3').verbose();
const readline = require('readline');

// Interface para entrada do usuário
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Abrir conexão com o banco de dados
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
        process.exit(1);
    }
    console.log('Conectado ao banco de dados SQLite');

    // Iniciar o menu
    showMenu();
});

// Função para mostrar o menu principal
function showMenu() {
    console.log('\n===== CONSULTA DE IMÓVEIS =====');
    console.log('1. Listar todos os imóveis (resumido)');
    console.log('2. Listar todos os imóveis (detalhado)');
    console.log('3. Buscar imóvel por ID');
    console.log('4. Buscar imóveis por cidade');
    console.log('5. Buscar imóveis por tipo');
    console.log('6. Buscar imóveis por faixa de preço');
    console.log('7. Contar imóveis por status');
    console.log('8. Ver cidades e bairros disponíveis');
    console.log('0. Sair');

    rl.question('\nEscolha uma opção: ', (option) => {
        switch (option) {
            case '1':
                listAllProperties(false);
                break;
            case '2':
                listAllProperties(true);
                break;
            case '3':
                rl.question('Digite o ID do imóvel: ', (id) => {
                    getPropertyById(id);
                });
                break;
            case '4':
                rl.question('Digite a cidade: ', (city) => {
                    getPropertiesByCity(city);
                });
                break;
            case '5':
                rl.question('Digite o tipo (venda/aluguel/lançamento): ', (type) => {
                    getPropertiesByType(type);
                });
                break;
            case '6':
                rl.question('Digite o preço mínimo: ', (min) => {
                    rl.question('Digite o preço máximo: ', (max) => {
                        getPropertiesByPriceRange(min, max);
                    });
                });
                break;
            case '7':
                countPropertiesByStatus();
                break;
            case '8':
                listCitiesAndNeighborhoods();
                break;
            case '0':
                closeApp();
                break;
            default:
                console.log('Opção inválida. Tente novamente.');
                showMenu();
        }
    });
}

// Listar todas as propriedades
function listAllProperties(detailed) {
    const query = 'SELECT * FROM properties ORDER BY id LIMIT 100';

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Erro ao consultar propriedades:', err.message);
            return showMenu();
        }

        console.log(`\n===== IMÓVEIS (${rows.length}) =====`);

        if (rows.length === 0) {
            console.log('Nenhum imóvel encontrado.');
        } else {
            rows.forEach(row => {
                console.log(`\nID: ${row.id} | Código: ${row.code} | ${row.type.toUpperCase()}`);
                console.log(`Título: ${row.title}`);
                console.log(`Tipo: ${row.property_type}`);
                console.log(`Preço: R$ ${row.price?.toLocaleString('pt-BR') || 'N/A'}`);
                console.log(`Local: ${row.neighborhood}, ${row.city}`);

                if (detailed) {
                    console.log(`Endereço: ${row.address || 'N/A'}`);
                    console.log(`CEP: ${row.postal_code || 'N/A'}`);
                    console.log(`Área: ${row.area || 'N/A'} m²`);
                    console.log(`Quartos: ${row.bedrooms || '0'} | Banheiros: ${row.bathrooms || '0'} | Suítes: ${row.suites || '0'} | Vagas: ${row.parking_spaces || '0'}`);
                    console.log(`Mobiliado: ${row.furnished || 'Não'}`);
                    console.log(`Destaque: ${row.featured ? 'Sim' : 'Não'}`);
                    console.log(`Status: ${row.status}`);
                    console.log(`Criado em: ${row.created_at}`);
                    console.log(`Atualizado em: ${row.updated_at || 'N/A'}`);

                    if (row.description) {
                        console.log(`\nDescrição: ${row.description.substring(0, 150)}${row.description.length > 150 ? '...' : ''}`);
                    }
                }

                console.log('----------------------------------------');
            });
        }

        showMenu();
    });
}

// Buscar imóvel por ID
function getPropertyById(id) {
    const query = 'SELECT * FROM properties WHERE id = ?';

    db.get(query, [id], (err, row) => {
        if (err) {
            console.error('Erro ao consultar imóvel:', err.message);
            return showMenu();
        }

        console.log('\n===== DETALHES DO IMÓVEL =====');

        if (!row) {
            console.log(`Nenhum imóvel encontrado com ID ${id}.`);
        } else {
            console.log(`ID: ${row.id} | Código: ${row.code}`);
            console.log(`Título: ${row.title}`);
            console.log(`Tipo de Anúncio: ${row.type}`);
            console.log(`Tipo de Imóvel: ${row.property_type}`);
            console.log(`Preço: R$ ${row.price?.toLocaleString('pt-BR') || 'N/A'}`);
            console.log(`Status: ${row.status}`);
            console.log(`Endereço: ${row.address || 'N/A'}`);
            console.log(`Bairro: ${row.neighborhood}`);
            console.log(`Cidade: ${row.city}`);
            console.log(`CEP: ${row.postal_code || 'N/A'}`);
            console.log(`Área: ${row.area || 'N/A'} m²`);
            console.log(`Quartos: ${row.bedrooms || '0'}`);
            console.log(`Banheiros: ${row.bathrooms || '0'}`);
            console.log(`Suítes: ${row.suites || '0'}`);
            console.log(`Vagas de Garagem: ${row.parking_spaces || '0'}`);
            console.log(`Mobiliado: ${row.furnished || 'Não'}`);
            console.log(`Destaque: ${row.featured ? 'Sim' : 'Não'}`);
            console.log(`Criado em: ${row.created_at}`);
            console.log(`Atualizado em: ${row.updated_at || 'N/A'}`);

            if (row.description) {
                console.log(`\nDescrição:\n${row.description}`);
            }
        }

        // Buscar comodidades associadas ao imóvel
        if (row) {
            db.all('SELECT name FROM property_amenities WHERE property_id = ?', [id], (err, amenities) => {
                if (!err && amenities.length > 0) {
                    console.log('\nComodidades:');
                    amenities.forEach(amenity => {
                        console.log(`- ${amenity.name}`);
                    });
                }

                // Buscar imagens associadas ao imóvel
                db.all('SELECT image_url, is_main FROM property_images WHERE property_id = ?', [id], (err, images) => {
                    if (!err && images.length > 0) {
                        console.log('\nImagens:');
                        images.forEach(img => {
                            console.log(`- ${img.image_url}${img.is_main ? ' (Principal)' : ''}`);
                        });
                    }

                    showMenu();
                });
            });
        } else {
            showMenu();
        }
    });
}

// Buscar imóveis por cidade
function getPropertiesByCity(city) {
    const query = "SELECT * FROM properties WHERE city LIKE ? ORDER BY neighborhood";
    const searchTerm = `%${city}%`;

    db.all(query, [searchTerm], (err, rows) => {
        if (err) {
            console.error('Erro ao consultar imóveis:', err.message);
            return showMenu();
        }

        console.log(`\n===== IMÓVEIS EM "${city}" (${rows.length}) =====`);

        if (rows.length === 0) {
            console.log('Nenhum imóvel encontrado nesta cidade.');
        } else {
            rows.forEach(row => {
                console.log(`\nID: ${row.id} | Código: ${row.code}`);
                console.log(`Título: ${row.title}`);
                console.log(`${row.type.toUpperCase()} | ${row.property_type}`);
                console.log(`Preço: R$ ${row.price?.toLocaleString('pt-BR') || 'N/A'}`);
                console.log(`Bairro: ${row.neighborhood}, ${row.city}`);
                console.log('----------------------------------------');
            });
        }

        showMenu();
    });
}

// Buscar imóveis por tipo
function getPropertiesByType(type) {
    const query = "SELECT * FROM properties WHERE type LIKE ? ORDER BY price";
    const searchTerm = `%${type}%`;

    db.all(query, [searchTerm], (err, rows) => {
        if (err) {
            console.error('Erro ao consultar imóveis:', err.message);
            return showMenu();
        }

        console.log(`\n===== IMÓVEIS DO TIPO "${type}" (${rows.length}) =====`);

        if (rows.length === 0) {
            console.log('Nenhum imóvel encontrado deste tipo.');
        } else {
            rows.forEach(row => {
                console.log(`\nID: ${row.id} | Código: ${row.code}`);
                console.log(`Título: ${row.title}`);
                console.log(`Tipo de Imóvel: ${row.property_type}`);
                console.log(`Preço: R$ ${row.price?.toLocaleString('pt-BR') || 'N/A'}`);
                console.log(`Local: ${row.neighborhood}, ${row.city}`);
                console.log('----------------------------------------');
            });
        }

        showMenu();
    });
}

// Buscar imóveis por faixa de preço
function getPropertiesByPriceRange(min, max) {
    const query = "SELECT * FROM properties WHERE price BETWEEN ? AND ? ORDER BY price";

    db.all(query, [min, max], (err, rows) => {
        if (err) {
            console.error('Erro ao consultar imóveis:', err.message);
            return showMenu();
        }

        console.log(`\n===== IMÓVEIS ENTRE R$ ${parseFloat(min).toLocaleString('pt-BR')} E R$ ${parseFloat(max).toLocaleString('pt-BR')} (${rows.length}) =====`);

        if (rows.length === 0) {
            console.log('Nenhum imóvel encontrado nesta faixa de preço.');
        } else {
            rows.forEach(row => {
                console.log(`\nID: ${row.id} | Código: ${row.code}`);
                console.log(`Título: ${row.title}`);
                console.log(`${row.type.toUpperCase()} | ${row.property_type}`);
                console.log(`Preço: R$ ${row.price?.toLocaleString('pt-BR') || 'N/A'}`);
                console.log(`Local: ${row.neighborhood}, ${row.city}`);
                console.log('----------------------------------------');
            });
        }

        showMenu();
    });
}

// Contar imóveis por status
function countPropertiesByStatus() {
    const query = "SELECT status, COUNT(*) as count FROM properties GROUP BY status ORDER BY count DESC";

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Erro ao consultar estatísticas:', err.message);
            return showMenu();
        }

        console.log('\n===== CONTAGEM DE IMÓVEIS POR STATUS =====');

        if (rows.length === 0) {
            console.log('Nenhum imóvel registrado no banco de dados.');
        } else {
            rows.forEach(row => {
                console.log(`${row.status}: ${row.count} imóveis`);
            });

            // Contar total de imóveis
            db.get("SELECT COUNT(*) as total FROM properties", (err, totalRow) => {
                if (!err) {
                    console.log(`\nTotal de imóveis: ${totalRow.total}`);
                }
                showMenu();
            });
        }
    });
}

// Listar cidades e bairros disponíveis
function listCitiesAndNeighborhoods() {
    const citiesQuery = "SELECT DISTINCT city FROM properties ORDER BY city";

    db.all(citiesQuery, [], (err, cities) => {
        if (err) {
            console.error('Erro ao consultar cidades:', err.message);
            return showMenu();
        }

        console.log('\n===== CIDADES E BAIRROS DISPONÍVEIS =====');

        if (cities.length === 0) {
            console.log('Nenhuma cidade registrada no banco de dados.');
            return showMenu();
        }

        let citiesProcessed = 0;

        cities.forEach(cityRow => {
            const city = cityRow.city;
            const neighborhoodsQuery = "SELECT DISTINCT neighborhood FROM properties WHERE city = ? ORDER BY neighborhood";

            db.all(neighborhoodsQuery, [city], (err, neighborhoods) => {
                if (!err) {
                    console.log(`\n${city}:`);
                    if (neighborhoods.length > 0) {
                        neighborhoods.forEach(n => {
                            console.log(`- ${n.neighborhood}`);
                        });
                    } else {
                        console.log('- Sem bairros registrados');
                    }
                }

                citiesProcessed++;
                if (citiesProcessed === cities.length) {
                    showMenu();
                }
            });
        });
    });
}

// Fechar o aplicativo
function closeApp() {
    console.log('\nFechando conexão com o banco de dados...');
    db.close((err) => {
        if (err) {
            console.error('Erro ao fechar conexão:', err.message);
        }
        console.log('Conexão com o banco de dados fechada');
        console.log('Saindo do aplicativo');
        rl.close();
        process.exit(0);
    });
}

// Tratar encerramento do programa
process.on('SIGINT', function() {
    closeApp();
});